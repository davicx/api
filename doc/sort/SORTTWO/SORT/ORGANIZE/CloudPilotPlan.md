# AWS Cost Optimizer — 7-Day MVP Plan

This document maps the MVP definition to the codebase and your existing start in `atlas/hello.py`. Each day ends with something working.

---

## What You Already Have (`atlas/hello.py`)

- **EC2**: List running instances, 14-day CloudWatch CPU average, over-provisioned detection (CPU &lt; 10%).
- **Suggestions**: `savings_map` for instance downgrades (t3.large→t3.medium, etc.) with rough $/month.
- **Output**: Console text with ⚠️/✓ and basic formatting.
- **Config**: Single region (`us-west-2`), profile `atlas`, boto3 EC2 + CloudWatch.

**Gaps vs MVP:** No repo structure, no EB/RDS/S3, no EB-vs-standalone split, no confidence levels, no ignore tag, no report grouping/summary/JSON/filters, no RDS/S3 at all.

---

## Day 1 — Solidify scope & structure

**Goal:** Lock the MVP so you don’t thrash later.

| Task | Action |
|------|--------|
| Create repo structure | Add `aws-cost-optimizer/` (or move under `atlas/`) with `scanner/` (ec2.py, elasticbeanstalk.py, rds.py, s3.py), `report/formatter.py`, `main.py`. |
| One output format | Console text first (you already have this in hello.py). |
| One region | Keep `us-west-2` (or make it configurable via env/flag later). |
| Read-only IAM | Document policy for EC2, Elastic Beanstalk, RDS, S3, CloudWatch; optional Cost Explorer. |
| README | 10-line README: what the tool does, how to run, IAM note. |

**Reuse from hello.py:**  
- Move EC2 listing + CloudWatch CPU + over-provision logic into `scanner/ec2.py`.  
- Keep `savings_map` (or equivalent) in ec2 scanner.  
- Have `main.py` call the EC2 scanner and print something so “run and it prints” works.

**End of day:** `python main.py` prints something (e.g. EC2 scan only).

---

## Day 2 — Elastic Beanstalk scan

**Goal:** Make EB visible (environments → instances → CPU).

| Task | Action |
|------|--------|
| List EB apps + envs | Use `elasticbeanstalk.describe_applications`, `describe_environments`. |
| Map EB env → EC2 | Use environment’s instance IDs or ASG → instances. |
| CPU for EB instances | Reuse CloudWatch CPU logic (14-day avg) for those instance IDs. |
| Flag low CPU / big types | CPU &lt; 10–15%, instance type &gt; t3.medium; suggest downgrade. |
| Output format | Match plan: App, Env, Instance type, Avg CPU, Suggestion. |

**Reuse:** Same CloudWatch `get_metric_statistics` pattern and period as in hello.py; shared helper for “avg CPU from datapoints” if you extract it.

**End of day:** EB section in report with over-provision findings.

---

## Day 3 — EC2 (non-EB) + polish

**Goal:** Trustworthy EC2: separate EB vs standalone, fewer false positives.

| Task | Action |
|------|--------|
| Split EC2 | EB-managed (from Day 2) vs standalone; only report standalone in “EC2” section (or label which is which). |
| Spike detection | Max CPU in last 14 days (CloudWatch `Maximum` in addition to `Average`). |
| Confidence | HIGH / MEDIUM / LOW (e.g. low avg + low max = HIGH; low avg + high max = LOW). |
| Ignore tag | Skip instances with `cost-optimizer:ignore=true`. |

**Reuse:** Your existing EC2 + CloudWatch code; add one more `Statistics=["Maximum"]` (or second call) and tag filter.

**End of day:** EC2 section has confidence levels and no double-counting with EB.

---

## Day 4 — RDS scan

**Goal:** Find obvious RDS waste without touching databases.

| Task | Action |
|------|--------|
| List RDS instances | `rds.describe_db_instances`. |
| Metrics | CPUUtilization, FreeableMemory, DatabaseConnections (14-day avg/max). |
| Detect | Low CPU (&lt; 15%), low connections, high free memory → suggest smaller class. |
| Storage | Flag gp2 → suggest gp3. |
| Output | Conservative recommendations only. |

**Reuse:** Same CloudWatch pattern (different namespace/dimensions for RDS).

**End of day:** RDS section with conservative savings.

---

## Day 5 — S3 scan

**Goal:** Find “nobody’s looking” storage.

