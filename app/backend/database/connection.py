from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Database configuration - use a persistent path when running in Docker.
# The Volcano Fund Compose service mounts /app/data so flows, briefs and reviews
# survive backend image rebuilds/recreates.
DEFAULT_DATABASE_PATH = Path("/app/data/hedge_fund.db") if Path("/app/data").exists() else Path(__file__).parent.parent / "hedge_fund.db"
DATABASE_PATH = Path(os.getenv("VOLCANO_DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))
DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 