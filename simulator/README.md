# CloudSec Incident & Attack Simulator

Python simulator for live incident generation and historical data seeding.

## Requirements
- Python 3.11+
- Virtual environment with pinned dependencies

## Usage
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate

pip install -r requirements.txt

# Run a live scenario:
python simulate.py --scenario brute-force-burst --seed 42 --rate 3 --api http://localhost:8080/api

# Seed historical resolved incidents:
python seed_history.py --count 200 --seed 42 --api http://localhost:8080/api
```
