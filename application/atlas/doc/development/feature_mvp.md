# CloudPilot MVP — Canonical Scope

**Status:** Active — canonical MVP boundary  
**Codename:** `feature_mvp`  
**Last updated:** 2026-09-05  

**Related:** [Current Development](./current/current_development.md) · [Feature Conversation](./current/feature_conversation.md) · [GitHub Pull Requests](./future/feature_github_pull_requests.md) · [Archived EC2 operate MVP](./future/feature_mvp_ec2_operating_boundary.md)

This document **supersedes** the previous EC2-only MVP boundary
([archived](./future/feature_mvp_ec2_operating_boundary.md)).

---

# CloudPilot MVP — Canonical Scope

This section supersedes the previous EC2-only MVP boundary.

The MVP is now focused on demonstrating CloudPilot's core product loop:

> **Find → Understand → Explain → Act → Verify**

The supported MVP demonstration will use **EC2 and S3 only**.

Optional demo beat (not a live product requirement):

> **Preview IaC workflow** — pre-created Terraform PR for EC2 resize

---

## EC2

CloudPilot should demonstrate:

1. Scan EC2.
2. Identify an oversized/underutilized instance.
3. Answer a normal AWS question about the resource (e.g. type / “tell me about this instance”).
4. Explain the finding and recommended action.
5. Pause the instance through CloudPilot.
6. Resume the instance through CloudPilot.
7. Re-scan/retrieve state as necessary to demonstrate that CloudPilot understands the current environment.
8. Preview a future Terraform resize PR (demo-only; after real pause/resume).

Automatic EC2 resizing is **not required for MVP**.

EC2 resizing is only used to preview a future Terraform PR workflow — **after** real operate actions, so the first post-finding action is not a simulated capability.

Example demo beat (late in the EC2 arc):

```text
User: How would I downsize this?
User: Prepare a Terraform PR to downsize this instance.
```

The MVP does **not** need to actually generate or submit this PR.

A pre-created GitHub Terraform PR will be used during the demo to illustrate the planned workflow.

CloudPilot must not falsely claim that it created a real PR. This is explicitly a preview/future capability.

---

## S3

CloudPilot should demonstrate:

1. Scan S3.
2. Surface a meaningful existing S3 finding.
3. Explain why the finding matters.
4. Answer conversational questions about the bucket.
5. Combine AWS information with organizational knowledge.

Example conversation:

```text
Scan my S3 buckets.

Why does that finding matter?

What is this bucket used for?

Who owns it?

Would it be safe to delete?
```

S3 remediation is **not required** for MVP.

The purpose of S3 is to demonstrate that CloudPilot can understand infrastructure and combine AWS facts with organizational knowledge.

---

## Environment-Level Conversation

CloudPilot should support a broader question such as:

```text
Is there anything in my AWS environment I should be worried about?
```

The response should use available EC2/S3 resources, scan findings, recent context, and relevant organizational knowledge.

This should not be a hard-coded demo response.

---

## Remove From MVP Requirements

The following are no longer required for the MVP demonstration:

* EC2 create
* EC2 delete
* automatic EC2 resize
* EC2 history/undo as a primary demo feature
* real Terraform PR generation
* real GitHub PR submission
* S3 remediation
* additional AWS services

Existing implementations of these capabilities do not need to be removed. They simply should not drive MVP development or block MVP completion.

---

## Terraform PR Preview

The demo may include a pre-created Terraform PR showing how CloudPilot could eventually propose infrastructure changes through the customer's existing IaC workflow.

Preferred example:

**Finding:** EC2 instance is oversized.

**User request:**

```text
Prepare a Terraform PR to downsize this instance.
```

**Example PR:**

```diff
resource "aws_instance" "app" {
-  instance_type = "t3.large"
+  instance_type = "t3.medium"
}
```

In the **live demo**, establish real operate first (pause/resume), then transition:

> For something like resizing, eventually I don't necessarily want CloudPilot making that change directly. I want it to fit into the team's existing workflow.

Then show the Terraform PR. Conceptual future workflow:

