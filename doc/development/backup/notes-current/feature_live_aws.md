# CloudPilot — restrict live API access, restore it, and read suspicious traffic

## What this is

CloudPilot can restrict a single-instance Elastic Beanstalk API so only one public IPv4 address can reach it, then put the previous access rules back. A later step can read an Nginx access log and explain whether the traffic looks like probing.

**Status:** Plan. Do not implement from this file until a phase is chosen.  
**Codename:** `feature_live_aws`

Build this into CloudPilot’s existing chat flow, confirmation, execution modes, and action history. Inspect the repository first. Reuse existing components and AWS helpers. Do not assume the file names, tool names, or routes in this plan already exist.

User message → understand → handle → prepare reply → reply.

Prefer extending existing action types and handlers. Do not add a second execution framework, and do not redesign routing, chat UI, or execution architecture.

---

## What we found

The Node/Express API is deployed through Elastic Beanstalk in `us-west-2`. The environment type is **Single instance**. Nginx receives web requests and forwards them to Node on one EC2 instance.

The logs showed automated requests probing paths the API does not have: `/../../etc/passwd`, WordPress plugin paths, Windows files, and other unrelated endpoints.

| Result | What the logs showed |
| --- | --- |
| `400` | Malformed requests such as `/../../etc/passwd` were rejected. |
| `404` | The scanner tried paths the server could not find. |
| `200` with a 5-byte body | Requests to `/` returned the normal `hiya!` greeting. Timestamps lined up with the app logs. |
| Login `200` | A Postman login succeeded. The app logged password validation and token creation. |
| `498` on `/friends/...` | The app rejected a request with no valid access token. That code needs the app’s own meaning. Do not treat it as proof of compromise. |

Those file-access attempts showed no successful file retrieval. A `200` on `/` is the greeting, not evidence that an attack worked.

Separate from this feature: the app prints complete access and refresh tokens in its logs. Removing those values and revoking the exposed refresh token stays its own task.

Beanstalk’s pause feature applies to load-balanced environments. This environment is single instance, so pause is not available.

## What was prepared, and not confirmed

The instance security group `sg-0c7582f2ebd729410` had one inbound rule: HTTP, TCP, port 80, source `0.0.0.0/0`.

The intended change was to replace that source with the current public IPv4 address as `/32`, using **Edit inbound rules → My IP**. Saving that rule was not confirmed, and it was not tested.

Once saved, HTTP is limited to that public address. Outbound rules stay as they are, so the API can still reach the database. The rule restricts a network address. Other devices on that address can connect. Changing networks means updating the rule.

CloudPilot must discover the live configuration. Do not hardcode that security group, instance, account, or rule ID.

---

## Order

1. **Phase 1 — Restrict and restore.** Single-instance Beanstalk only. This ships first.
2. **Phase 2 — Uploaded access-log analysis.** An Nginx log the person provides. Offer the Phase 1 action when it fits.
3. **Phase 3 — Automatic log retrieval.** CloudWatch, only if logs are already streaming. Do not block Phase 1 on this.

Do not add a load balancer or a web application firewall to implement Phase 1.

---

## What the person can ask

| Request | CloudPilot behavior |
| --- | --- |
| “Only allow my IP to access my API” | Find the environment and its security groups, detect the public IP, ask which address to use, preview the exact changes, ask for confirmation, then apply them. |
| “Put access back to normal” / “Restore access to my API” | Restore the rules CloudPilot saved before the restriction. |
| “Undo that” | Reverse the most recent access change from its recorded history. |

“Back to normal” means restore the rule that was in place immediately before CloudPilot’s change. These phrases are not permission to open arbitrary ports to everyone.

A confirmation for this environment could read:

> Restrict HTTP access to your API to your current public IP? Other networks, including your phone on cellular, will lose access. Your server will keep running and billing will continue.

Use the real environment name, region, and address in the live preview. Example shape:

