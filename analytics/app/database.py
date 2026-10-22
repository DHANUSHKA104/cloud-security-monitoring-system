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

    return os.environ.get(
        "ANALYTICS_DB_URL",
        "postgresql://analytics_ro:analytics_ro_pass_2026@localhost:5432/cloudsec"
    )

def get_db_connection():
    conn_str = get_connection_string()
    return psycopg.connect(conn_str)
