# Add Pipeline — AWS CodePipeline scan (Atlas, API, Kite)

**Status:** Planning only — no implementation in this doc.

**Last reviewed:** 2026-07-02

**Scope:** **AWS CodePipeline** and closely linked **CodeBuild** projects (where most CI/CD spend hides). This is an AWS **service** scan doc — not the CloudPilot message pipeline ([architecture/code_cleanup.md](./architecture/code_cleanup.md)) and not the GitHub PR remediation flow ([remediations.md](./remediations.md)).

**Motivation:** CI/CD lines on an AWS bill are often overlooked — idle pipelines, oversized CodeBuild instances, always-on build frequency, and artifact storage add up. Security misconfigs (overbroad IAM, unencrypted artifacts) are common in demo/sandbox accounts.

---

## Current state

| Layer | Status |
|-------|--------|
| **Atlas** | **Not started.** No `core/cloud/pipeline/` or CodePipeline scanner. |
| **API** | No `scan_pipeline` / `scan_codepipeline` action. |
| **Kite** | Generic Navigator only. |

---

## Reference docs — HOW TO (read before coding)

| Topic | Path |
|-------|------|
| Add a new CloudPilot action | [instructions/adding_new_action.md](../instructions/adding_new_action.md) |
| Atlas → Navigator mapping | [instructions/converting_atlas_data.md](../instructions/converting_atlas_data.md) |
| Architecture | [architecture/architecture.md](./architecture/architecture.md) |
| Closest live scan templates | [add_s3.md](./add_s3.md), [add_rds.md](./add_rds.md), [finished.md](./finished.md) |
| Finding schema | `atlas/app/core/models/finding.py` |
| Atlas layer map | `atlas/docs/SORT/ORGANIZE/ReadMeOriginal.md` |

### Pattern to copy

Same scan module pattern as RDS/S3:

```text
Atlas
  POST /scan/pipeline                    (or /scan/codepipeline — pick one URL, document it)
  pipeline_scan_service.py
  core/cloud/pipeline/scanner.py         list_pipelines + list_projects + enrich
  core/cloud/pipeline/rules/*.py
  get_pipeline_rules() in rule_registry.py

API
  scan_pipeline in actionMap.js
  services/actions/pipeline/scanPipeline/
  capabilities/scans/scanPipeline.js     (later)

Kite
  generic Navigator tables only
```

**Note:** CodePipeline is **regional**. Scanner accepts `region` like EC2/RDS. CodeBuild projects are regional; link via pipeline stages.

Chat intent examples: “scan pipelines”, “check codepipeline”, “ci cd cost”, “codebuild waste”.

---

## Implementation checklist (no code)

### Atlas

- [ ] Add `codepipeline` and `codebuild` clients to `config/aws/sessions.py` if not present.
- [ ] Scanner: `list_pipelines` (paginated) → for each pipeline, `get_pipeline` + stage/action summary.
- [ ] Scanner: `list_projects` for CodeBuild — compute type, image, timeout, cache, last build time (via `batch_get_projects` + `list_builds_for_project` sample).
- [ ] Canonical pipeline dict: `name`, `arn`, `region`, `stage_count`, `source_provider`, `last_execution_time`, `execution_status_counts` (optional), linked `codebuild_projects[]`.
- [ ] Canonical codebuild dict: `name`, `arn`, `environment_type`, `compute_type`, `image`, `timeout_minutes`, `last_build_time`, `last_build_status`.
- [ ] `pipeline_scan_service.py` + route + test mock `MOCK_SCAN_PIPELINE_DATA`.
- [ ] Register rules in `get_pipeline_rules()`.

### API

- [ ] Add `scan_pipeline` action (informational tier, region field, same confirm flow as `scan_s3`).
- [ ] Handler + formatter + Navigator adapter with **Pipelines table** + **CodeBuild projects table** + **Findings table**.
- [ ] DB seed row in `cloudpilot_actions`.

### Kite

- [ ] Verify tables render pipeline name, last run, compute type, severity — no custom components.

### Testing (manual)

- [ ] Account with no pipelines → graceful empty state.
- [ ] Account with 1 pipeline + CodeBuild → findings if rules trigger.

---

## Proposed rules

### Cost rules

