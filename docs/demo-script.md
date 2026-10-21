# Two-Minute Demo Script

This script provides the step-by-step procedure for the final project demonstration.

---

## Preparation
1. Ensure PostgreSQL is running on port 5432.
2. Ensure Spring Boot backend is running on `http://localhost:8080`.
3. Ensure FastAPI analytics service is running on `http://localhost:8000`.
4. Ensure React frontend is running on `http://localhost:5173`.

---

## Demonstration Steps

### Step 1: Demo State Initialization & Login (0:00 - 0:25)
1. Reset the database to a clean, calibrated demo state:
   ```bash
   curl -X POST http://localhost:8080/api/demo/reset -H "X-Sim-Key: <your-sim-key>"
   ```
2. Open `http://localhost:5173/login`.
3. Log in as Administrator (`admin@cloudsec.local`).
4. Present the **Security Dashboard**:
   - Threat Level Gauge (computed from open incident severity weights).
   - SLA Compliance percentage & MTTR metrics.
   - Live activity feed showing initial events.

### Step 2: Live Ingestion & Smart Routing (0:25 - 0:55)
1. In a terminal, run the attack scenario simulator:
   ```bash
   python simulator/simulate.py --scenario brute-force-burst --seed 42 --rate 3
   ```
2. Navigate to the **Incidents** Kanban board.
3. Observe incidents appearing live in the **OPEN** column.
4. Click on an incident to open the **Incident Drawer**:
   - Highlight the **"Why this analyst?"** section.
   - Show the 100-point algorithm breakdown: Skill Match (up to 40), Workload (up to 30), Category History (up to 20), and Shift Runway (up to 10).

### Step 3: SLA Countdown & Two-Tier Escalation (0:55 - 1:25)
1. Focus on an unacknowledged P1 incident.
2. Observe the **SLA Countdown Timer** transitioning from **ON_TRACK** to **AT_RISK**.
3. Point out the background `SlaScheduler`:
   - At 25% window elapsed: Incident escalates to Level 1 (assigned Team Lead).
   - View the **Timeline** tab showing the audit event: `ESCALATED to Level 1`.

### Step 4: Status Workflow & MTTR Impact (1:25 - 1:45)
1. Drag the incident through the Kanban workflow: `OPEN` -> `TRIAGED` -> `IN_PROGRESS` -> `RESOLVED`.
2. Return to the **Dashboard**:
   - Show real-time decrease in Threat Score and updated MTTR.

### Step 5: Shift Handover & Statistical Insights (1:45 - 2:00)
1. Open the **Shift Handover Brief** (`/api/shifts/handover`):
   - Review open incidents by priority, escalated items, and templated summary.
2. View the **Insights Panel** in the Dashboard:
   - Highlight the Volume Anomaly detected from the burst scenario ($z\text{-score} > 2$).
   - Highlight Coverage Gaps identifying upcoming understaffed shifts.
3. Switch login to a Viewer account (`ravi.kumar@cloudsec.local`):
   - Demonstrate role-based access control (read-only view; administrative and mutation actions disabled).
4. State explicitly: *"All cloud data is simulated; breach risk and anomalies are calculated via standard statistics."*