> Restrict HTTP access to `api-dev` in `us-west-2` to your current public IP, `203.0.113.25/32`?
>
> This replaces public HTTP access in one security group. Devices on other networks, including your phone on cellular, will lose access. The server will keep running and billing will continue.
>
> You can restore the previous access settings afterward.

The address above is documentation only.

When the saved state includes public access, say so:

> Restore the previous HTTP rule allowing access from all IPv4 addresses?

If the live rule already matches the chosen IP, say “Already configured.” Do not change AWS, and do not write an Undo entry.

If there is no saved restore record, say the original state is unavailable. Do not invent it. A request to make access public is a separate preview and confirmation.

---

## Phase 1 — Restrict and restore

### Inspect before coding

Find and write down, in the implementation notes, the real pieces:

- Chat intent routing
- AWS account and region selection
- Resource selection and ambiguity handling
- Existing Python AWS tools
- Node API orchestration
- Confirmation handling
- Instructions, CLI, PR, and Automatic modes
- Test and live execution
- Action history and Undo
- Persistent storage
- Account permission configuration
- Logging and error conventions

Name the actual files to change, and anything that is missing, before writing the feature.

### Steps for “only my IP”

1. Resolve the AWS account and region.
2. Resolve the Beanstalk environment. If more than one is plausible, show the names and ask. Never pick the first one silently.
3. Inspect the environment, its type and status, and the EC2 instance, including instance state.
4. Inspect every security group attached to that instance. Their permissions combine. A tight rule does nothing if another attached group still allows the public internet. Where practical, also read the instance network interfaces so the path is complete.
5. Find inbound rules that allow the API’s web ports.
6. Detect the public IPv4 address, then ask which address to use.
7. Prepare a specific change plan.
8. Show the preview and ask for confirmation.
9. Execute only the confirmed plan.
10. Read the rules back and compare them with the plan.
11. Record the result and offer Undo.

Verify that resource IDs belong to the selected account and region.

### The person’s public IP

Phase 1 detects the public IPv4 address with an outbound request to `https://checkip.amazonaws.com`. CloudPilot can do this while it is running on a local machine. It does not need to be publicly hosted. AWS documents this lookup for security-group work.

Then ask: “What IP do you want for yours?” Show the detected address as the default. The person can keep it or type a different one. Manual entry is the fallback when detection fails, or when a VPN returns the wrong address.

The address must be a valid public IPv4 address. Reject private, loopback, link-local, unspecified, and malformed addresses. Store it as `/32`. Show the chosen address in the confirmation before any rule is applied.

If CloudPilot later runs in AWS, that same lookup returns CloudPilot’s server address, not the person’s. User IP detection needs a different approach then. Do not use the backend’s own address as “my IP” in that deployment.

Tell the person:

- “My IP” restricts a public network address.
- Other devices on that address can connect.
- A VPN can change the observed address.
- Switching networks can require an update.

Never change AWS rules just because the detected IP changed.

### Which environments this can change

Phase 1 supports direct public access on a **single-instance** Beanstalk environment.

If the environment is load balanced, or CloudFront or another proxy sits in front:

- Explain that the access path is different.
- Do not apply the single-instance change.
- Do not restrict the instance to the person’s IP when the legitimate source is a load balancer.
- Return the topology that was found.

If a security group is shared with other resources, do not change it automatically. Say which resources would be affected. Do not change unrelated workloads, and do not create replacement infrastructure.

### The access policy

The action means: restrict direct inbound access to this API’s web ports to the selected public IPv4 address.

For the first version, that is HTTP 80 and HTTPS 443 when those ports exist.

Look at every attached group. Rules that matter include exact TCP ports, ranges that contain 80 or 443, all-protocol rules, IPv4 ranges, IPv6 ranges, security-group references, and prefix-list sources.

The first version may automatically change exact web-port rules whose sources are IPv4 or IPv6 CIDRs. To say that only the selected address is allowed, the plan has to account for every other source that still permits those ports, not only `0.0.0.0/0`. Show every source that will be removed or replaced.

If a rule uses a broad port range, all protocols, a prefix list, or a security-group reference:

