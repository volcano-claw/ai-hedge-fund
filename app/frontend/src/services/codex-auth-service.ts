const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface CodexAuthStatus {
  installed: boolean;
  codex_home: string;
  logged_in: boolean;
  login_method?: string | null;
  message: string;
  active_device_login?: CodexDeviceLogin | null;
}

export interface CodexDeviceLogin {
  verification_url: string;
  user_code: string;
  expires_in_seconds: number;
  already_running?: boolean;
  started_at?: string;
}

export const codexAuthService = {
  async getStatus(): Promise<CodexAuthStatus> {
    const response = await fetch(`${API_BASE_URL}/codex-auth/status`);
    if (!response.ok) {
      throw new Error('Impossible de charger le statut Codex');
    }
    return response.json();
  },

  async startDeviceLogin(): Promise<CodexDeviceLogin> {
    const response = await fetch(`${API_BASE_URL}/codex-auth/device-login`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Impossible de préparer la connexion Codex');
    }
    return response.json();
  },

  async cancelDeviceLogin(): Promise<{ cancelled: boolean }> {
    const response = await fetch(`${API_BASE_URL}/codex-auth/device-login`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Impossible d’annuler la connexion Codex');
    }
    return response.json();
  },
};
