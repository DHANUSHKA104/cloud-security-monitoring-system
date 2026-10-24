import logging
import os
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .database import get_db_connection
from .models import InsightsResponse, HealthResponse
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_analytics_key(x_analytics_key: str = Header(None, alias="X-Analytics-Key")):
    expected_key = os.environ.get("ANALYTICS_API_KEY", "cloudsec-analytics-key")
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
