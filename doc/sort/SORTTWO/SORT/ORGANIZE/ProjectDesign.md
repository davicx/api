# CloudPilot Core Architecture (MVP Pattern)

## 🎯 Goal

Build a scalable, easy-to-extend scanning system where:

* Each AWS service (EC2, S3, RDS, etc.) is isolated
* Rules can be added quickly
* Logic is clean and testable
* Responsibilities are clearly separated

---

# 🧱 Folder Structure

```plaintext
app/
  api/
    routes/
      scan_routes.py
      ai_routes.py
    services/
      scan_service.py

  core/
    ec2/
      scanner.py
      logic.py
      rules/
        ec2_low_cpu.py

    s3/
      scanner.py
      logic.py
      rules/

    rds/
      scanner.py
      logic.py
      rules/

    shared/
      rule_engine.py
      registry.py
      finding.py
```

---

# 🧠 Core Design Principle

> Separation of concerns is more important than folder structure.

Each layer has a **single responsibility**:

| Layer      | Responsibility          |
| ---------- | ----------------------- |
| API Routes | HTTP only               |
| Services   | orchestration / flow    |
| Scanner    | get AWS data            |
| Rules      | analyze data            |
| Logic      | connect scanner + rules |
| Models     | data structures         |

---

# 🔁 End-to-End Flow

```plaintext
API Route
  ↓
scan_service
  ↓
ec2.logic.run_scan()
  ↓
ec2.scanner.get_data()
  ↓
rule_engine.run_rules(data, registry)
  ↓
rules evaluate
  ↓
return Findings
```

---

# 📦 Service-Based Structure (Important)

Each AWS service is self-contained:

```plaintext
ec2/
  scanner.py      ← AWS calls only
  logic.py        ← orchestration only
  rules/          ← pure evaluation
```

### ✅ Why this is good

* Easy to scale (EC2, S3, RDS, etc.)
* Easy to navigate
* Easy to generate new rules with AI tools
* Keeps related code together

---

# 🔌 Scanner Layer (AWS Access Only)

## Purpose

Fetch data from AWS and return clean Python objects.

## ✅ Allowed

* boto3 calls
* basic data formatting

## ❌ NOT allowed

* rules
* recommendations
* business logic

## Example

```python
def get_instances():
    return [
        {
            "instance_id": "i-123",
            "instance_type": "t3.micro",
            "avg_cpu": 5.2
        }
    ]
```

---

# 🧠 Rules Layer (Pure Evaluation)

## Purpose

Analyze data and produce findings.

## ✅ Allowed

* comparisons
* thresholds
* creating findings

## ❌ NOT allowed

* AWS calls
* fetching data
* orchestration

## Example

```python
def evaluate(instance):
    if instance["avg_cpu"] < 10:
        return Finding(
            service="EC2",
            resource_id=instance["instance_id"],
            issue="Low CPU utilization",
            recommendation="Consider downsizing"
        )
```

---

# ⚙️ Logic Layer (Orchestration)

## Purpose

Connect scanner → rules → results

## ✅ Responsibilities

* call scanner
* select rules
* pass data into rule engine
* return findings

## ❌ NOT allowed

* AWS calls (should be in scanner)
* rule logic

---

# 🧩 Rule Engine (Shared)

## Purpose

Run rules dynamically across data.

```python
def run_rules(data, rules):
    findings = []
    for item in data:
        for rule in rules:
            result = rule(item)
            if result:
                findings.append(result)
    return findings
```

---

# 📚 Rule Registry (Shared)

## Purpose

Map rule names → rule functions

```python
REGISTRY = {
    "ec2_low_cpu": ec2_low_cpu_rule,
}
```

---

# 🧱 Finding Model (Shared)

## Purpose

Standard output format

```python
class Finding:
    def __init__(self, service, resource_id, issue, recommendation):
        self.service = service
        self.resource_id = resource_id
        self.issue = issue
        self.recommendation = recommendation
```

---

# 🧠 Key Rules to Follow

### 1. Scanner NEVER evaluates

❌ No `if avg_cpu < 10`

### 2. Rules NEVER call AWS

❌ No boto3

### 3. Logic NEVER fetches AWS directly

❌ No `ec2.describe_instances()` in logic

### 4. Keep rules small and focused

✅ One rule = one file

---

# 🚀 Scaling Strategy

Start with:

* 1 service (EC2)
* 1 rule (low CPU)

Then expand:

* Add more rules in `ec2/rules/`
* Add new services (`s3/`, `rds/`)
* Reuse shared rule engine

---

# 🔥 Why This Works

* Easy to extend
* Easy to test
* Easy to generate code with AI
* Prevents messy growth
* Matches real-world scalable systems

---

# ✅ MVP Guideline

> Build ONE rule end-to-end → lock pattern → scale

---

# 🧠 Mental Model

```plaintext
Scanner = get data
Rules = think about data
Logic = connect everything
```

---

# 🎯 Final Takeaway

This architecture allows CloudPilot to:

* Rapidly add new rules
* Support multiple AWS services
* Keep logic clean and maintainable
* Safely scale into a large system

---