| Task | Action |
|------|--------|
| List buckets | `s3.list_buckets`. |
| Lifecycle | Detect missing lifecycle policies (e.g. `get_bucket_lifecycle_configuration`). |
| Sample objects | List objects, LastModified, StorageClass (sample if huge). |
| Flag | STANDARD + no lifecycle; old objects (&gt;90/180 days). |
| Suggest | IA / Glacier; rough size-based savings. |

**End of day:** S3 section with lifecycle and tier suggestions.

---

## Day 6 — Reporting & clarity

**Goal:** Output feels like a product.

| Task | Action |
|------|--------|
| Group by service | EB, EC2, RDS, S3 sections. |
| Summary | Total monthly savings opportunity; counts by confidence (High/Medium/Low). |
| `--json` | Optional machine-readable output. |
| `--service` | Filter: `s3 \| rds \| eb \| ec2`. |
| Readable | Clear headers, consistent formatting. |

**Reuse:** Current console format becomes the default; add a report builder that fills sections and summary.

**End of day:** One run produces a clear, scannable report; optional JSON and filters.

---

## Day 7 — Hardening & ship-ready

**Goal:** Boringly reliable.

| Task | Action |
|------|--------|
| Empty accounts | No crashes when no instances/dbs/buckets. |
| Missing CloudWatch | Handle no datapoints (you already have “No CloudWatch data — skipping”). |
| Errors | Clear messages (e.g. “No credentials”, “Access denied for RDS”). |
| E2E | Run full scan on real account; note duration. |
| README | What it does, what it does NOT do, how to run, IAM snippet. |

**End of day:** Hand-off ready; run one command, get a clean report.

---

## Suggested Repo Layout (aligned with MVP)

```
aws-cost-optimizer/          # or atlas/ if you keep name
  scanner/
    __init__.py
    ec2.py           # from hello.py + Day 3 polish
    elasticbeanstalk.py
    rds.py
    s3.py
  report/
    __init__.py
    formatter.py     # console + summary; Day 6: JSON, --service
  main.py            # argparse, run scanners, call formatter
  README.md
```

Keep region (and optionally profile) in one place: env var or `main.py` arg, passed into scanner constructors or clients.

---

## What to Do Next (concrete)

1. **Today (Day 1)**  
   - Create the folder structure above under `atlas/` or a new `aws-cost-optimizer/`.  
   - Move the EC2 logic from `hello.py` into `scanner/ec2.py` (functions: list instances, get CPU, evaluate over-provision, apply ignore tag).  
   - Add `main.py` that imports the EC2 scanner, runs it, and prints the same style of output.  
   - Add a minimal README and a read-only IAM policy snippet (no automation yet).  
   - Verify: `python main.py` prints something and matches the behavior of `hello.py`.

2. **Then**  
   - Proceed Day 2 → Day 7 in order; each day reuses and extends the same patterns (CloudWatch, report sections, formatter).

Keeping `atlas/hello.py` as a reference is fine until Day 1 is done; after that, `main.py` + `scanner/ec2.py` become the source of truth.


CloudPilot — Project Summary

CloudPilot is a platform designed to make cloud infrastructure easier to understand, deploy, and operate.

Modern cloud platforms like AWS are extremely powerful but often confusing and overwhelming, especially for individuals, startups, and small engineering teams. Costs are difficult to interpret, infrastructure can be hard to configure correctly, and diagnosing system problems requires deep expertise.

CloudPilot acts as an intelligent guidance layer on top of AWS, helping users understand what is happening in their infrastructure and make better decisions with confidence.

The long-term vision is to build an AI-assisted cloud copilot that helps users manage their cloud environment from setup to daily operations.

Phase 1 — Cost Clarity

Goal: Help users understand and control their AWS costs.

CloudPilot begins by focusing on one of the most common pain points in cloud computing: confusing and unpredictable billing.

AWS billing dashboards can be difficult to interpret, and many developers struggle to understand where their money is going or how to reduce unnecessary spending.

CloudPilot analyzes AWS billing data and presents it in a clear, human-readable format. It identifies services that may be over-provisioned, highlights unusual spending changes, and suggests ways to reduce costs.

Key capabilities may include:

• Clear breakdown of AWS spending
• Detection of cost spikes or anomalies
• Simple explanations of what services cost
• Suggestions for cost optimization
• Alerts for potential overspending

The goal of Phase 1 is to create clarity and trust, giving users confidence that they understand their infrastructure costs.

