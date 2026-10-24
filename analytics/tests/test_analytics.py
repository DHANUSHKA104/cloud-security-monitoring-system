import datetime
import sys
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.services import (
    calculate_volume_anomalies,
    calculate_coverage_gaps,
    calculate_resolution_stats,
)


def test_calculate_volume_anomalies_detects_spike():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    now = datetime.datetime.now(datetime.timezone.utc)
    # Simulate normal hours with count 2, and one spike in the last 2 hours with count 25
    rows = []
    for h in range(48, 2, -1):
        rows.append((now - datetime.timedelta(hours=h), 2))
    rows.append((now - datetime.timedelta(hours=1), 25))

    mock_cur.fetchall.return_value = rows

    anomalies = calculate_volume_anomalies(mock_conn)
    assert len(anomalies) == 1
    assert anomalies[0].count == 25
    assert anomalies[0].zScore >= 2.0


def test_calculate_coverage_gaps():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    # No upcoming shifts scheduled
    mock_cur.fetchall.return_value = []

    gaps = calculate_coverage_gaps(mock_conn)
    # 3 days * 3 peak slots = 9 gaps
    assert len(gaps) == 9
    assert all(g.analystsScheduled == 0 for g in gaps)


def test_calculate_resolution_stats():
    mock_conn = MagicMock()
    mock_cur = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cur

    # 5 incidents resolved for (AUTH_ATTACK, P1) with minutes: [10, 20, 30, 40, 50]
    mock_cur.fetchall.return_value = [
        ("AUTH_ATTACK", "P1", 10.0),
        ("AUTH_ATTACK", "P1", 20.0),
        ("AUTH_ATTACK", "P1", 30.0),
        ("AUTH_ATTACK", "P1", 40.0),
        ("AUTH_ATTACK", "P1", 50.0),
    ]

    stats = calculate_resolution_stats(mock_conn)
    assert len(stats) == 1
    assert stats[0].category == "AUTH_ATTACK"
    assert stats[0].priority == "P1"
    assert stats[0].medianMinutes == 30.0
    assert stats[0].samples == 5


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"


def test_insights_missing_key_returns_401():
    client = TestClient(app)
    response = client.get("/api/insights")
    assert response.status_code == 401


def test_insights_wrong_key_returns_403():
    client = TestClient(app)
    response = client.get("/api/insights", headers={"X-Analytics-Key": "wrong-key"})
    assert response.status_code == 403
