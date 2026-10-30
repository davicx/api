# CloudPilot — Security and Traffic

## What this is

CloudPilot can answer whether an application is exposed, who has been reaching it, and what a careful next restriction would be. The person asks in the existing chat. Results land in the existing Findings flow. A change uses the existing preview, confirmation, and history.

**Status:** Plan. Do not implement from this file until a phase is chosen.  
**Codename:** `feature_aws_traffic`  
**Related:** [Live AWS access](feature_live_aws.md) (the written restrict-and-restore procedure, and uploaded Nginx logs) · [Useful Costs](feature_useful_costs.md) · [First useful AWS costs](feature_first_useful_aws_costs.md) · [Resource History](feature_history.md)

Navigation stays as it is. Chat is where a person asks and decides. The dashboard is where they look at what CloudPilot already found. This plan does not add a security chat, a security product, or a new remediation framework.

```text
Chat
  → Understand
  → Investigate with the capability that fits
  → Show the evidence in chat and in Findings
  → Take action only after a preview and a confirmation
  → Record it in history
```

CloudPilot chooses the AWS calls. The person does not have to know whether the answer lives in EC2, S3, a load balancer, WAF, or a log.

---

## Three intentions, one chat

| The person says | CloudPilot does |
| --- | --- |
| “What is AWS WAF?” | Explain it. Do not scan. |
| “Do I have AWS WAF enabled?” | Inspect the resources that can have a web ACL. |
| “Enable AWS WAF for my application.” | Inspect the setup, explain cost and consequences, preview the change, and wait for confirmation. |

A scan and a question stay different. Asking what a service is does not start a scan. Asking to change infrastructure does not apply the change in the same turn as the explanation.

---

## Four capabilities

Build them in order. Each one can ship alone.

| Capability | Question | Phase |
| --- | --- | --- |
| Security inspection | Is this infrastructure exposed, and what protection is already configured? | 1 |
| Traffic monitoring | Who reached the application, using logs that actually exist? | 2 |
| Threat explanation | Which of those requests look like scanning or abuse? | 2 |
| Protection | What is the smallest change that matches how this app is meant to be used? | 3 |

Threat explanation rides on traffic monitoring. It does not get its own scanner. A request for a missing path is evidence. It is not, by itself, proof of a successful break-in.

Cost protection stays in the cost plans. This plan can later point at a missing rate limit or a public write as a way an AWS bill grows. It does not read Cost Explorer and it does not create a budget.

---

## Feeling we want

> I’m developing an app. Only I should be able to reach it.

> I’m inviting a few friends. Keep everyone else out.

> I’m seeing a lot of requests. Is something wrong?

CloudPilot names the resource, the port or path, and the evidence. Then it offers a review. It recommends the least expensive protection that fits the current use. A private development API does not get a load balancer and WAF added as the default answer.

---

## What exists today

| Piece | Today |
| --- | --- |
| EC2 scan | `atlas/app/core/cloud/ec2/scanner.py`. Rules include `ec2_public_ip_attached`, stopped instance, low CPU, legacy type, missing name |
| S3 scan | `atlas/app/core/cloud/s3/scanner.py`. Rules include public access block, public ACL, public bucket policy, encryption, versioning, access logging, lifecycle, missing name |
| Findings | One `Finding` model and `rule_registry.py`. Chat and the dashboard already consume scan results |
| Remediation | Existing confirm-then-apply path. EC2 pause/resume and S3 versioning are examples. No security-group writer yet |
| Kite’s API | Single-instance Beanstalk in `us-west-2`. Nginx in front of Node. No load balancer, so WAF has nothing to attach to. Inbound HTTP on port 80 from the whole internet was the last inspected rule. Saving a “My IP” replacement was not confirmed |
| Logs already seen | Nginx access logs contained automated probes (`/etc/passwd`, WordPress paths, and similar). Those lines are evidence for Phase 2. They are not a traffic product yet |
| `feature_live_aws` | Written procedure for restricting that single-instance environment to one public IPv4, restoring the previous rule, then reading an uploaded Nginx log. Still a plan |

There is no rule yet for security-group ports, SSH on port 22, a load balancer, WAF, VPC flow logs, or application rate limiting.

---

## Phase 1 — Security exposure

Read-only. Extend the existing EC2 and S3 scans. Put new results in Findings. Explain them in the current chat. No new page.

### EC2 and the network in front of it

For each instance in the selected account and region:

- Does it have a public IPv4 address? `ec2_public_ip_attached` already answers this for running instances.
- Which security groups are attached?
- Is port 80 open to `0.0.0.0/0` or `::/0`?
- Is port 443 open to the whole internet?
- Is port 22 open to the whole internet?
- Is the instance registered behind a load balancer?
- Can the instance still be reached directly, past that load balancer?
- Is a WAF web ACL attached to that load balancer or to a CloudFront distribution in front of it?

A direct path to the instance matters more than the mere presence of a load balancer. If the instance security group still accepts application traffic from the whole internet, the load balancer is not the only door.

### S3

The current public-access, public-policy, public-ACL, encryption, versioning, and access-logging rules stay. Phase 1 adds a judgment the rules do not make yet:

- A public read can be intentional, for example images meant for a website.
- Anonymous upload, overwrite, or delete is the finding to treat as urgent.
- Say what the bucket allows. Leave the purpose to the person when CloudPilot cannot tell.

Kite’s image bucket is private and objects are read with signed URLs. A finding that says “this bucket is private” is a result, not a problem to fix.

### Logging availability

Record whether these exist. Do not turn them on in this phase.

- Nginx or application logs already retained for the environment
- Load balancer access logs
- VPC flow logs
- WAF metrics, only when a web ACL exists

If a source is missing, the finding says the traffic question cannot be answered yet. It does not invent counts.

