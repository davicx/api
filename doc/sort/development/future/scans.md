# Scans — MVP

**Last reviewed:** 2026-07-05

> **Shipped:** [finished.md](../finished/finished.md) · **Deferred:** [future_work.md](./future.md)

---

## Purpose

Find **real problems** in five minutes — not become AWS Trusted Advisor.

CloudPilot scans AWS services, runs **rules**, returns **findings** in chat + Navigator. One service at a time, same internal pattern every time:

```text
Atlas scanner → rules → API handler → Navigator → Kite
```

**Demo arcs**

1. **Bill:** Billing → EC2 scan → S3 scan → RDS scan  
2. **Security:** IAM scan → Security Groups scan  

---

## What makes a good MVP rule

A CloudPilot rule should:

- Find a problem users **commonly** have  
- Be understandable in **one sentence**  
- Have a **clear recommended action**  
- Tag a **category:** `security` | `cost` | `reliability` | `configuration`  
- Later: lead to instructions, CLI, PR, or automated fix — not required on day one  

Skip obscure checks just because the API exists.

---

## Navigator shape (every scan)

Same mental model for EC2, S3, RDS, IAM, Security Groups, Lambda:

| Section | Navigator |
|---------|-----------|
| **Resources found** | Stats + resource table (instances, buckets, DBs, …) |
| **Issues found** | Findings table (severity, title, resource) |
| **Potential savings** | Stat or column when rule populates savings |
| **Recommended actions** | Recommendation text per finding (fix = change/PR later) |

Intent filters (“show security issues”) come **later** — rules already carry `category`; no scanner changes needed.

---

## Current status

| Service | Status | Chat action |
|---------|--------|-------------|
| **EC2** | ✅ MVP rules shipped | `scan ec2` |
| **S3** | ✅ Demo tier (3 rules); expand rules next | `scan s3` |
| **RDS** | ❌ Not started | `scan rds` (planned) |
| **IAM** | ❌ Not started | `scan iam` (planned) |
| **Security Groups** | ❌ Not started | `scan security groups` (planned) |
| **Lambda** | ❌ Not started | `scan lambda` (planned) |

Details in [finished.md](../finished/finished.md) (shipped) and sections below (next).

---

## Service order (build one at a time)

```text
EC2        ✅ foundation
  ↓
S3         expand rules (same action)
  ↓
RDS        new scanner — bill demo complete
  ↓
IAM        security demo
  ↓
Security Groups
  ↓
Lambda     optional polish
```

Do **not** start the next service until the current one demos well end-to-end.

---

## EC2 ✅

**Resources found:** instances (name, id, type, state, region, tags)  
**Issues found:** 5 rules live  
**Potential savings:** on cost rules where populated  
**Recommended actions:** resize / stop / toggle / tag (change layer)

| Rule (live) | Category |
|-------------|----------|
| Low CPU | cost |
| Legacy instance type (t2, m3, …) | cost |
| Stopped instance | cost |
| Missing Name tag | configuration |
| Public IP attached | security |

**Next:** no snapshot, oversized recommendation → [future_work.md](./future.md)

---

## S3 ✅ demo — expand rules next

**Resources found:** buckets (region, encryption, lifecycle flags)  
**Issues found:** 3 rules live  
**Recommended actions:** enable encryption, lifecycle, block public access (later)

| Rule (live) | Category |
|-------------|----------|
| Public access block disabled | security |
| Default encryption off | security |
| No lifecycle policy | cost |

**Next rules (pick 2–3):** public bucket/policy, versioning disabled, logging disabled, missing tags → [future_work.md](./future.md)

---

## RDS — next new scanner

**Resources found:** DB instances (engine, class, status, public, encrypted, backup retention)  
**Issues found:** start with 5 rules  
**Recommended actions:** instructions / PR initially

| Rule (MVP) | Category |
|------------|----------|
| Publicly accessible | security |
| Storage encryption disabled | security |
| Automated backups disabled | reliability |
| Low CPU / idle | cost |
| Missing tags | configuration |

Copy **S3 scan** file layout: `core/cloud/rds/scanner.py`, `POST /scan/rds`, `scan_rds` action folder.

---

## IAM — after RDS

**Resources found:** users, roles (summary table)  
**Issues found:** MFA, keys, admin policies  

| Rule (MVP) | Category |
|------------|----------|
| User without MFA | security |
| Old access keys | security |
| Unused access keys | security |
| AdministratorAccess attached | security |

Remediation: mostly instructions / PR.

---

## Security Groups — after IAM

**Resources found:** security groups + rules summary  
**Issues found:** world-open ports, unused groups  

| Rule (MVP) | Category |
|------------|----------|
| SSH open to 0.0.0.0/0 | security |
| RDP open to 0.0.0.0/0 | security |
| Unused security group | cost / configuration |

---

## Lambda — last

**Resources found:** functions (runtime, timeout, last invoked)  

| Rule (MVP) | Category |
|------------|----------|
| Old runtime | reliability |
| No recent invocations | cost |
| Excessive timeout | configuration |

---

## Pattern (copy per service)

```text
Atlas:   core/cloud/{service}/scanner.py + rules/
         api/routes/{service}_scan_routes.py  POST /scan/{service}
API:     actionMap scan_{service} → scan{Service}Handler → Navigator adapter
Kite:    generic Navigator (no service-specific React)
```

Reference: `core/cloud/ec2/`, `core/cloud/s3/`, `services/actions/ec2/scanEC2/`, `services/actions/s3/scanS3/`.

---

## Future ideas

Intent chat (“show security issues”, “ways to save money”), multi-service `scan_aws` dashboard summary, pipeline scan, extra rules, skipped AWS services — [future_work.md](./future.md#scans).
