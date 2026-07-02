# Add S3 — Scan expansion (Atlas, API, Kite)

**Status:** Planning only — no implementation in this doc.

**Last reviewed:** 2026-07-02

**Motivation:** Investigate AWS bill drivers. S3 is a top silent cost + security risk (storage growth, public exposure, missing lifecycle). CloudPilot should surface findings in chat and Navigator so you can decide what to fix.

**Principle (from [to_do.md](./to_do.md)):** EC2 complete → **S3** → Security Groups → EBS → RDS. Quality bar: plain-English title, severity, concrete recommendation.

---

## Current state

| Layer | Status |
|-------|--------|
| **Atlas** | Demo tier **shipped** — `core/cloud/s3/scanner.py`, 3 rules, `POST /scan/s3`, test routes. See [finished.md](./finished.md). |
| **API** | `scan_s3` in `actionMap.js`, handler + formatter + message builder + Navigator adapter. Capability `scanS3.js` is placeholder (handler still uses `atlasS3Functions`). |
| **Kite** | Generic Navigator renderer works for `navigatorResponse` from scan payloads. No S3-specific UI. |
| **Inventory** | Basic S3 rows exist in `core/cloud/inventory/s3_inventory.py` (list buckets + region). Not yet a dedicated chat action beyond `inventory_aws`. |

### Rules already live (Atlas)

| Rule ID | Category | Severity |
|---------|----------|----------|
| `s3_public_access_block_disabled` | Security | Critical |
| `s3_default_encryption_off` | Security | Medium |
| `s3_no_lifecycle_policy` | Cost | Medium |

---

## Reference docs — HOW TO (read before coding)

| Topic | Path |
|-------|------|
| Add a new CloudPilot action | [instructions/adding_new_action.md](../instructions/adding_new_action.md) |
| Atlas raw → Navigator → Kite | [instructions/converting_atlas_data.md](../instructions/converting_atlas_data.md) |
| Architecture + layer responsibilities | [architecture/architecture.md](./architecture/architecture.md) |
| Capability layer file map | [architecture/single_capabiity_change.md](./architecture/single_capabiity_change.md) |
| Atlas scan walkthrough (EC2 pattern) | `atlas/docs/SORT/ORGANIZE/ReadMeOriginal.md` |
| Finding schema + audit checklist | `atlas/docs/SORT/ORGANIZE/TODO.MD` |
| S3 already done | [finished.md](./finished.md) § API — scan (S3 demo tier) |

### Pattern to copy (end-to-end)

```text
Atlas:  POST /scan/s3  →  s3_scan_service  →  scanner  →  rules  →  Finding[]
API:    scan_s3 action  →  scanS3Handler  →  Atlas HTTP  →  formatter  →  Navigator adapter
Kite:   POST /message  →  render navigatorResponse (stats + tables)
```

Existing reference files:

- Atlas: `atlas/app/core/cloud/s3/scanner.py`, `atlas/app/api/services/s3_scan_service.py`, `atlas/app/api/routes/s3_scan_routes.py`
- API: `services/actions/s3/scanS3/` (handler, formatter, message builder, Navigator adapter)
- Registry: `atlas/app/core/engine/rule_registry.py` → `get_s3_rules()`

---

## Target state (this doc)

1. **Expand S3 rules** for bill + security coverage (see rule list below).
2. **Harden chat UX** — intent phrases, mock data, recommendation copy pass.
3. **Optional:** `list_s3` / richer inventory row (size, storage class) for cost triage.
4. **Later:** remediations (`create_s3`, lifecycle apply, public access block) — see [development_undo_feature.md](./architecture/development_undo_feature.md).

---

## Implementation checklist (no code)

### Atlas

- [ ] Add new rule files under `core/cloud/s3/rules/` (one file per rule).
- [ ] Register each rule in `core/engine/rule_registry.py` (`get_s3_rules` + aliases).
- [ ] Extend scanner canonical bucket dict if new APIs needed (versioning, logging, size metrics, intelligent tiering).
- [ ] Keep scanner **data-only** — no findings in scanner (same as EC2/S3 today).
- [ ] Add test route mock: `MOCK_SCAN_S3_DATA` with one clean finding per new rule.
- [ ] Document new IAM read permissions in this doc when implemented.

### API

- [ ] Confirm `scan_s3` match phrases cover “scan s3”, “check buckets”, “s3 security”, “s3 cost”.
- [ ] Update formatter if Atlas adds new finding fields.
- [ ] Extend Navigator adapter columns if new resource metrics matter in UI (e.g. `size_gb`, `versioning`).
- [ ] Optional: finish capability migration — `capabilities/scans/scanS3.js` replaces `atlasS3Functions`.
- [ ] Seed / verify `cloudpilot_actions` row for `scan_s3` ([master_sql.sql](../sql/master_sql.sql)).

