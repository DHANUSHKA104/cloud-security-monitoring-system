import datetime
from typing import List
import numpy as np
from .models import VolumeAnomaly, CoverageGap, ResolutionStat


def calculate_volume_anomalies(conn) -> List[VolumeAnomaly]:
    anomalies: List[VolumeAnomaly] = []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT date_trunc('hour', created_at) AS hour_bucket, COUNT(*) AS count
            FROM incidents
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY hour_bucket
            ORDER BY hour_bucket ASC;
        """)
        rows = cur.fetchall()

    if not rows:
        return anomalies

    counts = [r[1] for r in rows]
    mean = float(np.mean(counts))
    std_dev = float(np.std(counts))
    if std_dev < 0.001:
        std_dev = max(float(np.sqrt(mean)), 1.0)

    # Check last 24 hours for spikes
    cutoff_24h = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
    for bucket, count in rows:
        bucket_dt = bucket if bucket.tzinfo else bucket.replace(tzinfo=datetime.timezone.utc)
        if bucket_dt >= cutoff_24h:
            z_score = (count - mean) / std_dev
            if z_score >= 2.0 and count > 0:
                anomalies.append(VolumeAnomaly(
                    windowStart=bucket_dt.isoformat(),
                    count=count,
                    baseline=round(mean, 1),
                    zScore=round(z_score, 1)
                ))

    return anomalies


def calculate_coverage_gaps(conn) -> List[CoverageGap]:
    gaps: List[CoverageGap] = []
    with conn.cursor() as cur:
        # 1. Upcoming shifts
        cur.execute("""
            SELECT starts_at, ends_at
            FROM shifts
            WHERE starts_at < NOW() + INTERVAL '7 days' AND ends_at > NOW();
        """)
        shifts = cur.fetchall()

        # 2. Historical hourly incident load by (dow, hour) over past 8 weeks
        cur.execute("""
            SELECT EXTRACT(DOW FROM created_at)::int AS dow,
                   EXTRACT(HOUR FROM created_at)::int AS hr,
                   COUNT(*)::float / GREATEST(COUNT(DISTINCT date_trunc('day', created_at)), 1) AS avg_load
            FROM incidents
            WHERE created_at >= NOW() - INTERVAL '56 days'
            GROUP BY dow, hr;
        """)
        history_rows = cur.fetchall()

    hist_load_map = {(int(r[0]), int(r[1])): round(float(r[2]), 1) for r in history_rows if r[0] is not None and r[1] is not None}

    now = datetime.datetime.now(datetime.timezone.utc)
    base_date = now.date()
    peak_hours = [0, 8, 16]

    for day_offset in range(3):
        target_date = base_date + datetime.timedelta(days=day_offset)
        dow_name = target_date.strftime("%A").upper()
        dow_num = int(target_date.strftime("%w"))

        for hour in peak_hours:
            slot_time = datetime.datetime(
                target_date.year, target_date.month, target_date.day, hour, 0,
                tzinfo=datetime.timezone.utc
            )
            # Skip past hours
            if slot_time <= now:
                continue

            # Count scheduled analysts during slot_time
            count = 0
            for s_start, s_end in shifts:
                start_dt = s_start if s_start.tzinfo else s_start.replace(tzinfo=datetime.timezone.utc)
                end_dt = s_end if s_end.tzinfo else s_end.replace(tzinfo=datetime.timezone.utc)
                if start_dt <= slot_time < end_dt:
                    count += 1

            # Expected load from history or baseline fallback
            expected_load = hist_load_map.get((dow_num, hour))
            if expected_load is None or expected_load == 0.0:
                expected_load = 3.0 if hour in (8, 16) else 1.5

            if count < 1:
                gaps.append(CoverageGap(
                    dayOfWeek=dow_name,
                    hour=hour,
                    expectedLoad=expected_load,
                    analystsScheduled=count
                ))

    return gaps


def calculate_resolution_stats(conn) -> List[ResolutionStat]:
    stats: List[ResolutionStat] = []
    with conn.cursor() as cur:
        cur.execute("""
            SELECT category, priority, EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60.0 AS duration_min
            FROM incidents
            WHERE status IN ('RESOLVED', 'CLOSED') AND resolved_at IS NOT NULL;
        """)
        rows = cur.fetchall()

    if not rows:
        return stats

    grouped: dict = {}
    for cat, prio, dur in rows:
        key = (cat, prio)
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(float(dur))

    for (cat, prio), durations in grouped.items():
        arr = np.array(durations)
        median_val = float(np.median(arr))
        p90_val = float(np.percentile(arr, 90))
        stats.append(ResolutionStat(
            category=cat,
            priority=prio,
            medianMinutes=round(median_val, 1),
            p90Minutes=round(p90_val, 1),
            samples=len(durations)
        ))

    return stats
