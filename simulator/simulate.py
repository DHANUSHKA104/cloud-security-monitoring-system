import argparse
import os
import random
import sys
import time
from pathlib import Path
from typing import Dict, Any, List
import requests

SCENARIOS: Dict[str, List[Dict[str, Any]]] = {
    "brute-force-burst": [
        {
            "title": "Repeated failed logins on admin account [T1110.001]",
            "description": "24 failed authentication attempts across 4 external IPs within 90 seconds. Behavioral heuristics flag brute-force spray on administrative console.",
            "priority": "P1",
            "category": "AUTH_ATTACK",
            "assetId": "auth-broker-01.us-east.corp",
            "riskScore": 88,
        },
        {
            "title": "Rapid SSH authentication failures from external IP pool",
            "description": "High-velocity credential guessing detected targeting SSH bastion host. 62 failed attempts recorded from known malicious autonomous system.",
            "priority": "P1",
            "category": "AUTH_ATTACK",
            "assetId": "bastion-ssh-02.us-east.corp",
            "riskScore": 92,
        },
        {
            "title": "MFA push notification fatigue attempt detected",
            "description": "14 consecutive MFA challenge prompts dispatched to SOC lead within 3 minutes followed by geolocational anomaly login.",
            "priority": "P2",
            "category": "AUTH_ATTACK",
            "assetId": "idp-gateway-01.corp",
            "riskScore": 76,
        },
    ],
    "credential-stuffing": [
        {
            "title": "Distributed credential stuffing on customer auth API",
            "description": "Automated credential stuffing activity detected on API endpoint /v1/auth/token. Traffic origin matches known proxy rotation pool.",
            "priority": "P2",
            "category": "AUTH_ATTACK",
            "assetId": "auth-api-gw.prod.corp",
            "riskScore": 74,
        },
        {
            "title": "Bulk account enumeration attempt via password reset",
            "description": "1,200 distinct email requests sent through password reset handler from single cloud egress IP.",
            "priority": "P3",
            "category": "AUTH_ATTACK",
            "assetId": "web-portal-01.prod.corp",
            "riskScore": 52,
        },
    ],
    "data-exfil": [
        {
            "title": "High-volume egress anomaly on storage bucket [T1567]",
            "description": "2.4 GB egress transfer within 5 minutes detected from production customer archive 'cloudsec-prod-assets' to unmapped S3 destination.",
            "priority": "P1",
            "category": "DATA_EXPOSURE",
            "assetId": "s3-archive-bucket.us-east.corp",
            "riskScore": 94,
        },
        {
            "title": "Sensitive database dump query executed by application role",
            "description": "SELECT * query on sensitive telemetry records without paging limit, resulting in 450 MB download over TLS link.",
            "priority": "P2",
            "category": "DATA_EXPOSURE",
            "assetId": "rds-postgres-core.us-east.corp",
            "riskScore": 79,
        },
    ],
    "ransomware-canary": [
        {
            "title": "Canary file modification alert triggered on cluster [T1486]",
            "description": "Critical canary tripwire alert triggered in network share '\\\\storage\\finance'. File extensions modified to '.locked' at 12 files/sec.",
            "priority": "P1",
            "category": "MALWARE",
            "assetId": "nas-cluster-node-03.storage.corp",
            "riskScore": 96,
        },
        {
            "title": "Shadow copy deletion command executed on Windows server",
            "description": "VSSAdmin.exe delete shadows /all /quiet executed via PowerShell process spawned by unexpected parent service.",
            "priority": "P1",
            "category": "MALWARE",
            "assetId": "app-server-04.corp",
            "riskScore": 95,
        },
    ],
    "network-intrusion": [
        {
            "title": "Anomalous internal port sweep detected [T1046]",
            "description": "Horizontal TCP port sweep across internal /24 subnet targeting ports 445, 135, and 3389 originating from development container.",
            "priority": "P2",
            "category": "NETWORK_INTRUSION",
            "assetId": "edge-gw-01.eu-west.corp",
            "riskScore": 68,
        },
        {
            "title": "Unregistered TLS outbound tunnel on non-standard port",
            "description": "Persistent outbound TLS session on port 8443 established to dynamic DNS domain without matching web proxy certificate validation.",
            "priority": "P3",
            "category": "NETWORK_INTRUSION",
            "assetId": "k8s-worker-node-12.corp",
            "riskScore": 48,
        },
    ],
}


