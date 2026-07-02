# Add RDS — Scan (Atlas, API, Kite)

**Status:** Planning only — no implementation in this doc.

**Last reviewed:** 2026-07-02

**Motivation:** RDS is a common **surprise bill** source (always-on compute, oversized instances, storage for stopped DBs, idle databases). It is also a **high-impact security** surface (public endpoints, unencrypted storage, weak backup posture). CloudPilot should scan RDS the same way it scans EC2 and S3.

**Principle (from [to_do.md](./to_do.md)):** EC2 → S3 → … → **RDS**. Same Finding schema, same chat → Navigator flow.

---

## Current state

| Layer | Status |
|-------|--------|
| **Atlas** | **Not started.** RDS client exists in `config/aws/sessions.py` but no `core/cloud/rds/` scanner or rules. MVP plan mentions “idle RDS databases” (`atlas/docs/SORT/ORGANIZE/mvp_plan.md`). |
| **API** | No `scan_rds` action. Architecture doc lists `scanRDS()` as future capability. Undo doc lists `create_rds` / `delete_rds` as future. |
| **Kite** | Generic Navigator ready — no RDS-specific work until API returns `navigatorResponse`. |

---

## Reference docs — HOW TO (read before coding)

| Topic | Path |
|-------|------|
| Add a new CloudPilot action | [instructions/adding_new_action.md](../instructions/adding_new_action.md) |
| Atlas → Navigator mapping | [instructions/converting_atlas_data.md](../instructions/converting_atlas_data.md) |
| Architecture (scan capability groups) | [architecture/architecture.md](./architecture/architecture.md) |
| Copy EC2 end-to-end | [finished.md](./finished.md) § Atlas + API scan (EC2) |
| Copy S3 end-to-end | [finished.md](./finished.md) § API — scan (S3 demo tier) + [add_s3.md](./add_s3.md) |
| Finding schema | `atlas/app/core/models/finding.py`, `atlas/docs/SORT/ORGANIZE/TODO.MD` |
| Capability file map (when adding `scanRDS.js`) | [architecture/single_capabiity_change.md](./architecture/single_capabiity_change.md) |

### Pattern to copy

Use **S3 scan** as the closest template (regional service, describe + enrich + rules):

```text
Atlas
  app/api/routes/rds_scan_routes.py          POST /scan/rds
  app/api/services/rds_scan_service.py       orchestration
  app/core/cloud/rds/scanner.py              describe_db_instances + CloudWatch
  app/core/cloud/rds/rules/*.py              one rule per file
  app/core/engine/rule_registry.py           get_rds_rules()

API
  actionMap.js                               scan_rds entry (informational tier)
  services/actions/rds/scanRDS/              handler, formatter, messageBuilder, navigatorAdapter
  capabilities/scans/scanRDS.js              thin Atlas HTTP call (when C5 done)

Kite
  (no changes — generic Navigator)
```

Chat intent examples: “scan rds”, “check databases”, “rds security”, “why is my rds bill high”.

---

## Implementation checklist (no code)

### Atlas

- [ ] Create `core/cloud/rds/scanner.py` — paginate `describe_db_instances`, normalize canonical DB dict per instance.
- [ ] Canonical fields (minimum): `db_instance_identifier`, `engine`, `engine_version`, `instance_class`, `status`, `multi_az`, `publicly_accessible`, `storage_encrypted`, `backup_retention_period`, `allocated_storage_gb`, `region`, `tags`, optional `avg_cpu` (7-day CloudWatch).
- [ ] Create `rds_scan_service.py` — mirror `s3_scan_service.py` / EC2 scan service flow (validate → scan → rules → response).
- [ ] Create `POST /scan/rds` route + test route with `MOCK_SCAN_RDS_DATA`.
- [ ] Register rules in `get_rds_rules()` with aliases (`rds_publicly_accessible`, etc.).
- [ ] Wire route in `main.py` (Live + Test import toggle, same as EC2/S3).
- [ ] Per-resource try/except — one bad instance must not fail the scan.

### API

- [ ] Add `scan_rds` to `actionMap.js` — `requiresWorkflow: false` or minimal fields (region only), informational tier, confirm then execute (same as `scan_s3`).
- [ ] Create `scanRDSHandler` — call Atlas, format, build message, Navigator adapter.
- [ ] Navigator adapter: stats (resources scanned, findings, region) + **DB instances table** + **findings table** (mirror EC2/S3 scan adapters).
- [ ] Add `MOCK_SCAN_RDS_DATA` for test routes.
- [ ] Insert `scan_rds` into `cloudpilot_actions` seed ([master_sql.sql](../sql/master_sql.sql)).
- [ ] Optional: `capabilities/scans/scanRDS.js`.

### Kite

- [ ] Confirm `navigatorResponse` tables render instance class, engine, status, severity.
- [ ] Optional: currency column when `estimatedMonthlySavings` populated.

### Testing (manual)

- [ ] Region with 0 RDS instances → empty tables, success.
- [ ] Region with prod-like instance → at least one finding in dev account.
- [ ] Chat: “scan rds region us-west-2” → confirm → findings in dashboard.