Phase 2 — Guided Cloud Deployment

Goal: Make deploying infrastructure to AWS simple and safe.

After helping users understand their existing infrastructure, CloudPilot expands to help them create new infrastructure more easily.

Instead of navigating complex AWS interfaces, users can deploy common infrastructure patterns with guidance and clear explanations.

CloudPilot provides recommendations, previews potential costs, and warns about risky configurations before resources are launched.

Examples of deployments CloudPilot could assist with:

• Web APIs
• Databases
• Storage systems
• Development environments
• Container services

This phase transforms CloudPilot from a monitoring tool into a guided interface for building cloud infrastructure, while still allowing users to retain full control.

Phase 3 — Operational Intelligence

Goal: Help users diagnose and fix infrastructure problems quickly.

In the final phase, CloudPilot becomes a daily operational assistant for cloud infrastructure.

The platform analyzes metrics, logs, and system behavior to detect problems and explain them in plain language.

When issues occur, CloudPilot can highlight the affected system, suggest likely causes, and recommend possible solutions.

Examples of problems it could help diagnose include:

• Application crashes
• Database performance issues
• Resource exhaustion
• Latency spikes
• Unexpected cost increases

Rather than forcing users to manually search through logs and monitoring dashboards, CloudPilot acts as an AI-powered diagnostic layer, helping engineers understand problems faster and make informed decisions.

Long-Term Vision

Over time, CloudPilot evolves from a cost monitoring tool into a comprehensive cloud guidance system.

The platform progresses through three layers of value:

Cost visibility — understanding where money is being spent

Infrastructure guidance — safely deploying and configuring services

Operational intelligence — diagnosing and managing live systems

The ultimate goal is to create a system that helps developers and teams feel confident and in control of their cloud infrastructure, without needing deep expertise in every part of the cloud ecosystem.

CloudPilot/
atlas/
│
├── app/
│   ├── main.py
│
│   ├── aws/
│   │   ├── session.py
│   │   └── clients.py
│
│   ├── scanners/
│   │   ├── ec2_scanner.py
│   │   └── s3_scanner.py
│
│   ├── rules/
│   │   ├── ec2_rules.py
│   │   └── s3_rules.py
│
│   ├── models/
│   │   └── finding.py
│
│   ├── config/
│   │   └── settings.py
|
│   └── services/
│       └── ai_explainer.py
└── requirements.txt



atlas/
│
├── app/
│   ├── main.py
│
│   ├── aws/
│   │   └── session.py
│
│   ├── scanners/
│   │   ├── ec2_scanner.py
│   │   ├── s3_scanner.py
│
│   ├── rules/
│   │   ├── ec2_rules.py
│   │   ├── s3_rules.py
│   │   ├── rds_rules.py
│   │
│   │   └── base_rule.py
│
│   ├── models/
│   │   └── finding.py
│
│   └── services/
│       └── ai_explainer.py






app/

├── api/

├── services/
│   └── analysis_service.py

├── scanners/
│   ├── ec2_scanner.py
│   ├── s3_scanner.py
│   └── ecs_scanner.py

├── rules/
│   ├── base_rule.py
│   │
│   ├── ec2/
│   │   ├── low_cpu_rule.py
│   │   └── idle_gpu_rule.py
│   │
│   ├── s3/
│   │   ├── large_bucket_rule.py
│   │   └── rapid_growth_rule.py

├── rule_engine/
│   └── rule_runner.py


CloudPilot/
│
├── app/
│
│   ├── main.py
│   ├── config.py
│
│   ├── api/                # ROUTES
│   │   ├── routes_auth.py
│   │   ├── routes_projects.py
│   │   ├── routes_analysis.py
│   │   └── routes_recommendations.py
│
│   ├── services/           # LOGIC LAYER
│   │   ├── analysis_service.py
│   │   ├── project_service.py
│   │   └── recommendation_service.py
│
│   ├── aws/                # AWS INTEGRATIONS
│   │   ├── aws_session.py
│   │   ├── ec2_service.py
│   │   ├── s3_service.py
│   │   └── cloudwatch_service.py
│
│   ├── rules/              # COST RULE ENGINE
│   │   ├── base_rule.py
│   │   ├── low_cpu_rule.py
│   │   ├── idle_gpu_rule.py
│   │   └── oversized_instance_rule.py
│
│   ├── models/             # DATABASE MODELS
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── resource.py
│   │   └── recommendation.py
│
│   ├── schemas/            # API VALIDATION
│   │   ├── user_schema.py
│   │   ├── project_schema.py
│   │   └── recommendation_schema.py
│
│   ├── helpers/            # FUNCTION GROUPS
│   │   ├── aws_helpers.py
│   │   ├── time_helpers.py
│   │   └── cost_helpers.py
│
│   ├── database/
│   │   ├── db.py
│   │   └── base.py
│
│   └── core/
│       ├── security.py
│       └── utils.py