### Kite

- [ ] Verify generic tables render new S3 finding columns (severity, recommendation, optional savings).
- [ ] Optional: column `type: "currency"` for estimated savings when rules populate `cost.estimated_monthly_savings`.
- [ ] No S3-specific React components — stay generic per [converting_atlas_data.md](../instructions/converting_atlas_data.md).

### Testing (manual)

- [ ] Atlas Live: `POST /scan/s3` with `scan_type: full`, region in body.
- [ ] Atlas Test: test route returns `MOCK_SCAN_S3_DATA`.
- [ ] API chat: “scan s3 in us-west-2” → confirm → Navigator tables populated.
- [ ] Empty account / zero buckets — graceful empty tables.

---

## Proposed rules

### Already shipped ✅

Listed in **Current state** above.

### Cost rules — add next

| Rule ID | What it detects | Why it hits the bill | Recommendation (plain English) |
|---------|-----------------|----------------------|--------------------------------|
| `s3_versioning_no_lifecycle` | Versioning enabled, no noncurrent version expiration | Old versions accumulate forever → storage grows silently | Add lifecycle rule to expire noncurrent versions after 30–90 days |
| `s3_large_bucket_no_intelligent_tiering` | Bucket > ~1 GB Standard, no Intelligent-Tiering | All data stays on expensive Standard tier regardless of access pattern | Enable Intelligent-Tiering for automatic tier movement |
| `s3_empty_bucket` | Zero objects (CloudWatch `NumberOfObjects`) | Usually $0 storage but signals orphaned infra / misconfiguration risk | Confirm intent; delete if unused |
| `s3_incomplete_multipart_uploads` | Stale MPU parts (optional; needs `ListMultipartUploads` sampling) | Hidden storage charges from abandoned uploads | Add lifecycle abort-incomplete MPU rule |

### Security / best-setup rules — add next

| Rule ID | What it detects | Risk | Recommendation |
|---------|-----------------|------|----------------|
| `s3_no_access_logging` | Server access logging off | No audit trail for object access (compliance gap) | Enable logging to a dedicated log bucket |
| `s3_versioning_disabled_on_critical` | No versioning on buckets tagged prod / backup (heuristic) | Accidental delete = permanent data loss | Enable versioning + lifecycle for prod buckets |
| `s3_bucket_policy_public_principal` | Policy allows `Principal: "*"` or `AllUsers` | Data exposure | Remove public principal or block public access |
| `s3_acl_public_read_write` | Legacy ACL grants public read/write | Bypasses modern public access block in some cases | Switch to bucket policy + block public ACLs |

### Reliability / operations (lower priority for bill, still valuable)

| Rule ID | What it detects | Recommendation |
|---------|-----------------|----------------|
| `s3_no_replication_on_prod` | Prod-tagged bucket, no CRR | Enable cross-region replication if RPO requires it |
| `s3_missing_tags` | Active bucket missing `Environment` / `Team` / `Service` | Tag for cost allocation and incident response |

---

## Phased rollout

| Phase | Scope |
|-------|--------|
| **P0 — Bill triage** | `s3_versioning_no_lifecycle`, `s3_large_bucket_no_intelligent_tiering`, copy pass on existing 3 rules |
| **P1 — Security wow** | `s3_bucket_policy_public_principal`, `s3_no_access_logging` |
| **P2 — Polish** | Mock data per rule, Navigator savings column, capability migration C5 |
| **P3 — Mutations** | Remediations (lifecycle apply, enable encryption) — separate action docs |

---

## Out of scope (for now)

- Object-level listing at scale (too slow / expensive for MVP scan).
- S3 Storage Lens integration.
- Mutating actions (`delete_s3`, `create_s3`) — tracked in undo feature doc.
- `scan_aws` multi-service orchestration — see [to_do.md](./to_do.md) and future `scan_aws` work.

---

## IAM permissions (read-only, cumulative)

When expanding rules, Atlas task role may need:

```text
s3:ListAllMyBuckets
s3:GetBucketLocation
s3:GetPublicAccessBlock
s3:GetBucketEncryption
s3:GetBucketLifecycleConfiguration
s3:GetBucketVersioning
s3:GetBucketLogging
s3:GetBucketPolicy
s3:GetBucketAcl
s3:GetIntelligentTieringConfiguration
s3:ListMultipartUploads          (if MPU rule added)
cloudwatch:GetMetricStatistics   (BucketSizeBytes, NumberOfObjects)
```

---

## Related

- [add_rds.md](./add_rds.md) — next service after S3 expansion
- [add_pipeline.md](./add_pipeline.md) — CI/CD pipeline scan
- [to_do.md](./to_do.md) — Scan expansion backlog
