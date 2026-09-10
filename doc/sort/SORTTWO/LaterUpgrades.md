# Later upgrades (CloudPilot / Atlas)

## Done

- [x] Connected scanner to real AWS (boto3)
- [x] Using paginator for `describe_instances`
- [x] Fetching CloudWatch CPU metrics per instance
- [x] Returning canonical instance shape
- [x] Using config values (`PROFILE`, `LOOKBACK_DAYS`, `METRIC_PERIOD`)
- [x] Safe error handling (CloudWatch failures do not crash scan)

## To do

- [ ] **Scan all regions** — Support scanning **all** AWS regions in one request (e.g. `region: "all"` or `regions: ["all"]`) so users can discover forgotten resources everywhere. (Implementation notes: **§7 Multi-region scanning** below.)

---

## Small improvements (quick wins)

### 1. Sort CloudWatch datapoints

AWS does not guarantee order of datapoints.

- [ ] Sort datapoints by timestamp before processing

```python
datapoints = sorted(
    response.get("Datapoints", []),
    key=lambda x: x["Timestamp"]
)
```

### 2. Use `sum()` for cleaner average calculation

- [ ] Replace manual loop with `sum()`

```python
avg_cpu = sum(dp["Average"] for dp in datapoints) / len(datapoints)
```

### 3. Improve debug logging

- [ ] Add log for CPU metric fetching step

```python
print("STEP 3C: Fetching CPU metrics")
```

### 4. Add `launch_time` to instance shape

Needed for future rules (old instance, lifecycle, cost analysis).

- [ ] Add to instance dict

```python
"launch_time": instance["LaunchTime"]
```

---

## Medium improvements (next iteration)

### 5. Add more EC2 rules

Increase product value quickly.

- [ ] Implement `stopped_instance` rule
- [ ] Implement `missing_name_tag` rule
- [ ] Implement `old_instance` rule

### 6. Expand filtering system (service layer)

**Current support:**

- `full`
- `team`

**Future support:**

- [ ] Tag-based filtering (generic key/value)
- [ ] Instance ID filtering
- [ ] Region override support (explicit region selection per request)

### 7. Multi-region scanning (discovery feature)

**Goal:** Allow users to scan across all AWS regions to find forgotten or unknown resources.

**Why:**

- Users often forget which regions have active resources
- Improves visibility before cost optimization or remediation
- Aligns with CloudPilot’s “full visibility” value

**Implementation plan:**

- [ ] Add support for `region: "all"` or `regions: ["all"]` in request body
- [ ] Retrieve available regions using:

```python
boto3.Session().get_available_regions("ec2")
```

- [ ] Loop through each region and call `scan_ec2_instances(region)`
- [ ] Merge all instances into a single list
- [ ] Ensure each instance already includes its `region` field
- [ ] Run rules on the combined dataset (no changes needed to rules)

**Considerations:**

- Handle slower performance due to multiple API calls
- Avoid AWS throttling (consider sequential or controlled concurrency)
- Ensure IAM permissions allow access across all regions
- Add visibility into which regions were scanned
- Handle partial failures (one region failing should not break entire scan)

**Future UX improvements:**

- [ ] Show per-region breakdown in response
- [ ] Allow scanning specific region lists (e.g. `["us-west-2", "us-east-1"]`)
- [ ] Add progress or status feedback for large scans

---

## Advanced improvements (performance and scale)

### 8. Replace per-instance CloudWatch calls

**Problem:** One API call per instance does not scale well.

**Solution:** Use `GetMetricData` to batch requests.

- [ ] Implement batched CloudWatch metric retrieval

### 9. Add caching layer (optional)

- [ ] Cache CPU metrics for short duration (e.g. 5–15 minutes)
- [ ] Reduce AWS API costs

---

## Future enhancements (CloudPilot vision)

### 10. Cost estimation

