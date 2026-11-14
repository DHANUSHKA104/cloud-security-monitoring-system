import os
from pathlib import Path
import psycopg

def get_connection_string() -> str:
    # Look for .env in parent or current directory
    parent_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if parent_env.exists():
        with open(parent_env, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANALYTICS_DB_URL=") and not os.environ.get("ANALYTICS_DB_URL"):
                    return line.split("=", 1)[1].strip()

    conn_str = os.environ.get("ANALYTICS_DB_URL")
    if not conn_str:
        raise RuntimeError("Missing required environment variable: ANALYTICS_DB_URL")
    return conn_str

def get_db_connection():
    conn_str = get_connection_string()
    return psycopg.connect(conn_str)