```text
CloudPilot finds problem
        ↓
Explains recommendation
        ↓
User requests change
        ↓
CloudPilot prepares IaC change
        ↓
Engineer reviews PR
        ↓
Existing CI/CD process applies change
```

Again, actual PR generation is **not an MVP requirement**.

During the demo, say clearly that PR generation is not live yet and show the
prebuilt PR as the destination.

---

## Demo readiness snapshot

| Demo | Status | Purpose |
|------|--------|---------|
| Scan EC2 | Working | Find problems |
| Find oversized EC2 | Working | Intelligent recommendation |
| “Tell me about this instance” / type | Partial | Talk about the resource (not only commands) |
| Explain finding / “why downsize?” | Partial | Explanation |
| Pause instance | Working | Direct action |
| Resume instance | Working | Direct action |
| Re-scan EC2 | Working | Show current state/findings |
| “How would we downsize?” → Terraform PR preview | Demo only | Future IaC workflow (after real act) |
| Scan S3 | Working | Broaden AWS understanding |
| S3 finding | Working | Find config/security problems |
| Ask about finding | Partial | Explain |
| “Why do we have this bucket?” | Working | Organizational knowledge |
| “Who owns it?” | Working | Organizational knowledge |
| “Anything I should worry about?” | Partial | Environment-level reasoning |

---

## MVP checklist

`works` = demonstrable end-to-end.  
`passed` = demo-quality for an external audience.

### EC2 — Find / Talk / Explain / Act / Verify / Preview

- [ ] Scan EC2 — works / passed
- [ ] Oversized / underutilized finding surfaces clearly — works / passed
- [ ] “Tell me about this instance” / “What type is this?” (AWS knowledge) — works / passed
- [ ] Explain finding + recommended action — works / passed
- [ ] Pause instance (conversational) — works / passed
- [ ] Resume instance (conversational) — works / passed
- [ ] Re-scan / state makes current environment clear — works / passed
- [ ] Terraform resize PR preview after real act (prebuilt; no false claims) — works / passed

### S3 — Find / Explain / Org knowledge

- [ ] Scan S3 — works / passed
- [ ] Meaningful finding surfaces — works / passed
- [ ] Explain why finding matters — works / passed
- [ ] Bucket purpose (org knowledge) — works / passed
- [ ] Who owns it (org knowledge) — works / passed
- [ ] Safe to delete? (AWS + org context) — works / passed

### Environment

- [ ] “Anything I should worry about?” uses real CloudPilot context — works / passed

### Prioritize for remaining work

1. Conversational context over findings  
2. Pronoun / resource references (`it`, `this instance`, `this bucket`)  
3. Environment-level summary reliability  
4. Honest wording when MESSAGE_RESPONSE=openai (no fake “hold on / scanning…”)  

Do **not** prioritize: create/delete polish, automatic resize, live PR generation, new AWS services.

---

## MVP Definition of Done

The MVP is complete when the following demo works reliably:

```text
Scan EC2
   ↓
Finding

"Tell me about this instance."
   ↓
AWS knowledge

"Why are you recommending downsizing it?"
   ↓
Explanation

"Pause it."
   ↓
Action

"Resume it."
   ↓
Action

"How would we downsize it?"
   ↓
Recommendation

"Prepare a Terraform PR."
   ↓
Future workflow preview

S3 scan
   ↓
Find meaningful issue
   ↓
Explain issue
   ↓
Ask what bucket is used for
   ↓
Ask who owns it

Environment question
   ↓
"Is there anything I should be worried about?"
   ↓
Useful answer based on real CloudPilot context
```

Do not expand scope after these workflows are reliable.

Prioritize fixing conversational context, AWS knowledge retrieval, finding context, pronoun/resource references, and reliability over adding additional AWS services or actions.

---

## Architecture principle

Do not redesign CloudPilot into a fully autonomous agent as part of this work.

Keep the existing deterministic pipeline where it is useful.

Mutating AWS actions continue through authorization/execution paths (pause/resume).

General conversation may reason over AWS facts without bypassing action authorization.

CloudPilot must not claim it created a real PR when showing the preview.
