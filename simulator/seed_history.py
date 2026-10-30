import argparse
import datetime
import os
import random
from pathlib import Path
from typing import List, Dict, Any
import requests


def load_sim_key_from_env() -> str:
    parent_env = Path(__file__).resolve().parent.parent / ".env"
    if parent_env.exists():
        with open(parent_env, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("SIM_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return os.environ.get("SIM_API_KEY", "")


def generate_history(count: int, seed: int) -> List[Dict[str, Any]]:
    random.seed(seed)
    categories = [
        ("AUTH_ATTACK", ["auth-broker-01.us-east.corp", "idp-gateway-01.corp", "bastion-ssh.corp"]),
        ("NETWORK_INTRUSION", ["edge-gw-01.eu-west.corp", "vpc-nat-gw.us-east.corp"]),
        ("DATA_EXPOSURE", ["s3-archive-bucket.us-east.corp", "rds-postgres-core.corp"]),
        ("MALWARE", ["app-server-04.corp", "nas-cluster-node-03.storage.corp"]),
        ("POLICY_VIOLATION", ["k8s-ingress-controller.corp", "cloud-iam-role-audit.corp"]),
    ]

    priorities = ["P1", "P2", "P3", "P4"]
    priority_weights = [0.10, 0.35, 0.40, 0.15]

    sla_minutes = {
        "P1": 30,
        "P2": 120,
        "P3": 480,
        "P4": 1440,
    }

    analysts = ["alice@cloudsec.local", "bob@cloudsec.local"]
    incidents: List[Dict[str, Any]] = []

    now = datetime.datetime.now(datetime.timezone.utc)

    for i in range(1, count + 1):
        cat_tuple = random.choice(categories)
        category = cat_tuple[0]
        asset = random.choice(cat_tuple[1])
        priority = random.choices(priorities, weights=priority_weights, k=1)[0]
        assignee = random.choice(analysts)

        # Distribute created_at over the past 30 days
        days_ago = random.uniform(0.1, 29.5)
        created_at = now - datetime.timedelta(days=days_ago)

        ack_delay = random.uniform(2, 12)
        ack_at = created_at + datetime.timedelta(minutes=ack_delay)

        resolve_window = sla_minutes[priority]
        sla_due_at = created_at + datetime.timedelta(minutes=resolve_window)

        # 90% meet SLA, 10% breach SLA
        in_sla = random.random() < 0.90
        if in_sla:
            res_delay = random.uniform(5, max(10, resolve_window * 0.85))
            resolved_at = created_at + datetime.timedelta(minutes=res_delay)
        else:
            res_delay = resolve_window + random.uniform(10, 60)
            resolved_at = created_at + datetime.timedelta(minutes=res_delay)

        # Make sure resolved_at is not in the future
        if resolved_at > now:
            resolved_at = now - datetime.timedelta(minutes=5)

        status = "CLOSED" if random.random() < 0.3 else "RESOLVED"
        code = f"INC-2026-H{i:04d}"

        incidents.append({
            "code": code,
            "title": f"Historical incident: {category.lower().replace('_', ' ')} on {asset}",
            "description": f"Resolved historical telemetry record generated for operational baselines. Category: {category}.",
            "priority": priority,
            "status": status,
            "category": category,
            "assetId": asset,
            "riskScore": random.randint(30, 95),
            "createdAt": created_at.isoformat(),
            "acknowledgedAt": ack_at.isoformat(),
            "resolvedAt": resolved_at.isoformat(),
            "slaDueAt": sla_due_at.isoformat(),
            "assigneeEmail": assignee,
        })

    return incidents


def main():
    parser = argparse.ArgumentParser(description="Seed historical incident data")
    parser.add_argument("--count", type=int, default=60, help="Number of historical incidents to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--api", default="http://localhost:8080/api", help="Backend API base URL")
    parser.add_argument("--sim-key", default=None, help="Simulator key")

    args = parser.parse_args()
    sim_key = args.sim_key or load_sim_key_from_env()
    if not sim_key:
        raise ValueError("SIM_API_KEY is required to seed history. Set it in .env or pass --sim-key.")

    print(f"Generating {args.count} historical resolved incidents...")
    batch = generate_history(args.count, args.seed)

    endpoint = f"{args.api.rstrip('/')}/sim/seed"
    headers = {
        "Content-Type": "application/json",
        "X-Sim-Key": sim_key,
    }

    print(f"Sending batch to {endpoint}...")
    try:
        response = requests.post(endpoint, json=batch, headers=headers, timeout=30)
        response.raise_for_status()
        result = response.json()
        print(f"Success! Seeded: {result.get('seeded')} historical incidents.")
    except Exception as e:
        print(f"Failed to seed history: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
