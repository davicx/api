# CloudPilot (Atlas)

**Location:** `startup/atlas` (moved from `startup/startup/atlas`).

---

## Architecture layers

| Layer | Responsibility |
| ----- | -------------- |
| **api/routes** | HTTP only |
| **api/services** | orchestration / flow |
| **api/functions** | validate scope, shape API payloads |
| **api/models** | Pydantic request bodies |
| **core/ec2** | EC2 AWS collection + `run_ec2_scan` orchestration |
| **core/rules** | Rule callables (evaluate one resource dict) |
| **core/shared** | Rule registry + `run_rules` |
| **core/config** | Constants used by rules (thresholds, maps) |
| **core/models** | Data structures (e.g. `Finding`) |

Paths are under `app/` (e.g. `app/api/routes`, `app/api/services`, `app/core/ec2`).

---

## Walkthrough: EC2 scan (rules + scanner)

EC2 rules are registered in **`app/core/shared/registry.py`** (keys like **`low_cpu`** → `low_cpu_rule`, **`old_instance`** → `old_instance_rule`). The **`post_ec2_scan`** flow prints **`STEP 1`** … **`STEP 6`** — search for those in `app/api/services/scan_service.py`.

| Step | Where | What happens |
|------|--------|----------------|
| **1** | `app/api/routes/scan_routes.py` + `app/api/models/scan_models.py` | `POST /scan/ec2` — HTTP entry; Pydantic body; `scope` + optional `region` / `rules`; `?echo=true` skips AWS. |
| **2** | `app/api/services/scan_service.py` | `post_ec2_scan` — normalize/validate scope (`validate_ec2_scope`), pick region (scope `region` overrides request default), call `run_ec2_scan`. |
| **3** | `app/core/ec2/ec2_logic.py` | `run_ec2_scan` — `scan_ec2_instances` → `get_rules_for_service` → `run_rules`. |
| **4** | `app/core/ec2/ec2_scanner.py` | `scan_ec2_instances` — DescribeInstances with scope filters + `launch_time` + CloudWatch avg CPU into plain dicts. |
| **5** | `app/core/shared/registry.py` | `get_rules_for_service("ec2", selected_rules)` — list of rule callables. |
| **6** | `app/core/shared/rule_engine.py` | `run_rules` — for each instance dict, run each rule; collect `Finding`s. |
| **7** | `app/core/rules/ec2/low_cpu.py` | `low_cpu_rule` — uses **`app/core/config/constants.py`** (`CPU_THRESHOLD`, `RIGHTSIZE_MAP`). |
| **—** | `app/core/rules/ec2/old_instance.py` | `old_instance_rule` — `LaunchTime` older than 90 days → finding. |
| **8** | `app/api/functions/scan_helpers.py` | `format_ec2_scan_result_for_api` — response `data` shape (camelCase, optional `scopeFilterNote`). |
| **9** | `scan_routes` | `json_response` — standard envelope around `data` (`resourcesScanned`, `findingCount`, `findings`, `scope`, `region`, `rules`). |