app/
│
├── api/
│
├── services/
│   ├── analysis_service.py
│
├── scanners/
│   ├── ec2_scanner.py
│   ├── ecs_scanner.py
│   └── s3_scanner.py
│
├── rules/
│   ├── base_rule.py
│   ├── low_cpu_rule.py
│   └── idle_gpu_rule.py
│
├── aws/
│   ├── aws_session.py
│   ├── ec2_service.py
│   └── cloudwatch_service.py

CloudPilot/
│
├── app/
│   ├── main.py
│   ├── config.py
│
│   ├── api/
│   │   ├── routes_auth.py
│   │   ├── routes_projects.py
│   │   ├── routes_analysis.py
│   │   └── routes_recommendations.py
│   │
│   ├── services/
│   │   ├── aws_session.py
│   │   ├── aws_ec2_service.py
│   │   ├── aws_s3_service.py
│   │   ├── cost_analyzer.py
│   │   └── ai_summary_service.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── resource.py
│   │   └── recommendation.py
│   │
│   ├── schemas/
│   │   ├── user_schema.py
│   │   ├── project_schema.py
│   │   └── recommendation_schema.py
│   │
│   ├── database/
│   │   ├── db.py
│   │   └── base.py
│   │
│   └── core/
│       ├── security.py
│       └── utils.py
│
├── requirements.txt
├── Dockerfile
└── README.md


│
├── main.py
│
├── core/
│   ├── session.py
│   ├── models.py
│   └── utils.py
│
├── scanners/
│   ├── ec2_scanner.py
│   ├── s3_scanner.py
│   └── rds_scanner.py   (coming next)
│
└── config.py




# CloudPilot To-Do Plan

High-level roadmap and tasks. Update as items are completed or reprioritized.

---

## Phase 1 — Core architecture ✅

- [x] Central AWS session manager (`core/session.py`)
- [x] Structured findings model (`core/models.py` — `Finding`)
- [x] EC2 scanner (low CPU → downsizing suggestions)
- [x] S3 scanner (missing lifecycle policy)
- [x] Main runner that aggregates results and prints report
- [x] Config for profile/region (`config.py`)

---

## Next up

### Scanners

- [ ] **Design the RDS scanner properly** — scope checks (idle/underused instances, storage, multi-AZ, backup retention), metrics (CloudWatch CPU/connections), and `Finding` shape before implementing
- [ ] **RDS scanner** (`scanners/rds_scanner.py`) — implement per design; then register in `main.py` and `scanners/__init__.py`
- [ ] (Later) Additional scanners: Lambda, EBS, EIP, etc.

### Cost & savings

- [ ] **Add Cost Explorer integration for real savings** — use AWS Cost Explorer API to replace or augment `estimated_savings` with actual/forecasted cost impact (e.g. by resource ID or tag)

### Output & UX

- [ ] Separate output formatting from runner (e.g. `core/utils.py` or `formatters/`) — JSON, table, summary
- [ ] Optional filters (by service, severity, min savings)
- [ ] Export results (e.g. JSON/CSV file)

### Configuration & CLI

- [ ] CLI (e.g. `argparse` or `click`) — profile, region, output format, output file
- [ ] Env overrides for profile/region
- [ ] Config file support (e.g. YAML) for power users

### Quality & ops

- [ ] Tests for scanners (mocked AWS calls) and for runner/formatters
- [ ] CI (lint, tests)
- [ ] README with install, config, and usage

---

## Backlog / ideas

- Severity or confidence on findings
- Dry-run / explain mode
- Multiple regions or profiles in one run
- **Design how CloudPilot feeds into an AI assistant layer** — e.g. structured output (JSON) as input to an agent, prompts that summarize findings and suggest actions, or a small API so an AI can run scans and reason over results

---

*Last updated: Phase 1 in place; RDS design, Cost Explorer, and AI-assistant design added to plan.*