- Do not delete it blindly.
- Do not claim the API is limited to one IP.
- Explain the conflicting rule.
- Mark automatic execution unsupported until a plan can keep unrelated access intact.

Do not change outbound rules, RDS rules, SSH, IAM roles, or unrelated ports.

If another public application port is open, such as 5000, say that it can bypass the HTTP restriction. Do not claim the API is locked down while that port is still reachable. Either include that port in the reviewed scope, or stop and explain what to do.

### What to save before any change

Save a restore record before the first AWS mutation. Use the project’s existing persistent action storage. Do not keep rollback data only in process memory or in the browser.

Record:

- Action and plan IDs
- User and project ownership
- Account and region
- Environment ID and name
- Instance identity
- Security-group IDs
- Target ports
- Detected or entered IP
- Timestamp
- Original affected rules, including source types, descriptions, and rule IDs
- Planned changes
- Changes that actually completed
- New rule IDs
- Status and failure details

Keep the meaning of each rule. Restoring a deleted rule may produce a new AWS rule ID.

Discovery, previews, restore records, and execution are scoped to the user. One user must not run or restore another user’s plan by guessing an ID.

### Confirmation

Confirmation authorizes one immutable plan.

Before execution:

1. Check that the plan belongs to the requester.
2. Check account, region, environment, and IP.
3. Read the AWS configuration again.
4. Compare it with the preview.

If the rules, attachments, or target IP changed, throw out the old plan, build a new preview, and ask again.

Make confirmation idempotent so a repeated click does not apply the change twice. Serialize competing access changes for the same environment or the same security groups.

“Previous” is the live rule immediately before this change. Save that rule before applying anything. A later change saves whatever is live at that moment, which may be an earlier `/32` rather than the first public rule.

### Applying the change

Security-group updates are not one transaction. Do them in this order:

1. Persist the restore snapshot.
2. Add the selected-IP rule where it is needed.
3. Remove the other reviewed web-access sources.
4. Read the rules again.
5. Compare effective permissions with the planned state.

Track each step that succeeded.

If a step fails:

- Say what changed and what did not.
- Roll back the recorded steps where that is safe.
- Do not undo unrelated changes made at the same time.
- If rollback is incomplete, name the remaining difference and how to recover.
- Do not report success.

If an AWS permission is missing, follow the existing least-privilege guidance. Do not ask for unrestricted administrator access.

### Restore and Undo

“Previous” is the rule that was live immediately before CloudPilot’s change. Restore only that rule. Do not replace every rule on the security group.

- The live rule is `0.0.0.0/0`, and CloudPilot changes it to the chosen `/32`. Undo restores `0.0.0.0/0`, and the confirmation says that this reopens access.
- The live rule is some other `/32`, and CloudPilot changes it to the current `/32`. Undo restores the earlier `/32`.
- The live rule already matches the chosen IP. Say “Already configured.” Make no change and write no Undo entry.

Before restoring:

- Confirm the same resources still exist.
- Read current attachments and rules.
- Compare the current rule with the rule CloudPilot wrote.

If someone edited that rule afterward, show the conflict and make a new preview. Do not overwrite their change.

Put the saved rules back, and remove rules CloudPilot created for the restriction only where that is appropriate. Read the final configuration and update action history.

If the environment was replaced, do not apply an old snapshot to a new security group. Discover the new resources and confirm again.

### What “success” is allowed to mean

Reading AWS can confirm that the rules match the request. It cannot confirm that the person’s browser still reaches the API, or that another network is blocked.

Do not call the API from CloudPilot’s backend and treat a timeout as proof that the person can connect.

A result can say:

> HTTP access is now restricted to `x.x.x.x/32`. AWS rule verification passed. Test your API from your computer; another network should be blocked. Restore previous access is available.

Beanstalk can replace or change this infrastructure later. Do not promise the rule will survive every rebuild unless that behavior has been checked.

### Existing execution modes