Here’s a clean README-style doc you can drop straight into your design folder 👇

---

# 🧠 CloudPilot Scan Service Design (Clean Architecture)

## 🎯 Goal

Keep scan logic **simple, scalable, and easy to extend** as CloudPilot grows.

This structure follows a clear pattern inspired by Node.js logic layers:

```text
Route → Service → Core Logic → Return Response
```

---

#  Mental Model (Node vs Python)

### Node Example (What We Want)

```text
AddFriend()
  → create friend
  → create notification
  → create request
  → return response
```

### CloudPilot Equivalent

```text
scan_ec2()
  → validate input
  → run scan (AWS + rules)
  → format result
  → return data
```

The **service function is the orchestrator** — nothing more.

---

# Architecture Overview

```text
api/
  routes/
    scan_routes.py        ← Handles HTTP

services/
  scan/
    scan_service.py      ← Main logic (orchestrator)
    validators.py        ← Input validation
    formatters.py        ← Response formatting

core/
  ec2/
    ec2_logic.py         ← AWS calls + rule engine
```

---

# 🔁 Request Flow

```text
Client Request
   ↓
Route (FastAPI)
   ↓
Service Layer (scan_service)
   ↓
Core Logic (ec2_logic)
   ↓
Formatter
   ↓
Route returns json_response
```

---

# 📍 Responsibilities (VERY Important)

## 1. Route Layer (`scan_routes.py`)

* Handles HTTP request/response
* Parses request model
* Calls service
* Wraps response in standard JSON format

```python
@router.post("/scan/ec2")
def scan_ec2_route(request: Ec2ScanRequest):
    data = scan_ec2(
        scope=request.scope.to_dict(),
        region=request.region,
        rules=request.rules,
    )

    return json_response(data=data)
```

---

## 2. Service Layer (`scan_service.py`) ⭐

👉 **This is your “AddFriend” equivalent**

* Orchestrates the flow
* Calls validator
* Calls core logic
* Calls formatter
* Returns clean data

```python
def scan_ec2(scope=None, region=None, rules=None):

    # 1. Validate input
    validate_ec2_scope(scope or {})

    # 2. Run core logic (AWS + rules)
    result = run_ec2_scan(region=region, selected_rules=rules)

    # 3. Format output
    return format_ec2_response(result)
```

Should read like a **story**
Should NOT contain:

* HTTP logic
* Debug printing
* Large helper functions
* Old commented code

---

## 3. Validator Layer (`validators.py`)

* Contains business validation rules
* Keeps service clean

```python
def validate_ec2_scope(scope: dict):
    stype = scope.get("type", "full")

    if stype not in ("full", "instance", "tag", "region"):
        raise ValueError(f"Invalid scope type: {stype}")
```

---

## 4. Formatter Layer (`formatters.py`)

* Converts raw scan results into API-friendly shape

```python
def format_ec2_response(result: dict) -> dict:
    return {
        "currentCost": result.get("current_cost"),
        "expectedCost": result.get("expected_cost"),
        "instanceFindings": result.get("findings", []),
    }
```

---

## 5. Core Logic (`ec2_logic.py`)

* Talks to AWS (boto3)
* Runs rule engine
* Returns raw data

```python
def run_ec2_scan(region=None, selected_rules=None):
    # AWS calls + rules execution
    return {
        "current_cost": 10,
        "expected_cost": 6,
        "findings": [...]
    }
```

---

# Anti-Patterns to Avoid

❌ One giant file doing everything
❌ Mixing HTTP + logic
❌ Debug/print functions inside service
❌ Commented-out legacy code
❌ Returning full API response shape from service

---

# Golden Rule

> **Service layer should read like a simple checklist:**

```text
validate → run → format → return
```

If it does more than this → it needs to be split.

---

# Future Scaling (Why This Matters)

This structure allows you to easily add:

```text
scan_s3()
scan_rds()
scan_all()
remediation_service()
deploy_service()
```

Without rewriting logic or creating messy files.

---

# 💡 Key Insight

 The service layer is your **feature entry point**

Just like:

```text
AddFriend()
SendMessage()
CreatePost()
```

You now have:

```text
scan_ec2()
```

---

#  Summary

* Keep services small and focused
* Move validation + formatting out
* Let core handle AWS + rules
* Keep routes thin
* Think in “Node logic functions”

---


Yep — this is a **core CloudPilot pattern**, and getting it right now will make everything else easy to scale.

You basically want:

👉 One endpoint
👉 Flexible input
👉 Handles ALL scan types + rule selection

Let’s rebuild it clean 👇

---

# ✅ 1. Your API Contract (this is already correct)

Your request shape is perfect:

```json
{
  "scope": {
    "type": "tag",   // full | instance | tag | region
    "key": "team",
    "value": "payments"
  },
  "region": "us-west-2",
  "rules": ["low_cpu"] // optional
}
```

---

# ✅ 2. Route (thin — keep it simple)

📁 `api/routes/scan_routes.py`

