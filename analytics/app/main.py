import logging
import os
from typing import List
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .database import get_db_connection
from .models import InsightsResponse, HealthResponse, VolumeAnomaly, CoverageGap, ResolutionStat
from .services import (
    calculate_volume_anomalies,
    calculate_coverage_gaps,
    calculate_resolution_stats,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cloudsec.analytics")

app = FastAPI(
    title="CloudSec Analytics Service",
    description="Read-only statistical anomaly and shift coverage analytics service",
    version="1.1.0",
)

# CORS restricted to backend and Vite frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_analytics_key(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    expected_key = os.environ.get("ANALYTICS_API_KEY")
    # If not in env, check .env file
    if not expected_key:
        from pathlib import Path
        parent_env = Path(__file__).resolve().parent.parent.parent / ".env"
        if parent_env.exists():
            with open(parent_env, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("ANALYTICS_API_KEY="):
                        expected_key = line.split("=", 1)[1].strip()
                        break

    if not expected_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ANALYTICS_API_KEY is not configured",
        )
    if not x_analytics_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Analytics-Key header",
        )
    if x_analytics_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid X-Analytics-Key header",
        )
    return x_analytics_key


@app.get("/health", response_model=HealthResponse)
def health():
    db_status = "connected"
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        db_status = "disconnected"

    return HealthResponse(status="UP", database=db_status)


@app.get("/api/anomalies", response_model=List[VolumeAnomaly])
def get_anomalies(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    verify_analytics_key(x_analytics_key)
    with get_db_connection() as conn:
        return calculate_volume_anomalies(conn)


@app.get("/api/coverage", response_model=List[CoverageGap])
def get_coverage(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    verify_analytics_key(x_analytics_key)
    with get_db_connection() as conn:
        return calculate_coverage_gaps(conn)


@app.get("/api/resolution", response_model=List[ResolutionStat])
def get_resolution(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    verify_analytics_key(x_analytics_key)
    with get_db_connection() as conn:
        return calculate_resolution_stats(conn)


@app.get("/api/insights", response_model=InsightsResponse)
def get_insights(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    verify_analytics_key(x_analytics_key)
    try:
        with get_db_connection() as conn:
            anomalies = calculate_volume_anomalies(conn)
            gaps = calculate_coverage_gaps(conn)
            stats = calculate_resolution_stats(conn)

            return InsightsResponse(
                available=True,
                volumeAnomalies=anomalies,
                coverageGaps=gaps,
                resolutionStats=stats,
            )
    except Exception as e:
        logger.error(f"Failed to generate analytics insights: {e}")
        return InsightsResponse(
            available=False,
            volumeAnomalies=[],
            coverageGaps=[],
            resolutionStats=[],
        )
