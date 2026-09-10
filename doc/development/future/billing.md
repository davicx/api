# Billing — Phase B1

**Last reviewed:** 2026-07-04

> Read-only. Answers: **“Where is my money going?”** (AWS)  
> Internal action: `show_billing` · User-facing: **Billing**  
> OpenAI spend is separate: [AI Spending](../finished/feature_ai_spending.md) — do not mix.

---

## Pipeline (same as inventory)

```text
Chat
  ↓ Understanding   → show_billing from natural phrases
  ↓ Decision        → immediate execution (no request row)
  ↓ Action          → billingAWS/billingAWSHandler.js
  ↓ Capability      → billing/getBillingSummary.js
  ↓ Atlas           → POST /billing/summary
  ↓ Speak + Dashboard → Message + Navigator
```

---

## Test phrases

```text
why is my aws bill so high
show my billing
show my aws bill
where is my money going
what am i being charged for
```

---

## Files

### API

```
capabilities/billing/getBillingSummary.js
services/actions/aws/billingAWS/
    billingAWSHandler.js
    atlasBillingFunctions.js
    atlasAWSBillingMessage.js
    atlasAWSBillingNavigator.js
```

### Atlas

```
api/routes/billing_route.py
api/services/billing_service.py
core/cloud/billing/get_spend_by_service.py
api/routes/test/billing_route_test.py   ← mock for Atlas Test mode
```

---

## IAM (required for live billing)

Atlas uses AWS profile **`atlas`** (`config/config.py` → `PROFILE`).

### 1. Enable Cost Explorer (once per account)

AWS Console → **Billing and Cost Management** → **Cost Explorer** → **Launch Cost Explorer** (if prompted).

### 2. Grant Cost Explorer read on the Atlas IAM user/role

Attach a policy like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Verify from your machine

```bash
curl -s -X POST http://127.0.0.1:8000/billing/summary \
  -H "Content-Type: application/json" \
  -d '{"period_days":30}'
```

- **`AccessDeniedException`** → IAM policy missing on the `atlas` profile (most common).
- **`success": true`** → billing works; retry chat.

### Mock billing (no AWS / no IAM)

In `atlas/app/main.py`, comment live billing import and use test:

```python
# from api.routes.billing_route import router as billing_router
from api.routes.test.billing_route_test import router as billing_router
```

Restart Atlas, then chat `why is my aws bill so high` — returns sample EC2/RDS/S3 totals.

---

## SQL seed

```sql
('show_billing', 'AWS Billing', 1)
```

in `doc/sql/master_sql.sql` — re-run seed or insert row if chat returns `action_type_not_found`.

Modern MySQL (8.0.19+):

```sql
INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution)
VALUES ('show_billing', 'AWS Billing', 1)
AS new_action
ON DUPLICATE KEY UPDATE
    display_name = new_action.display_name,
    requires_execution = new_action.requires_execution;
```

---

## Phase B2 (later)

- EC2 / RDS drill-down tables in same Navigator file
- Surprise lines in Message file (no separate rules file yet)

---

## Product flow

```text
Billing   → Where is my money going?
Inventory → What do I have?
Scan      → What should I fix?
Change    → Fix it.
History   → What changed?
```