- [ ] Replace static `RIGHTSIZE_MAP` with real AWS pricing API
- [ ] Show estimated monthly savings

### 11. Multi-account support

- [ ] Support multiple AWS profiles or accounts
- [ ] Tag-based organization separation

### 12. Real-time insights

- [ ] Add CloudWatch anomaly detection
- [ ] Detect spikes or unusual behavior

---

## EC2 operation API (`POST /ec2/create`, `POST /ec2/delete`)

Primitive create / terminate flows live in `core/cloud/ec2/operations/manage_instances.py`. Future hardening:

- [ ] **Pydantic request models** — Validate `image_id`, `instance_id`, `tags`, `region` in the API layer; document in OpenAPI.
- [ ] **Non-default VPC** — Accept `subnet_id`, `security_group_ids`, optional `key_name`, IAM instance profile, user data when `run_instances` must target a specific network.
- [ ] **Waiters** — After create: wait until `running` (or failed) before returning; after delete: optional wait until `terminated`.
- [ ] **Semantics** — Separate **stop** vs **terminate** if you need stop/start testing without destroying volumes; document behavior in API.
- [ ] **`auto_stop` (optional)** — After create, call `stop_instances` for cheap “create then park” test instances.
- [ ] **Safety** — Blast-radius tags, account/OU limits, idempotency, dry-run mode before real `run_instances` / `terminate_instances`.
- [ ] **Quotas / cost** — Surface EC2 quota or estimated hourly cost before create in sensitive environments.

---

## Product growth (priorities)

Checklist of things worth considering as the product grows. Priorities are **relative**—revisit when scope or compliance changes.

### High

- [ ] **Authn / authz** — Who may run scans vs remediations; scope by account, OU, or tag policy so the API cannot exfiltrate or change arbitrary AWS resources.
- [ ] **Durable state** — Store scan runs, findings, and remediation attempts (with correlation IDs) for audit, support, and “what changed?”—in-memory or log-only does not scale past a single process.
- [ ] **AWS failure boundary** — Map boto3 / network errors to the same `{"error": {code, message}}` (or HTTP 502 with a stable code) at one layer so clients never see a mix of exception types and ad-hoc strings.
- [ ] **Remediation safety** — Dry-run, blast-radius limits (tags/accounts/regions), idempotency keys, and explicit human confirmation for destructive actions before automating toggles or resizes.

### Medium

- [ ] **Request contract** — Replace raw `dict` bodies with Pydantic models; document every `error.code` in OpenAPI so frontend and agents stay aligned.
- [ ] **Scale of inventory** — Pagination, filters, or async jobs when `DescribeInstances` (plus metrics) exceeds comfortable latency or memory for one HTTP request.
- [ ] **Observability** — Structured logs + trace/correlation ID from route through scanner and rules; optional metrics (latency, counts, error rates) for operations.
- [ ] **Configuration** — Thresholds, default region, profiles, and feature flags in env/config—not scattered literals—so non-developers can tune behavior safely.
- [ ] **Semantics of `rules`** — Define behavior for `null` vs `[]` vs omitted (all rules vs none vs default set) and enforce it in one place so it never surprises API consumers.

### Low

- [ ] **`build_error(code, message)`** — Small helper to avoid duplicating the error dict shape across service, registry, and future modules.
- [ ] **API versioning** — Prefix or version header once external clients depend on stable shapes; defer until you have consumers beyond your own UI.
- [ ] **Rule plugins** — Load rules from entry points or a registry file if the number of rules or teams grows; keep the runner and `Finding` contract stable.
- [ ] **Testing strategy** — Contract tests for the error envelope; integration tests with mocked AWS; optional snapshot tests for golden JSON responses.

---

# FRONT END (Kite)

## How to use this file

Pick one **high** item when security, compliance, or multi-user access becomes real. Use **medium** items when latency, operability, or API clarity hurts velocity. **Low** items are polish and maintainability once the slice is stable in production-like environments.