---

## Proposed rules

All rules return the standard nested `Finding` model (`core/models/finding.py`). Use `issue.category` of `cost`, `security`, or `reliability` as appropriate.

### Cost rules

| Rule ID | What it detects | Bill impact | Recommendation |
|---------|-----------------|-------------|----------------|
| `rds_low_cpu_utilization` | Available instance, 7-day avg CPU < 5% | Paying for oversized compute 24/7 | Downsize instance class or confirm DB is still needed |
| `rds_stopped_instance_storage` | `DBInstanceStatus == stopped` | **Storage still billed**; AWS auto-restarts after 7 days stopped | Snapshot if needed, then delete; or start and use |
| `rds_old_generation_instance` | Class prefix `db.t2.`, `db.m4.`, `db.r4.`, etc. | Worse price/performance vs current gen | Move to `db.t3` / `db.m6g` / `db.r6g` equivalent |
| `rds_idle_connections` | Available instance, 7-day `DatabaseConnections` avg ≈ 0 | Likely unused database still running | Verify ownership; stop or delete after snapshot |
| `rds_oversized_storage` | Allocated storage far above used (if `DescribeDBInstances` + CloudWatch `FreeStorageSpace` available) | Paying for unused disk | Reduce allocated storage where engine allows |

### Security rules

| Rule ID | What it detects | Risk | Recommendation |
|---------|-----------------|------|----------------|
| `rds_publicly_accessible` | `PubliclyAccessible == true` | Database reachable from internet if SG allows | Disable public access; use VPN/bastion/private subnet |
| `rds_storage_unencrypted` | `StorageEncrypted == false` | Data at rest unprotected | Enable encryption (may require snapshot restore for existing) |
| `rds_default_port_exposed` | Public + SG allows 3306/5432 from `0.0.0.0/0` (needs SG cross-check later) | Direct internet DB attack surface | Restrict SG to app tier IPs / SG only |
| `rds_iam_auth_disabled` | IAM DB auth not enabled (optional heuristic for prod-tagged) | Password-only auth | Enable IAM authentication where supported |
| `rds_no_deletion_protection` | Prod-tagged instance without deletion protection | Accidental destroy | Enable deletion protection on production |

### Best setup — reliability & operations

| Rule ID | What it detects | Gap | Recommendation |
|---------|-----------------|-----|----------------|
| `rds_backups_disabled` | `BackupRetentionPeriod == 0` | No automated backups / PITR | Set retention ≥ 7 days (14–35 for prod) |
| `rds_backup_retention_too_short` | Retention > 0 but < 7 days on prod-tagged | Weak recovery window | Increase retention to org standard |
| `rds_single_az_production` | `MultiAZ == false` + prod name/tag heuristic | No automatic failover | Enable Multi-AZ for production |
| `rds_auto_minor_upgrade_off` | `AutoMinorVersionUpgrade == false` on prod | Missed security patches | Enable auto minor version upgrade |
| `rds_maintenance_window_missing` | No preferred maintenance window configured | Uncontrolled patch timing | Set maintenance window |
| `rds_missing_tags` | No `Environment` / `Team` / `Service` tags | Cost allocation + ownership unclear | Apply standard tags |

### MVP “wow 10” subset (do these first)

From product scan spec — highest signal for bill + security demos:

1. `rds_publicly_accessible`
2. `rds_backups_disabled`
3. `rds_low_cpu_utilization`
4. `rds_stopped_instance_storage`
5. `rds_storage_unencrypted`

---

## Phased rollout

| Phase | Scope |
|-------|--------|
| **P0 — Scanner + route** | `describe_db_instances`, canonical dict, `POST /scan/rds`, empty scan works |
| **P1 — MVP rules** | 5 rules in “wow 10” subset above |
| **P2 — API + chat** | `scan_rds` action, Navigator adapter, mock data |
| **P3 — Expand rules** | Remaining cost + reliability rules |
| **P4 — Mutations (later)** | `stop_rds`, `resize_rds`, enable encryption — needs undo/history design |

---

## Out of scope (for now)

- Aurora clusters / serverless v2-specific rules (add after single-instance MVP).
- RDS Proxy, Parameter Groups, Option Groups deep scans.
- Cross-region read replicas cost analysis.
- Automatic remediations (stop/delete/modify) — mutations need confirmation + history.
- Performance Insights deep dive.

---

## IAM permissions (read-only)

```text
rds:DescribeDBInstances
rds:DescribeDBClusters          (phase 2 — Aurora)
rds:ListTagsForResource
ec2:DescribeSecurityGroups      (if adding SG cross-check rule)
cloudwatch:GetMetricStatistics  (CPUUtilization, DatabaseConnections, FreeStorageSpace)
```

---

## Related

- [add_s3.md](./add_s3.md) — ship / expand S3 first
- [add_pipeline.md](./add_pipeline.md) — CI/CD cost scan
- [to_do.md](./to_do.md) — “RDS scanner (later)”