def load_sim_key_from_env() -> str:
    parent_env = Path(__file__).resolve().parent.parent / ".env"
    if parent_env.exists():
        with open(parent_env, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SIM_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return os.environ.get("SIM_API_KEY", "cloudsec-sim-key")


def dispatch_incident(api_url: str, sim_key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    endpoint = f"{api_url.rstrip('/')}/sim/incidents"
    headers = {
        "Content-Type": "application/json",
        "X-Sim-Key": sim_key,
    }
    response = requests.post(endpoint, json=payload, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()


def run_simulation(
    scenario_name: str,
    seed: int,
    rate: int,
    duration: int,
    api_url: str,
    sim_key: str,
    dry_run: bool = False,
):
    random.seed(seed)
    templates = SCENARIOS.get(scenario_name)
    if not templates:
        print(f"Unknown scenario: {scenario_name}. Available: {list(SCENARIOS.keys())}")
        sys.exit(1)

    print("=" * 70)
    print("  CLOUD SECURITY MONITORING SYSTEM - ATTACK SIMULATOR")
    print(f"  Scenario: {scenario_name} | Rate: {rate} | Duration: {duration}s")
    if not dry_run:
        print(f"  Target API: {api_url}")
    else:
        print("  Mode: DRY-RUN (deterministic preview)")
    print("=" * 70)

    start_time = time.time()
    total_dispatched = 0

    while True:
        for _ in range(rate):
            template = random.choice(templates).copy()
            # Slightly randomize risk score for realism
            base_risk = template.get("riskScore", 70)
            template["riskScore"] = min(100, max(10, base_risk + random.randint(-4, 4)))

            if dry_run:
                total_dispatched += 1
                print(
                    f"  [DRY-RUN #{total_dispatched}] {template.get('title')} | Priority: {template.get('priority')} | "
                    f"Category: {template.get('category')} | Risk: {template['riskScore']} | Asset: {template.get('assetId')}"
                )
                continue

            try:
                res = dispatch_incident(api_url, sim_key, template)
                total_dispatched += 1
                code = res.get("code", "UNKNOWN")
                prio = res.get("priority", "N/A")
                assignee = res.get("assignee", {}).get("fullName", "Unassigned")
                winner = res.get("assignmentExplanation", {})
                winner_score = "N/A"
                if isinstance(winner, dict) and "candidates" in winner:
                    candidates = winner.get("candidates", [])
                    if candidates:
                        winner_score = f"{candidates[0].get('total', 'N/A')}/100"

                print(
                    f"  [DISPATCH #{total_dispatched}] {code} | {prio} | {template['category']} "
                    f"-> Assignee: {assignee} (Score: {winner_score}) | Asset: {template.get('assetId')}"
                )
            except Exception as e:
                print(f"  [ERROR] Failed to dispatch incident: {e}")

        if dry_run or duration <= 0:
            break

        elapsed = time.time() - start_time
        if elapsed >= duration:
            break

        time.sleep(1.0)

    print("=" * 70)
    if dry_run:
        print(f"  SIMULATION COMPLETE: {total_dispatched} incidents generated (dry-run)")
    else:
        elapsed = time.time() - start_time
        print(f"  SIMULATION COMPLETE: {total_dispatched} incidents ingested in {elapsed:.1f}s")
    print("=" * 70)


def main():
    parser = argparse.ArgumentParser(description="CloudSec Threat Incident Simulator")
    parser.add_argument(
        "--scenario",
        default="brute-force-burst",
        choices=list(SCENARIOS.keys()),
        help="Attack scenario to generate",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic runs")
    parser.add_argument("--rate", type=int, default=3, help="Incidents dispatched per burst")
    parser.add_argument("--duration", type=int, default=0, help="Duration in seconds (0 = single burst)")
    parser.add_argument("--api", default="http://localhost:8080/api", help="Backend API base URL")
    parser.add_argument("--sim-key", default=None, help="Simulator authentication key")
    parser.add_argument("--dry-run", action="store_true", help="Print simulated incidents without sending HTTP requests")

    args = parser.parse_args()
    sim_key = args.sim_key or load_sim_key_from_env()

    run_simulation(
        scenario_name=args.scenario,
        seed=args.seed,
        rate=args.rate,
        duration=args.duration,
        api_url=args.api,
        sim_key=sim_key,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
