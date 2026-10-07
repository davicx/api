# Atlas / CloudPilot MVP Plan

This document outlines the architecture and first steps for building the Atlas cloud cost optimization tool.

The goal is to build a **simple AWS scanning engine** that detects common sources of cloud waste and recommends fixes.

---

# Project Goal

Atlas will scan AWS infrastructure and detect inefficiencies such as:

* Idle EC2 instances
* Unused EBS volumes
* Idle Elastic IPs
* Missing S3 lifecycle policies
* Idle RDS databases

The system will generate **findings** with recommended actions and estimated savings.

---

# High Level Architecture

The system follows this pipeline:

```
AWS
 ↓
Scanners (collect AWS data)
 ↓
Rules (detect problems)
 ↓
Findings (standardized output)
 ↓
CLI output / AI explanation
```

---

# Project Structure

```
atlas/
│
├── app/
│
│   ├── main.py
│   ├── cli.py
│
│   ├── aws/
│   │   └── session.py
│
│   ├── scanners/
│   │   ├── ec2_scanner.py
│   │   ├── s3_scanner.py
│
│   ├── rules/
│   │   ├── ec2/
│   │   │   └── idle_instances.py
│   │
│   │   ├── s3/
│   │       └── lifecycle_missing.py
│
│   ├── models/
│   │   └── finding.py
│
│   ├── services/
│   │   └── cost_estimator.py
│
│   └── core/
│       └── rule_loader.py
```

---

# Finding Model

All rules return a standardized Finding object.

```python
class Finding:

    def __init__(self, rule_id, resource, issue, recommendation, savings):

        self.rule_id = rule_id
        self.resource = resource
        self.issue = issue
        self.recommendation = recommendation
        self.savings = savings
```

---

# Rule Metadata Design

Each rule contains metadata describing the issue.

Example:

```python
RULE = {
    "id": "EC2_IDLE_INSTANCE",
    "service": "ec2",
    "title": "Idle EC2 Instance",
    "description": "Instance CPU usage below 5%",
    "severity": "medium",
    "estimated_savings": 15,
    "remediation": "Downsize or stop instance",
}
```

This metadata allows Atlas to generate:

* CLI output
* AI explanations
* dashboards
* remediation actions

---

# Example Rule

rules/ec2/idle_instances.py

```python
from models.finding import Finding

RULE = {
    "id": "EC2_IDLE_INSTANCE",
    "description": "CPU usage below 5%",
    "estimated_savings": 15,
    "remediation": "Downsize or stop instance",
}

def run(instances):

    findings = []

    for instance in instances:

        cpu = instance.get("cpu", 0)

        if cpu < 5:

            findings.append(
                Finding(
                    rule_id=RULE["id"],
                    resource=instance["InstanceId"],
                    issue=RULE["description"],
                    recommendation=RULE["remediation"],
                    savings=RULE["estimated_savings"]
                )
            )

    return findings
```

---

# Example Scanner

scanners/ec2_scanner.py

```python
import boto3
from core.rule_loader import load_rules

PROFILE = "atlas"
REGION = "us-west-2"

def scan():

    session = boto3.Session(profile_name=PROFILE, region_name=REGION)
    ec2 = session.client("ec2")

    response = ec2.describe_instances()

    instances = []

    for r in response["Reservations"]:
        for i in r["Instances"]:
            instances.append(i)

    rules = load_rules("ec2")

    findings = []

    for rule in rules:
        findings += rule.run(instances)

    return findings
```

---

# Rule Loader

core/rule_loader.py

```python
import importlib
import pkgutil

def load_rules(service):

    rules = []

    package = f"rules.{service}"

    for _, module_name, _ in pkgutil.iter_modules([f"app/rules/{service}"]):

        module = importlib.import_module(f"rules.{service}.{module_name}")

        rules.append(module)

    return rules
```

---

# CLI Usage

Atlas will eventually support commands like:

```
atlas scan ec2
atlas scan s3
atlas scan all
```

For now:

```
python app/main.py scan ec2
```

---

# Phase 1 MVP Rules

The first 5 rules to implement:

1. Idle EC2 instances
2. Unattached EBS volumes
3. Idle Elastic IPs
4. Missing S3 lifecycle policies
5. Idle RDS databases

These rules capture a large portion of wasted AWS spend.

---

# Example Output

```
⚠️ EC2_IDLE_INSTANCE

Resource: i-12345678
CPU usage below 5%

Recommendation:
Downsize instance

Estimated Savings:
$15/month
```

---

# Long Term Vision

Atlas becomes a cloud optimization assistant:

```
AWS infrastructure
 ↓
Atlas scan
 ↓
AI explanation
 ↓
1-click remediation
```

Example future command:

```
atlas remediate EC2_IDLE_INSTANCE i-123456
```

---

# Next Development Steps

1. Implement EC2 scanner
2. Implement idle EC2 rule
3. Implement Finding model
4. Display findings in CLI
5. Add additional rules

---

# Notes

The most valuable part of Atlas will eventually be:

* rules/
* services/

This is where the optimization intelligence lives.
