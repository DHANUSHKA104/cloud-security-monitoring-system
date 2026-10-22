from pydantic import BaseModel
from typing import List


class VolumeAnomaly(BaseModel):
    windowStart: str
    count: int
    baseline: float
    zScore: float


class CoverageGap(BaseModel):
    dayOfWeek: str
    hour: int
    expectedLoad: float
    analystsScheduled: int


class ResolutionStat(BaseModel):
    category: str
    priority: str
    medianMinutes: float
    p90Minutes: float
    samples: int


class InsightsResponse(BaseModel):
    available: bool
    volumeAnomalies: List[VolumeAnomaly]
    coverageGaps: List[CoverageGap]
    resolutionStats: List[ResolutionStat]


class HealthResponse(BaseModel):
    status: str
    database: str
