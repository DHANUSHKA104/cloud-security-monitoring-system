import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from simulate import SCENARIOS, load_sim_key_from_env
from seed_history import generate_history


def test_scenario_templates_completeness():
    expected_scenarios = [
        "brute-force-burst",
        "credential-stuffing",
        "data-exfil",
        "ransomware-canary",
        "network-intrusion",
    ]
    for sc in expected_scenarios:
        assert sc in SCENARIOS
        assert len(SCENARIOS[sc]) > 0
        for item in SCENARIOS[sc]:
            assert "title" in item
            assert "description" in item
            assert "priority" in item
            assert "category" in item
            assert item["priority"] in ["P1", "P2", "P3", "P4"]


def test_generate_history_shape():
    incidents = generate_history(count=10, seed=123)
    assert len(incidents) == 10
    for inc in incidents:
        assert inc["code"].startswith("INC-2026-H")
        assert inc["status"] in ["RESOLVED", "CLOSED"]
        assert inc["priority"] in ["P1", "P2", "P3", "P4"]
        assert inc["createdAt"] is not None
        assert inc["resolvedAt"] is not None
        assert inc["slaDueAt"] is not None
        assert inc["assigneeEmail"] in ["alice@cloudsec.local", "bob@cloudsec.local"]


def test_load_sim_key():
    key = load_sim_key_from_env()
    assert isinstance(key, str)
    assert len(key) > 0
