import logging
from fastapi import FastAPI
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
def get_insights():
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
