# CloudSec Analytics Service

FastAPI read-only statistical anomaly and coverage analytics service for the Cloud Security Monitoring System.

## Features
- Resolution statistics (median and 90th percentile resolution minutes per category & priority)
- Incident volume anomaly detection (Z-score > 2.0)
- Shift coverage gap calculation

## Development Setup
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```
