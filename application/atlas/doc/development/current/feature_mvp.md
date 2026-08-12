# CloudPilot MVP — EC2 Operating Boundary

## What this does

Define the smallest product surface that proves CloudPilot can **operate AWS**
well — without expanding into every AWS service or polishing every execution
mode.

**MVP story:**

```text
CloudPilot is really good at managing EC2.

Create it.
Delete it.
Pause it.
Resume it.
See what CloudPilot changed.
Undo safe changes.
For IaC environments, propose the change through a PR instead.
```

## Current step

**Plan locked — MVP boundary defined.** Use this checklist to track demo readiness.

## Next

Work the five items below toward `works` + `passed`. Primary product work that
feeds this checklist:

- [Friendly Create EC2](../finished/feature_friendly_create_instance.md) — create polish
- [Useful Price](./feature_useful_price.md) — honest compute cost estimates in speak
- [GitHub Pull Requests](../future/feature_github_pull_requests.md) — PR demo concept (deferred)
- Pause / Resume already shipped — [feature_pause_instance](../finished/feature_pause_instance.md)
- Verify / scan recovery shipped — [feature_verify_request](../finished/feature_verify_request.md)
- History backend shipped — [history](../finished/history.md); UI polish still open

**Status:** Active (MVP dashboard)  
**Codename:** `feature_mvp`  
**Related:** [Current Development](./current_development.md)

---

# Locked MVP boundary

Stay on **EC2**. Do not add another AWS service until these five flows feel
really good to use.

| Mode | Meaning |
|------|---------|
| **Automatic** | CloudPilot changes AWS |
| **Pull Request** | CloudPilot proposes the infrastructure change; engineering process controls deploy |

Do **not** use “add an S3 bucket” as the main PR demo.

Preferred PR demo:

```text
Change my API EC2 instance from t3.micro to t3.small.
```

Show a real Terraform diff and a real PR — not a toy bucket example.

---

# MVP checklist

`works` = the flow can be demonstrated end-to-end.  
`passed` = demo-quality: honest, clear, and good enough to show externally.

---

## 1. Create EC2 — polished

Conversation → understand intent → AWS action → result → history → undo.

### Create instance naturally through chat

- [ ] works
- [ ] passed

### Friendly guidance around what CloudPilot is about to do

- [x] works
- [x] passed

### Automatic execution works

- [ ] works
- [ ] passed

### History entry is created

- [ ] works
- [ ] passed

### Undo works

- [ ] works
- [ ] passed

**Primary feature:** [Friendly Create EC2](../finished/feature_friendly_create_instance.md)

---

## 2. Delete EC2 — works

Identify → verify exists / sensible state → terminate → clear result.

History/undo are **nice**, not MVP blockers. Delete undo is recreating an
equivalent instance, not reversing one API call — do not block MVP on it.

### Identify the instance

- [ ] works
- [ ] passed

### Verify it exists / state is sensible

- [ ] works
- [ ] passed

### Delete / terminate it

- [ ] works
- [ ] passed

### Show a clear result

- [ ] works
- [ ] passed

### History recorded (optional for MVP)

- [ ] works
- [ ] passed

---

## 3. Pause / Resume EC2 — works well

Easy-to-understand demo:

```text
Pause my dev server.  → find → explain → stop
Start it again.       → resume
```

### Pause finds / verifies target and stops it

- [ ] works
- [ ] passed

### Resume finds / verifies target and starts it

- [ ] works
- [ ] passed

### Clear result messages (including already paused / already running)

- [ ] works
- [ ] passed

### Not-found offers existing scan recovery

- [ ] works
- [ ] passed

### History + undo for CloudPilot-initiated changes

- [ ] works
- [ ] passed

**Shipped base:** [Pause / Resume](../finished/feature_pause_instance.md) ·
[Verify Request](../finished/feature_verify_request.md)

---

## 4. History — polished UI

Spend care on this surface. It communicates:

```text
CloudPilot remembers what it changed.
```

Target feel:

| Action | Resource | Status | Time | |
|--------|----------|--------|------|---|
| Create EC2 | kite-dev | Completed | 2 min ago | **Undo** |
| Pause EC2 | kite-api | Completed | Yesterday | |

### History list shows recent CloudPilot changes

- [ ] works
- [ ] passed

### Clear Action / Resource / Status / Time columns

- [ ] works
- [ ] passed

### Undo available on safe / CloudPilot-initiated changes

- [ ] works
- [ ] passed

### UI polish good enough for external demo

- [ ] works
- [ ] passed

**Shipped base:** [History](../finished/history.md)

---

## 5. Pull Request — demonstrate the concept

Demonstrate the idea. Do **not** perfect the full IaC platform.

Build real Terraform for actual API infrastructure (useful regardless of
CloudPilot). Keep a demo branch where CloudPilot can show a realistic change.

### Chat can choose Pull Request mode for an EC2 change

- [ ] works
- [ ] passed

### Real Terraform diff for resize (e.g. t3.micro → t3.small)

- [ ] works
- [ ] passed

### Real GitHub PR opened with reviewable change

- [ ] works
- [ ] passed

### No AWS mutation from the PR path

- [ ] works
- [ ] passed

### Distinction vs Automatic is obvious in the demo

- [ ] works
- [ ] passed

**Primary feature:** [GitHub Pull Requests](../future/feature_github_pull_requests.md)

Preferred demo prompt:

```text
Change my API EC2 instance from t3.micro to t3.small.
```

Preferred response shape:

```text
I can make that change through a pull request so you can review it
before anything changes in AWS.
```

Then show:

```hcl
resource "aws_instance" "api" {
-  instance_type = "t3.micro"
+  instance_type = "t3.small"
}
```

And a real PR title like: **CloudPilot: Resize API EC2 instance**

---

# Explicitly out of MVP

```text
new AWS services beyond EC2
perfect every Instructions / CLI path
perfect delete undo / recreate
S3 bucket PR as the main demo
full terraform apply / deploy pipeline
generic remediation frameworks
```

Resist adding more until the five checklist areas above feel excellent.

---

# How to use this doc

1. Keep architecture detail in the linked feature docs.
2. Mark **works** when the path is demonstrable.
3. Mark **passed** when it is demo-quality for an external audience.
4. Prefer finishing create polish + pause/resume trust + history UI + one
   strong PR story before expanding scope.
