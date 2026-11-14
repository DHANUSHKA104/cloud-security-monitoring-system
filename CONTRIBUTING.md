# Contributing to Cloud Security Monitoring System

Thank you for contributing to the **Cloud Security Monitoring System with Incident Management Assistance**! To maintain high code quality, security posture, and test integrity, please follow these guidelines.

---

## 1. Branching & Git Workflow

- **Never commit directly to `main`**.
- Create feature branches named after your task or module:
  ```bash
  git checkout -b feature/<module-name>
  # Example: git checkout -b feature/auth-enhancements
  ```
- Keep commits atomic and use standard conventional commit prefixes:
  - `feat(...)`: New feature or endpoint
  - `fix(...)`: Bug fix or patch
  - `test(...)`: Adding or updating tests
  - `docs(...)`: Documentation updates
  - `refactor(...)`: Code cleanup without behavior change

---

## 2. Secrets & Security Policy

- **NEVER commit `.env` or any real passwords, API keys, or JWT secrets to Git.**
- Only commit `.env.example` templates with generic placeholder values.
- All secrets are injected at runtime via environment variables.

---

## 3. Database Migrations

- Database migrations use **Flyway**.
- Existing migrations (`V1` through `V5`) are **immutable**. Never modify already-applied migration files.
- If schema changes are needed, create a new sequential migration (e.g., `V6__your_feature.sql`) inside `backend/src/main/resources/db/migration/`.
- Migrations must be **idempotent** (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`).

---

## 4. Local Testing & Verification

Before opening a Pull Request, run the local test suites to ensure zero regressions:

```bash
# 1. Backend tests (Must pass against cloudsec_test)
cd backend
mvn test

# 2. Frontend tests and build check
cd ../frontend
npm test -- --run
npm run build

# 3. Python analytics tests (if analytics modified)
cd ../analytics
pytest -v

# 4. Simulator tests (if simulator modified)
cd ../simulator
pytest -v
```

---

## 5. Submitting a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push -u origin feature/<module-name>
   ```
2. Open a Pull Request into `main`.
3. Complete the Pull Request template checklist.
4. Request review from teammates.