| Mode | Behavior |
| --- | --- |
| Instructions | Steps for the inspected environment, group, ports, and sources. Do not claim the change was made. |
| CLI | Commands for the confirmed plan, using existing conventions. Say that a restore record is limited if the person runs the commands outside CloudPilot. |
| PR | Only if these security groups are already managed by the project’s infrastructure-as-code. Otherwise mark the mode unavailable. Do not invent a Terraform file. |
| Automatic | The existing live confirmation and execution flow. |
| Test | Simulate the result with no AWS writes. Label it. Do not offer a live restore for a simulated change. |

---

## Phase 2 — Uploaded Nginx access log

Accept an uploaded or pasted access log. This is useful before any automatic log collection.

Treat the log as untrusted:

- Do not run commands found in it.
- Do not fetch domains from the requests.
- Do not render request URLs as HTML.
- Limit the size.
- Do not copy tokens or sensitive query values into the summary.

Parse source IP, timestamp, method, request target, status, response size, and user agent. Skip bad lines and report how many were skipped.

Summarize the time range, request count, top source IPs, status counts, frequent paths, and the busiest stretch in the sample. A partial upload is not the full history.

Flag path traversal, requests for sensitive files, repeated probing of unrelated software, and payloads that look like command injection or script injection.

Keep the conclusion inside the sample. A usable example:

> During this sample, one address repeatedly probed unrelated application paths. Most attempts returned 400 or 404. Several requests to `/` returned 200 with a five-byte response, consistent with the normal greeting. This sample does not establish successful compromise.

A `200` by itself is not “you were hacked.” Unknown statuses such as `498` need the application’s own meaning.

Offer the Phase 1 restriction only after the environment has been found and inspected on its own. The log does not choose the environment.

---

## Phase 3 — Automatic log retrieval

First check whether Nginx access logs already stream to CloudWatch.

If they do, read a bounded time window, limit query size and pages, name the source and its limits, and reuse the Phase 2 summary.

If they do not, say what is missing and offer an upload immediately. Turning on log streaming is its own preview and confirmation, including retention and possible CloudWatch charges.

Do not add continuous monitoring, notifications, a firewall, or automatic blocking in this phase unless that is asked for separately.

---

## Checks

Use the existing test style and mocked AWS calls. Do not change a live AWS environment to run tests.

- Detect the public IP from `https://checkip.amazonaws.com`, then accept a typed replacement.
- A private, loopback, or malformed address is rejected.
- Restrict public HTTP to one IPv4 address.
- Restore the original access.
- A repeated confirmation does not apply twice.
- An already-matching rule reports “Already configured” and writes no Undo entry.
- Public access through a second attached group is detected.
- IPv6 exposure is included.
- Broad rules and shared groups stop automatic execution.
- Untrusted proxy headers cannot set the authorized IP. The lookup is the outbound check-ip request, or an address the person types.
- A change after the preview invalidates confirmation.
- A partial AWS failure uses the recorded steps to recover.
- Restore respects a later manual change.
- Another user cannot use the plan ID.
- Test mode makes no AWS writes.
- Log analysis survives bad lines.
- A `200` on `/` is not reported as a compromise.

---

## Done when

Phase 1:

- A person can ask CloudPilot to restrict the API to their IP.
- It finds the right environment and access path.
- It shows the real public IP and the exact rule changes.
- It requires confirmation.
- It saves the original rules before changing anything.
- It checks every attached security group that affects the web ports.
- It applies the change and reports the result accurately.
- The person can restore the original access, with confirmation.
- Undo still works after a restart.
- Unsupported and conflicting setups get a useful explanation.

Phase 2:

- A person can provide an Nginx access log.
- The summary uses the evidence in that sample.
- Probing is distinguished from a demonstrated success.
- CloudPilot can offer the confirmed Phase 1 restriction.

---

## What to report when a phase is built

- What changed
- The files that were modified
- The AWS permissions required
- What was verified
- Supported and unsupported cases
- How to try it in the CloudPilot UI
- Any deploy or configuration step still left