**Try it:** start the API (see Quick start), open `/docs`, execute **POST `/scan/ec2`**. Prefer **`{"scope": {"type": "full"}}`** for a full scan (see **[Scan request body](#scan-request-body)**). Empty `{}` still defaults to full scan.

---

# Quick start

**Create and activate a virtual environment (from repo root):**

If you don’t have a venv yet:

```bash
cd /Users/davidvasquez/Desktop/David/www/startup/atlas
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

If you already have `venv`:

```bash
cd /Users/davidvasquez/Desktop/David/www/startup/atlas
source venv/bin/activate
```

**Create `.env` (required for AI features):**

Create a `.env` file in the atlas root with your OpenAI API key:

```bash
echo "OPENAI_API_KEY=your-openai-api-key-here" > .env
```

Replace `your-openai-api-key-here` with your actual [OpenAI API key](https://platform.openai.com/api-keys). AI explanation features will not work without this.

**Start the REST API:**

Run uvicorn from inside `app/` (so `config` imports resolve). Use the venv path directly:

```bash
cd /Users/davidvasquez/Desktop/David/www/startup/atlas/app
../venv/bin/uvicorn main:app --reload
```

**Routes (core):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hello` | Hello World |
| POST | `/scan/ec2` | EC2 scan — body: `scope` (`full` / `instance` / `tag` / `region`) + optional `region`, `rules` |
| POST | `/check_api_request` | Echo JSON body under `data` (debug; no AWS) |

**Remediation — engine** (`registry`; real AWS for `ec2_toggle`):

| Method | Path | Body (JSON) |
|--------|------|-------------|
| POST | `/remediations/ec2/run` | `{"remediation": "ec2_toggle"}` |
| POST | `/remediations/ec2/undo` | `{"remediation_id": "<uuid from run response>"}` |
| POST | `/remediations/ec2/verify` | `{"remediation": "ec2_toggle"}` |

**Remediation — instructions** (no engine; static responses):

| Method | Path |
|--------|------|
| POST | `/remediations/ec2/manual` |
| POST | `/remediations/ec2/cli` |
| POST | `/remediations/ec2/pr` |

**Remediation — mock resize** (SIMULATED; for testing):

| Method | Path |
|--------|------|
| POST | `/remediations/mock/ec2/auto` |
| POST | `/remediations/mock/ec2/undo` |

- API: **http://127.0.0.1:8000**
- Interactive docs: **http://127.0.0.1:8000/docs**
- Example: **http://127.0.0.1:8000/hello**

If port 8000 is in use: `../venv/bin/uvicorn main:app --reload --port 8001`

---

# Scan request body

**One line:** **Scope** = how you pick resources. **Rules** = what checks you run.

## Design (minimal payload — target contract)

### Short answer

- **Do not** send empty objects as placeholders.
- **Do not** send meaningless defaults (`null` for fields you are not using).
- **Do** send a **minimal, valid** version of your standard shape: `service` → `scope` → optional `rules` → optional `region`.

That keeps contracts consistent for humans, frontends, and (later) AI.

### Why “minimal valid” wins

1. **Readable** — It says exactly what you mean (e.g. “scan all EC2 in this scope”) without noise: no fake nulls, no confusion.
2. **Stable contract** — Same structure every time: `service`, `scope`, and only what you need: `rules` (optional), `region` (optional).
3. **Backend fills defaults** — If `scope.type` is `full`, the service uses `region` if provided, otherwise the default region from config (later: more options). Missing optional fields are handled in one place.

### Best way to say “full scan”

```json
{
  "service": "ec2",
  "scope": {
    "type": "full"
  }
}
```

That’s it.

### What to avoid

**Don’t send nulls for keys you are not using**

```json
{
  "scope": {
    "type": "full",
    "key": null,
    "value": null
  }
}
```

Noisy, harder to read, annoying for clients and AI.

**Don’t send an empty `scope`**

```json
{
  "service": "ec2",
  "scope": {}
}
```

Ambiguous; harder to validate; forces the backend to guess.

### Clean patterns (copy-paste)

**Full scan (minimal)**

```json
{
  "service": "ec2",
  "scope": {
    "type": "full"
  }
}
```

**Full scan + region**

```json
{
  "service": "ec2",
  "scope": {
    "type": "full"
  },
  "region": "us-west-2"
}
```

**Full scan + specific rules** (when the API supports a `rules` list)

```json
{
  "service": "ec2",
  "scope": {
    "type": "full"
  },
  "rules": ["low_cpu"]
}
```

**Tag-based scan** (`match` = tag value in this design language; Atlas uses the field name `value` today — see below)

```json
{
  "service": "ec2",
  "scope": {
    "type": "tag",
    "key": "env",
    "match": "prod"
  }
}
```

### Backend defaults (design rule)

| Field | If missing / not sent |
|-------|-------------------------|
| `region` | Use default region from config (later: other behaviors). |
| `rules` | Run **all** active rules (or registry default). |
| `scope.type` is `full` | Ignore tag-related keys — do not require `key` / `match` / `value`. |

**Principle:** *minimal valid payload* beats *fully populated payload*.

---

## Atlas today — one URL, POST body carries scope

**Endpoint (local):** `POST` **`http://127.0.0.1:8000/scan/ec2`**  
**Path only:** **`/scan/ec2`** — EC2 is fixed by this URL; you do **not** need `service` in the JSON.

### What the old “route-per-scope” table was (and why it’s not this)

Some designs use **many routes** (e.g. `POST /scan/ec2/instance/:id`, `/scan/ec2/region/:region`, …). That is **not** how Atlas works.

Atlas uses **one route** + **`scope` in the body** so you stay minimal and add new scope types without new URLs.

### Body fields Atlas accepts today

| Field | Role |
|-------|------|
| `scope` | Object with `type` and optional `match` / `key` (JSON may still use **`value`** — same as `match`) |
| `scope.type` | `full` \| `instance` \| `tag` \| `region` |
| `scope.match` | Instance id, tag value, or region name (depends on `type`) |
| `scope.key` | Tag **name** when `type` is `tag` |
| `region` | Optional AWS region for the boto session (defaults to `config`) |
| `rules` | Optional list of rule ids (e.g. `["low_cpu"]`, `["old_instance"]`); omit → run **all** registered rules |
| `service` | Optional; if set, must be `"ec2"` (path already implies EC2) |

Scope validation lives in **`api/services/scan_service.py`** (`validate_ec2_scope`), not in the Pydantic models.

### POST `/scan/ec2` — copy-paste bodies

**Full scan (explicit — recommended)**

```json
{
  "scope": {
    "type": "full"
  }
}
```

**Full scan + region**

```json
{
  "scope": {
    "type": "full"
  },
  "region": "us-west-2"
}
```

**Full scan + rule filter**

```json
{
  "scope": {
    "type": "full"
  },
  "rules": ["low_cpu"]
}
```

**Single instance**

```json
{
  "scope": {
    "type": "instance",
    "match": "i-0123456789abcdef0"
  }
}
```

**Tag (e.g. env = prod)**

```json
{
  "scope": {
    "type": "tag",
    "key": "env",
    "match": "prod"
  },
  "region": "us-west-2"
}
```

**Scope type `region`** (session uses `scope.match` as region name; or use `type: "full"` + top-level `region` instead)

```json
{
  "scope": {
    "type": "region",
    "match": "us-west-2"
  }
}
```

**Empty body `{}`** — still accepted; defaults to a full scan (same idea as `"type": "full"`), but prefer an explicit `scope` when you can.

Implementation: `app/api/routes/scan_routes.py` (route), `app/api/models/scan_models.py` (request body models).

---

# Project Overview

**CloudPilot** (Atlas) — An intelligent guidance layer on top of AWS to help you understand infrastructure and control costs. Phase 1 focuses on cost clarity: analyzing usage, spotting over-provisioned resources, and suggesting savings.

---

# Future ideas (not the current API)

- Unified **`POST /scan`** with `"service": "ec2" | "s3"` and optional **`rules`** in the body.
- **S3**, **`filtered`** scopes, org-wide scans — see `comingSoon` / roadmap.

Today, use **`POST /scan/ec2`** and **[Scan request body](#scan-request-body)** above.

---

# Atlas vs API (how the pieces fit)

This is the intended split across **Atlas** (Python) and the **Node API** (`startup/api`). Clients may include web or, later, **iOS** — not fixed to any one UI.

| Layer | Responsibility | Examples |
|--------|----------------|----------|
| **Atlas** | **Rules (Python)** — detect concrete problems from AWS (and similar) data. Deterministic, testable, versioned with JSON config where it helps. | Low CPU (EC2), old instance, missing tags, large instance types; later: more “unused resource” style checks (idle S3 patterns, unattached volumes, etc.). |
| **API (Node)** | **AI + product guidance** (when you lean on it) — turn structured findings into explanations and next steps; orchestrate chat, org context, and permissions. | Explain what a finding means, suggest actions (console / CLI / later auto-fix), thread conversations; **consider org context** (RAG, history, tenancy) as a later layer. |

**Flow (conceptual):** Atlas runs scans → emits **structured findings** (resource ids, metrics, rule ids). The API (or clients) call Atlas or receive those results; **Node-side AI** can interpret and guide without re-implementing detection logic.

**Python AI in Atlas:** Keep the existing helpers available for **occasional** calls (e.g. explain-a-finding) if useful; expect them to be **mostly unused** for now. Primary “interpret + guide” can still land on **Node** when you build that path.

---

# App structure (actual codebase)

The tree below lists Python files under `app/` as of the current layout. **Omitted:** any path under **`comingSoon/`** or **`ORIGINAL/`** (experiments / not mounted by default).

```
atlas/
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── functions/
│   │   │   ├── response_helpers.py      # JSON envelope (data, success, message, …)
│   │   │   └── scan_helpers.py          # validate_ec2_scope, format_ec2_scan_result_for_api
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── scan_models.py           # Pydantic: Ec2ScanRequest / scope
│   │   │   └── remediation_models.py    # Pydantic: remediation route bodies
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── hello.py
│   │   │   ├── scan_routes.py           # POST /scan/ec2, POST /check_api_request
│   │   │   ├── remediation_routes.py    # /remediations/ec2/* + mock_router → /remediations/mock/ec2/*
│   │   │   └── ai_routes.py             # optional; may be commented in main.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── scan_service.py          # post_ec2_scan, check_api_request
│   │       └── remediation_service.py   # mocks + engine (run / undo / verify)
│   │
│   ├── config/
│   │   ├── config.py
│   │   └── aws/
│   │       ├── __init__.py
│   │       ├── sessions.py
│   │       └── clients.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── constants.py             # CPU_THRESHOLD, RIGHTSIZE_MAP (rules)
│   │   ├── ec2/
│   │   │   ├── ec2_scanner.py           # DescribeInstances + CloudWatch; _normalize_ec2_instance
│   │   │   └── ec2_logic.py             # run_ec2_scan → registry → run_rules
│   │   ├── functions/
│   │   │   ├── __init__.py
│   │   │   ├── functions.py
│   │   │   ├── constants.py
│   │   │   ├── ai/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── ai_functions.py
│   │   │   │   └── prompts.py
│   │   │   └── random/
│   │   │       ├── hello_app.py
│   │   │       └── test_aws.py
│   │   ├── models/
│   │   │   ├── finding.py
│   │   │   ├── remediation.py         # Remediation (execute / undo / verify)
│   │   │   ├── remediation_result.py
│   │   │   └── remediation_state.py    # before/after for undo
│   │   ├── remediations/
│   │   │   ├── __init__.py
│   │   │   └── ec2/
│   │   │       ├── __init__.py
│   │   │       └── toggle.py            # ec2_toggle (primary ↔ secondary by tag)
│   │   ├── rules/
│   │   │   ├── __init__.py
│   │   │   └── ec2/
│   │   │       ├── __init__.py
│   │   │       ├── low_cpu.py
│   │   │       └── old_instance.py
│   │   └── shared/
│   │       ├── registry.py              # RULES, get_rules_for_service (scan rules)
│   │       ├── remediation_registry.py  # REMEDIATIONS, get_remediation (engine)
│   │       └── rule_engine.py           # run_rules
│   │
│   └── docs/
│       └── code_backup.py
│
├── venv/
├── docs/
├── requirements.txt
└── ReadMe.md
```

---

# Folder overview

| Folder        | Responsibility   |
| ------------- | ---------------- |
| `config`      | Configuration (profile, region). AWS session/client setup in `config/aws/`. |
| `core`        | **`core/ec2`**, **`core/rules`**, **`core/remediations`**, **`core/shared`** (scan registry + remediation registry + `rule_engine`), **`core/models`**, **`core/config`**. |
| `api`         | REST routes + **`scan_service`** + **`remediation_service`**. Folders **`comingSoon/`** / **`ORIGINAL/`** are omitted from the tree above. |

| Path | Purpose |
|------|--------|
| **`app/main.py`** | Entry point: FastAPI app, AWS connection, routers. |
| **`app/api/`** | REST API layer. |
| **`app/api/functions/response_helpers.py`** | Shared JSON envelope for routes (`json_response`). |
| **`app/api/functions/scan_helpers.py`** | `validate_ec2_scope`, `format_ec2_scan_result_for_api`. |
| **`app/api/models/scan_models.py`** | Pydantic request bodies for scan routes. |
| **`app/api/models/remediation_models.py`** | Pydantic bodies for `/remediations/ec2/*` and mock routes. |
| **`app/api/routes/`** | `hello`, `scan_routes`, **`remediation_routes`** (two routers: `/remediations/ec2/*`, `/remediations/mock/ec2/*`), optional `ai_routes`. |
| **`app/api/services/`** | **`scan_service.py`**, **`remediation_service.py`** (mock resize + engine run/undo/verify). |
| **`app/config/`** | App configuration. |
| **`app/config/config.py`** | `PROFILE`, `REGION`, and scanner constants. |
| **`app/config/aws/`** | AWS session and client setup (`sessions.py`, `clients.py`, package `__init__.py`). |
| **`app/core/functions/`** | Helper functions: print findings, connection info, EC2 check, AWS test. |
| **`app/core/functions/ai/`** | AI explanation helpers (`explain_finding`, `mock_explain_finding`, prompts). |
| **`app/core/models/`** | `Finding`; **`remediation`**, **`remediation_result`**, **`remediation_state`** (engine). |
| **`app/core/ec2/ec2_scanner.py`** | AWS: DescribeInstances + CloudWatch CPU (data only). |
| **`app/core/ec2/ec2_logic.py`** | `run_ec2_scan` — scanner → registry → `run_rules`. |
| **`app/core/rules/ec2/`** | EC2 rule implementations (`low_cpu.py`, `old_instance.py`). |
| **`app/core/shared/registry.py`** | `RULES` / `get_rules_for_service` — scan rule callables per service. |
| **`app/core/shared/remediation_registry.py`** | `REMEDIATIONS` / `get_remediation` — e.g. `ec2_toggle`. |
| **`app/core/shared/rule_engine.py`** | `run_rules(instances, rule_fns)`. |
| **`app/core/remediations/ec2/toggle.py`** | Primary/secondary EC2 toggle (`cloudpilot-role` tag). |
| **`app/core/config/constants.py`** | Thresholds and maps used by rules. |
| **`app/docs/`** | Documentation and code backups. |

---

# Detailed app information

## 1. Tools

What CloudPilot can do:

| Category | Tool | Description |
|----------|------|-------------|
| **Scanners** | EC2 scan | Analyzes EC2 instances for low CPU usage; suggests downsizing (e.g. t3.large → t3.medium). |
| | S3 scan | Legacy sample under `core/ORIGINAL/` (not wired to the active API). |
| | RDS scan | *(Planned)* Idle/underused RDS instances. |
| **Remediations** | Manual / CLI / PR | Static instructions under `/remediations/ec2/manual|cli|pr`. |
| | Engine (`ec2_toggle`) | `POST /remediations/ec2/run` — real stop/start by tag; undo via stored `remediation_id`. |
| | Mock auto / undo | `POST /remediations/mock/ec2/auto|undo` — SIMULATED resize payloads for testing. |
| **AI** | Explain finding | Generates human-readable explanation of a finding (OpenAI). |
| | AI test | Simple connectivity test to OpenAI API. |

**API routes:** See the route tables under **[Quick start](#quick-start)**. Optional `ai_routes` may be commented in `main.py`.

---

## 2. Permissions

AWS credentials (profile `atlas`, region `us-west-2` by default) must have:

| Service | Permission | Used for |
|---------|------------|----------|
| **EC2** | `ec2:DescribeInstances` | List instances for scan. |
| | `ec2:DescribeInstanceAttribute` | Instance details. |
| | `ec2:StopInstances`, `ec2:StartInstances` | Auto resize. |
| | `ec2:ModifyInstanceAttribute` | Change instance type. |
| **CloudWatch** | `cloudwatch:GetMetricStatistics` | CPU usage for EC2 findings. |
| **S3** | `s3:ListBuckets` | List buckets. |
| | `s3:GetBucketLifecycleConfiguration` | Check lifecycle rules. |
| **RDS** | *(Planned)* `rds:DescribeDBInstances` etc. | RDS scanner. |

**.env:** `OPENAI_API_KEY` required for AI features.

---

## 3. AI

Maps user intent → tool → required permission:

| User intent | Tool | Permission(s) |
|-------------|------|---------------|
| "Show me my EC2 cost issues" | EC2 scan | `ec2:DescribeInstances`, `cloudwatch:GetMetricStatistics` |
| "Explain why this instance is flagged" | Explain finding (AI) | `OPENAI_API_KEY` |
| "Resize this instance automatically" | EC2 auto remediation | `ec2:StopInstances`, `ec2:ModifyInstanceAttribute`, `ec2:StartInstances` |
| "Give me AWS CLI commands to fix it" | EC2 CLI remediation | *(Read-only findings)* — no extra write permissions |
| "Check my S3 buckets" | S3 scan | `s3:ListBuckets`, `s3:GetBucketLifecycleConfiguration` |
