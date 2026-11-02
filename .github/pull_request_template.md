## Description
Briefly describe the purpose of this Pull Request and the changes introduced.

---

## Affected Modules
Check all modules affected by this change:
- [ ] Module 01: Auth & RBAC
- [ ] Module 02: User & Team Management
- [ ] Module 03: Security Dashboard
- [ ] Module 05: Incident Management & Smart Routing
- [ ] Module 08: Asset Inventory
- [ ] Module 10: Response Playbooks
- [ ] Supporting Service (FastAPI Analytics / Threat Simulator)

---

## Quality & Security Checklist
Please verify the following before requesting review:
- [ ] No secrets, passwords, `.env` files, or API keys are committed.
- [ ] Existing Flyway migrations (`V1`–`V5`) have NOT been modified. Any schema changes are additive in a new version.
- [ ] Backend tests pass: `mvn test` (74+ tests passing against `cloudsec_test`).
- [ ] Frontend tests and build pass: `npm test -- --run` and `npm run build`.
- [ ] Object-level RBAC is respected (Viewers remain strictly read-only; Analysts restricted to their own squad).
- [ ] Documentation updated (README, API contract, or decisions log if applicable).

---

## Testing Evidence
Provide a brief summary or log snippet showing test execution.