```python
from fastapi import APIRouter
from api.models.scan_models import Ec2ScanRequest
from api.services.scan_service import post_ec2_scan
from api.utils.responses import json_response

router = APIRouter()

@router.post("/scan/ec2")
def scan_ec2(request: Ec2ScanRequest):
    result = post_ec2_scan(request)
    return json_response(data=result)
```

---

# ✅ 3. Request Models (move them out of routes!)

📁 `api/models/scan_models.py`

```python
from pydantic import BaseModel, Field, AliasChoices
from typing import Optional, List, Literal


class Ec2ScanScopeModel(BaseModel):
    type: Literal["full", "instance", "tag", "region"] = "full"
    key: Optional[str] = None
    value: Optional[str] = Field(
        None,
        validation_alias=AliasChoices("value", "match"),
    )


class Ec2ScanRequest(BaseModel):
    scope: Ec2ScanScopeModel = Field(default_factory=Ec2ScanScopeModel)
    region: Optional[str] = None
    rules: Optional[List[str]] = None
```

---

# ✅ 4. Service Layer (THIS is the brain)

📁 `api/services/scan_service.py`

This is where everything comes together:

```python
from api.models.scan_models import Ec2ScanRequest
from core.logic.ec2_logic import run_ec2_scan


def post_ec2_scan(request: Ec2ScanRequest):
    scope = request.scope.model_dump(exclude_none=True)
    region = request.region
    rules = request.rules

    result = run_ec2_scan(
        scope=scope,
        region=region,
        rules=rules
    )

    return result
```

---

# ✅ 5. Core Logic (handles ALL scan types)

📁 `core/logic/ec2_logic.py`

```python
from typing import Dict, Any, List, Optional
from core.scanners.ec2_scanner import get_ec2_instances
from core.rules.registry import get_rules


def run_ec2_scan(
    scope: Dict[str, Any],
    region: Optional[str],
    rules: Optional[List[str]]
):
    instances = get_ec2_instances(scope=scope, region=region)

    rule_set = get_rules(service="ec2", selected_rules=rules)

    findings = []

    for instance in instances:
        for rule in rule_set:
            result = rule(instance)
            if result:
                findings.append(result)

    return {
        "totalResources": len(instances),
        "findings": findings
    }
```

---

# ✅ 6. Scanner (handles scope filtering)

📁 `core/scanners/ec2_scanner.py`

```python
def get_ec2_instances(scope: dict, region: str):
    scope_type = scope.get("type", "full")

    # FULL SCAN
    if scope_type == "full":
        return fetch_all_instances(region)

    # SINGLE INSTANCE
    if scope_type == "instance":
        instance_id = scope.get("value")
        return fetch_instance_by_id(instance_id, region)

    # TAG FILTER (TEAM, ENV, ETC)
    if scope_type == "tag":
        key = scope.get("key")
        value = scope.get("value")
        return fetch_instances_by_tag(key, value, region)

    # REGION (optional override)
    if scope_type == "region":
        region = scope.get("value")
        return fetch_all_instances(region)

    return []
```

---

# ✅ 7. Rule Registry (THIS is the magic)

📁 `core/rules/registry.py`

```python
from core.rules.ec2.low_cpu import low_cpu_rule

ALL_RULES = {
    "ec2": {
        "low_cpu": low_cpu_rule,
        # add more here later
    }
}


def get_rules(service: str, selected_rules=None):
    service_rules = ALL_RULES.get(service, {})

    # If no rules specified → run ALL
    if not selected_rules:
        return list(service_rules.values())

    # Otherwise → filter
    return [
        service_rules[rule_name]
        for rule_name in selected_rules
        if rule_name in service_rules
    ]
```

---

# ✅ 8. What You Now Support (THIS is the goal)

Your ONE endpoint now supports:

### 🔹 Full scan

```json
{}
```

---

### 🔹 Single instance

```json
{
  "scope": {
    "type": "instance",
    "value": "i-123"
  }
}
```

---

### 🔹 Team scan (tag-based)

```json
{
  "scope": {
    "type": "tag",
    "key": "team",
    "value": "payments"
  }
}
```

---

### 🔹 Region scan

```json
{
  "scope": {
    "type": "region",
    "value": "us-east-1"
  }
}
```

---

### 🔹 Specific rules only

```json
{
  "rules": ["low_cpu"]
}
```

---

### 🔹 All rules (default)

```json
{
  "rules": null
}
```

---

# 🧠 Key Insight (this is the important part)

You now have **3 independent layers working together:**

### 1. Scope → controls *what resources*

👉 handled by scanner

### 2. Rules → controls *what checks*

👉 handled by registry

### 3. Logic → orchestrates everything

👉 loops resources × rules

---

# 🚀 Why this is powerful (for your MVP)

Now adding new features is EASY:

### Add new rule:

```python
"stopped_instance": stopped_instance_rule
```

### Add new service:

```python
run_s3_scan(...)
run_rds_scan(...)
```

### Add new scope type:

```python
"type": "account"
```

---

# ⚡ If you want next step

We can:

👉 Add your **first real rule (low CPU) fully wired**
👉 Add **Finding model return shape (your JSON output)**
👉 Or plug this into your **chat → tool system**

Just tell me 👍