| Rule ID | What it detects | Bill impact | Recommendation |
|---------|-----------------|-------------|----------------|
| `pipeline_no_executions_30d` | Pipeline exists, no successful executions in 30 days | ~$1/pipeline/month + artifact storage | Delete unused pipeline or confirm still needed |
| `codebuild_not_invoked_30d` | CodeBuild project with zero builds in 30 days | Orphan project; may still have cached artifacts | Remove project if decommissioned |
| `codebuild_oversized_compute` | `computeType` in `BUILD_GENERAL1_LARGE` / `2XLARGE` etc. for low-frequency project | Paying premium per build minute | Downsize to `SMALL` / `MEDIUM`; use batch for heavy jobs |
| `codebuild_long_timeout` | Timeout set very high (e.g. > 60 min) with typical builds << timeout | Runaway build cost risk | Lower timeout to realistic max |
| `codebuild_no_cache` | Frequent builds, caching disabled | Repeated dependency download time = money | Enable S3 or local cache where safe |
| `pipeline_artifact_storage_unbounded` | Default S3 artifact bucket without lifecycle (cross-link S3 rules if same bucket) | Old artifacts accumulate | Lifecycle expire artifacts after N days |
| `codebuild_vpc_unnecessary` | Project in VPC without private resource need | NAT/data processing charges during builds | Remove VPC config if not required |

### Security / best-setup rules

| Rule ID | What it detects | Risk | Recommendation |
|---------|-----------------|------|----------------|
| `pipeline_iam_role_overprivileged` | Pipeline / CodeBuild role has `*:*` or admin-managed policies (heuristic via `iam:GetRolePolicy` sample) | Compromised pipeline = account takeover | Scope role to least privilege per stage |
| `codebuild_secrets_in_plaintext` | Environment variables of type PLAINTEXT that look like secrets (`API_KEY`, `PASSWORD`) | Secrets in logs / console | Move to Secrets Manager / SSM Parameter Store |
| `pipeline_artifacts_unencrypted` | Artifact store / S3 bucket encryption off | Build output readable if bucket misconfigured | Enable SSE-KMS or SSE-S3 on artifact bucket |
| `pipeline_no_manual_approval_prod` | Prod-tagged pipeline deploys to production with no manual approval stage | Bad deploys go straight live | Add manual approval before production stage |
| `codebuild_privileged_mode_enabled` | `privilegedMode true` without justification | Docker-in-Docker = larger attack surface | Disable unless required; use dedicated build account |
| `pipeline_source_unpinned` | Source provider uses floating branch/tag without commit ID policy (heuristic) | Supply chain risk | Pin to commit SHA or use tag immutability |
| `codebuild_outdated_image` | Standard image deprecated / far behind current (AWS curated images) | Unpatched build environment | Update to current curated image |

### Reliability / operations

| Rule ID | What it detects | Recommendation |
|---------|-----------------|----------------|
| `pipeline_recent_failures` | > N failed executions in 7 days | Investigate failing stage; fix before cost/security drift |
| `pipeline_missing_tags` | No `Environment` / `Team` / `Application` tags | Tag for ownership and cost allocation |
| `codebuild_no_cloudwatch_logs` | Logging to CloudWatch disabled | Enable logs for audit and debugging |

---

## MVP subset (build first)

For a fast “why is my bill / CI account messy?” demo:

1. `pipeline_no_executions_30d`
2. `codebuild_oversized_compute`
3. `codebuild_not_invoked_30d`
4. `pipeline_iam_role_overprivileged` (basic heuristic)
5. `codebuild_secrets_in_plaintext` (pattern match)

---

## Phased rollout

| Phase | Scope |
|-------|--------|
| **P0** | Scanner lists pipelines + CodeBuild in one region |
| **P1** | MVP 5 rules + Atlas route + mock |
| **P2** | API `scan_pipeline` + Navigator |
| **P3** | IAM deep check, artifact bucket cross-scan with S3 rules |
| **P4** | Remediations (delete pipeline, resize CodeBuild) — needs history/undo |

---

## Out of scope (for now)

- AWS CodeDeploy, CodeCommit-only scans (can add later under same module).
- GitHub Actions / external CI (not AWS API).
- Step Functions orchestration (separate service doc if needed).
- CloudPilot PR remediation strategy — see [remediations.md](./remediations.md) (different problem: *how* to apply fixes, not *what* to scan).

---

## IAM permissions (read-only)

```text
codepipeline:ListPipelines
codepipeline:GetPipeline
codepipeline:ListPipelineExecutions
codebuild:ListProjects
codebuild:BatchGetProjects
codebuild:ListBuildsForProject
codebuild:BatchGetBuilds
iam:GetRole                        (if role policy heuristic)
iam:ListAttachedRolePolicies
iam:GetPolicyVersion
s3:GetBucketEncryption             (artifact bucket cross-check)
s3:GetBucketLifecycleConfiguration
logs:DescribeLogGroups             (optional — build log groups)
```

---

## Related

- [add_s3.md](./add_s3.md) — artifact buckets often S3; lifecycle rules overlap
- [add_rds.md](./add_rds.md) — same scan rollout pattern
- [remediations.md](./remediations.md) — future: fix infra via PR (not scan)
- [to_do.md](./to_do.md)
