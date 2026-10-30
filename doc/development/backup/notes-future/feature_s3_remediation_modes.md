# S3 remediation modes (later)

## What this does

When S3 Fix actually works, reuse the **same EC2 delivery choices** instead of
the Chat “coming soon” stub:

```text
How would you like to fix this?
  · Automatic
  · Instructions
  · CLI
  · Pull Request
```

**Status:** Future — not started  
**Came from:** [Friendly Dashboard](../finished/feature_friendly_dashboard.md) Step 6  
**Related:** [Remediations](./remediations.md) · [GitHub Pull Requests](./feature_github_pull_requests.md) · [Make scans useful](./make_scans_useful.md)

---

## Why it waited

Friendly Dashboard MVP shows **Fix** so findings are not dead-end warnings, then
opens Chat with honest copy:

```text
Fixing this finding is coming soon.

CloudPilot found the issue, but automatic remediation for this S3 finding
isn't available yet.
```

None of the S3 remediations work end-to-end yet. A fake four-mode menu would
look unfinished.

---

## When to pick this up

Only after an S3 action works for real (e.g. enable versioning / encryption /
public access block) through Atlas + history/undo like EC2.

Then:

* Keep Fix / Review on the friendly findings table
* Replace the S3 Chat stub with EC2-style execution modes
* Do **not** mutate AWS just because Fix was clicked — user still picks a mode

Until then, leave the coming-soon Chat path.