### What Phase 1 can say

> Your EC2 instance is publicly reachable on port 80.
>
> I found two things to review.
>
> The S3 bucket blocks public access.
>
> There is no load balancer, so AWS WAF is not in front of this API.

The person can open the finding and ask for help. Phase 1 stops at the explanation.

### Proposed finding ids

Use the existing Finding shape. Add a rule only when the scan can observe it.

| Id | When it is raised |
| --- | --- |
| `ec2_public_http` | Port 80 open to the whole internet |
| `ec2_public_https` | Port 443 open to the whole internet |
| `ec2_public_ssh` | Port 22 open to the whole internet |
| `ec2_direct_access_beside_load_balancer` | Instance accepts application traffic from a source other than its load balancer |
| `s3_public_write_access` | Anonymous upload, overwrite, or delete |
| `alb_missing_waf` | A load balancer exists and has no web ACL |
| `alb_access_logging_disabled` | A load balancer exists and is not writing access logs |
| `traffic_logging_unavailable` | None of the log sources above are available |

`ec2_public_ip_attached`, `s3_public_access_block_disabled`, `s3_bucket_policy_public`, `s3_public_acl`, `s3_default_encryption_off`, `s3_versioning_disabled`, and `s3_access_logging_disabled` already exist. Do not mint a second id for the same fact.

Do not add `api_rate_limiting_disabled`. Express rate limiting is invisible to these AWS calls. If it matters later, the status is **unknown**.

---

## Phase 2 — Traffic visibility

Answer “who reached the API?” from logs that are already there. For the current Beanstalk app, start with Nginx access logs. `feature_live_aws` Phase 2 is the first version of this: a log the person provides, summarized, with no invented rows.

A summary may include:

- Time window
- Request count
- Unique client addresses
- Response codes
- Paths requested most often
- Requests for paths the application does not have

Show a count only when the log contains it. If the log is missing, say **Not monitored**.

CloudWatch, load balancer access logs, and VPC flow logs can be added after that, and only when they are already enabled. Flow logs can show a connection. They cannot name an Express route. Load balancer logs can name a path, a status, and a client address. Application and Nginx logs are the source that matches this API today.

Suspicious means a repeated pattern such as many requests for sensitive paths that this app does not serve. Say that the pattern matches automated scanning. Do not claim a breach from a 404.

Illustrative numbers in chat examples are documentation. Live replies use the log in hand.

A Traffic page waits until a real summary exists. Until then, the answer stays in chat and the relevant finding stays on the Findings page.

---

## Phase 3 — Protection

One remediation at a time. Each one previews the exact change, asks for confirmation, checks the result, and keeps a way back when that is possible.

The first action is already specified in `feature_live_aws`: restrict inbound HTTP on one single-instance Beanstalk environment to an approved public IPv4 `/32`, and restore the rule that was live immediately before that change. Discover the security group from the environment. Do not hardcode an id. Refuse a change that would drop the person’s only path in without saying so, including a phone that leaves the current network.

Later actions, each its own step:

- Add another approved address, with the same preview
- Enable a log source the person chose
- Attach WAF only after a supported entry point exists and the person accepts the cost
- A temporary WAF IP block, only on that supported entry point, confirmed, and easy to remove
- Application rate limiting inside Express, described separately from WAF, because requests still reach Node before Express rejects them

Security groups do not know who is logged in. For a few friends on changing mobile networks, say that an allowlist is brittle and that an account login is the more stable door. Offer the allowlist when the person still wants it.

Do not create a load balancer or a web ACL as part of making this plan true. Recommend them when the app is meant to be public and the person asks about that step.

---

## Examples

**“How secure is my EC2 instance?”**  
Inspect the instance, its security groups, whether a load balancer sits in front, and whether anything else can bypass that load balancer. Name the open ports. Link the findings. Do not change anything.

**“Are bots hitting my API?”**  
Read the available logs. If they show repeated requests for paths the app does not have, say that. Offer the traffic summary. If logs are missing, say traffic cannot be judged.

**“Should I block this address?”**  
Explain the requests from that address and the option that fits the current entry point. On today’s single-instance API, a WAF block is not available. A security-group change is the option that exists, and it still needs a preview.

**“I only want myself and three friends in.”**  
Inspect the current door. For this Beanstalk environment, describe an address allowlist and its limit when people change networks. Guide the first address through the `feature_live_aws` confirmation. Do not open a new port to make the change.

---

## Decisions

- Keep the current navigation. Chat understands the request. Findings holds the evidence. The existing fix flow applies a change.
- Phase 1 is the next build. It is read-only.
- `feature_live_aws` remains the procedure for the IP change and for an uploaded Nginx log. This plan sets the order: inspect first, then read traffic, then change access.
- A public S3 read is not automatically a defect. Anonymous write is.
- Missing logs produce “not monitored,” not a guessed bot count.
- A private development app is recommended an allowlist and login before WAF.
- History records a protection change the same way it records any other confirmed action. This plan does not design a second undo system.

---

## Done when

Phase 1:

- A scan can explain, for one instance, public address, open world-wide ports, security groups, any load balancer, and whether direct access bypasses that load balancer.
- The same scan can explain S3 public read versus anonymous write, plus whether logging and WAF are present.
- New observations use the finding ids in this plan and the ones that already exist.
- Chat can answer “is this exposed?” from those findings without a new page.

Phase 2:

- An available Nginx log produces a summary with real counts and a clear window.
- A missing log is reported as not monitored.
- Scanner-style paths are described as automated probing.

Phase 3:

- The first confirmed action is the restrict-and-restore flow in `feature_live_aws`.
- The preview names the environment, the port, and the address.
- Restore puts back the rule from immediately before the change.
