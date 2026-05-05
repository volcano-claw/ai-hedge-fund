import os
import re
import select
import shutil
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/codex-auth", tags=["codex-auth"])

CODEX_HOME = Path(os.getenv("VOLCANO_CODEX_HOME", "/app/data/codex-home"))
CODEX_BIN = os.getenv("VOLCANO_CODEX_BIN", "codex")
DEVICE_URL_RE = re.compile(r"https://auth\.openai\.com/codex/device")
DEVICE_CODE_RE = re.compile(r"\b[A-Z0-9]{4}-[A-Z0-9]{4,6}\b")
ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")

_active_lock = threading.Lock()
_active_login: dict[str, Any] | None = None


def _codex_env() -> dict[str, str]:
    CODEX_HOME.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["CODEX_HOME"] = str(CODEX_HOME)
    env.setdefault("HOME", "/tmp")
    return env


def _sanitize(text: str) -> str:
    text = DEVICE_CODE_RE.sub("[DEVICE_CODE]", text)
    text = re.sub(r"(?i)(token|secret|password|api[_-]?key)\S*", "[REDACTED]", text)
    return text.strip()


def _codex_available() -> bool:
    return shutil.which(CODEX_BIN) is not None


def _status_payload() -> dict[str, Any]:
    installed = _codex_available()
    payload: dict[str, Any] = {
        "installed": installed,
        "codex_home": str(CODEX_HOME),
        "logged_in": False,
        "login_method": None,
        "message": "Codex CLI introuvable dans le backend Volcano Fund." if not installed else "Codex CLI disponible.",
    }

    if installed:
        try:
            proc = subprocess.run(
                [CODEX_BIN, "login", "status"],
                env=_codex_env(),
                text=True,
                capture_output=True,
                timeout=10,
            )
            output = _sanitize((proc.stdout or "") + "\n" + (proc.stderr or ""))
            payload["message"] = output or "Statut Codex inconnu."
            payload["logged_in"] = "Logged in" in output
            if "ChatGPT" in output:
                payload["login_method"] = "ChatGPT"
            elif "API" in output:
                payload["login_method"] = "API key"
        except Exception as exc:  # pragma: no cover - defensive runtime guard
            payload["message"] = f"Statut Codex impossible: {type(exc).__name__}"

    with _active_lock:
        active = _active_login
        if active and active.get("process") and active["process"].poll() is None:
            payload["active_device_login"] = {
                "verification_url": active.get("verification_url"),
                "user_code": active.get("user_code"),
                "started_at": active.get("started_at"),
                "expires_in_seconds": active.get("expires_in_seconds", 900),
            }
        else:
            payload["active_device_login"] = None

    return payload


def _drain_process(process: subprocess.Popen[Any]) -> None:
    try:
        if process.stdout:
            while process.poll() is None:
                ready, _, _ = select.select([process.stdout], [], [], 0.5)
                if ready:
                    try:
                        os.read(process.stdout.fileno(), 4096)
                    except Exception:
                        break
        process.wait(timeout=900)
    except Exception:
        try:
            process.terminate()
        except Exception:
            pass


@router.get("/status")
def get_codex_status() -> dict[str, Any]:
    return _status_payload()


@router.post("/device-login")
def start_device_login() -> dict[str, Any]:
    global _active_login

    if not _codex_available():
        raise HTTPException(status_code=503, detail="Codex CLI introuvable dans le backend Volcano Fund.")

    with _active_lock:
        if _active_login and _active_login.get("process") and _active_login["process"].poll() is None:
            return {
                "verification_url": _active_login.get("verification_url"),
                "user_code": _active_login.get("user_code"),
                "expires_in_seconds": _active_login.get("expires_in_seconds", 900),
                "already_running": True,
            }

    command = [CODEX_BIN, "login", "--device-auth"]
    if shutil.which("script"):
        command = ["script", "-qfec", f"{CODEX_BIN} login --device-auth", "/dev/null"]

    process = subprocess.Popen(
        command,
        env=_codex_env(),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        bufsize=0,
    )

    captured: list[str] = []
    verification_url: str | None = None
    user_code: str | None = None
    deadline = time.time() + 12

    while time.time() < deadline and process.poll() is None:
        assert process.stdout is not None
        ready, _, _ = select.select([process.stdout], [], [], 0.2)
        if not ready:
            continue
        chunk = ANSI_RE.sub("", os.read(process.stdout.fileno(), 4096).decode("utf-8", "ignore"))
        if not chunk:
            continue
        captured.append(chunk)
        if DEVICE_URL_RE.search(chunk):
            verification_url = DEVICE_URL_RE.search(chunk).group(0)  # type: ignore[union-attr]
        code_match = DEVICE_CODE_RE.search(chunk)
        if code_match:
            user_code = code_match.group(0)
        if verification_url and user_code:
            break

    if not verification_url or not user_code:
        try:
            process.terminate()
        except Exception:
            pass
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Impossible de récupérer le code device Codex.",
                "output": _sanitize("".join(captured)),
            },
        )

    with _active_lock:
        _active_login = {
            "process": process,
            "verification_url": verification_url,
            "user_code": user_code,
            "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "expires_in_seconds": 900,
        }

    threading.Thread(target=_drain_process, args=(process,), daemon=True).start()

    return {
        "verification_url": verification_url,
        "user_code": user_code,
        "expires_in_seconds": 900,
        "already_running": False,
    }


@router.delete("/device-login")
def cancel_device_login() -> dict[str, bool]:
    with _active_lock:
        active = _active_login
        if active and active.get("process") and active["process"].poll() is None:
            active["process"].terminate()
            return {"cancelled": True}
    return {"cancelled": False}
