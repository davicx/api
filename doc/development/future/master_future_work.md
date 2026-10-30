# Future work

CloudPilot plans, in the order to pick them up. Nothing here is current work. Pull one section into `current/` when you want to build it.

The old notes are in `api/doc/development/backup/`. This file is the map. Those files are the full writeups.

---

# First part

## AWS Security

### Inspect EC2 and S3 access

Explain who can reach an instance or access a bucket, using its actual configuration. Distinguish intentional public access from unsafe permissions. Do not change anything.

### Restrict app access and restore it

Limit the live app to an approved IP address after confirmation. Save the previous rules, verify the change, and support restoring those rules.

### Fix unsafe S3 access

Fix a supported case where strangers can upload, overwrite, or delete files, after confirmation. Preserve intentional public image access.

## Traffic and Logs

### Explain application traffic

Read a supplied traffic log and summarize visits, errors, and suspicious requests. Distinguish automated probing from evidence that someone got in.

## Cost Knowledge and Spending Controls

### Show the real AWS bill

Show actual account spending using the existing billing integration, with a clear date range and service breakdown.

### Estimate individual resource costs

Show a separate estimate beside an EC2 instance or S3 bucket. Explain what the estimate includes and leave unknown costs blank.

### Control CloudPilot spending

Add warnings and limits for OpenAI calls and supported AWS actions initiated through CloudPilot. Keep spending visibility available when new paid work is blocked.

## AWS Connections

### Connect another AWS account

Let someone connect their account through an IAM role without pasting access keys. Start with read-only access, then support selected confirmed actions.

## Resource History

### Record and compare changes

Give each instance or bucket a timeline of CloudPilot actions and configuration changes discovered during scans. Show saved versions and comparisons before adding broader restoration.

## Conversations and Findings

### Improve conversations

Keep questions, inventory requests, scans, and changes distinct. Answer follow-up questions without losing the open request.

### Make findings useful

Explain what was found, why it matters, and what a proposed fix would change. Ground recommendations in evidence and acknowledge intentional configurations.

## Testing and Demos

### Make the practice environment remember

Make mock AWS resources retain state after a pause or configuration change. Inventory and scans reflect those changes, with a reset to a known starting point.

## Projects and Navigation

### Give each page a clear purpose

Dashboard is the overview. Cloud is the resource explorer. Findings shows problems. Recents shows activity.

### Organize work into projects

Let a project hold its chat, connections, resources, findings, and history. Start with one primary chat per project.

## Saved Work

### Return to unfinished work

Save requests and proposed actions for later. Let someone find them, review current conditions, and confirm before running them.

## Changes and Execution Modes

### Offer more ways to apply a change

Support instructions, CLI commands, pull requests, and automatic execution for selected actions. Reuse the existing request flow and make clear whether CloudPilot has actually changed AWS.

## AWS Service Coverage

### Inspect more AWS services

Expand into RDS, IAM, broader security-group checks, and Lambda after EC2 and S3 are useful. Add inspection before remediation.

## External Integrations

### Connect tools people already use

Add Slack, Jira, GitHub, monitoring, and other integrations when a real user has a concrete workflow for them.

## Code Maintenance

### Simplify code when needed

Remove duplicates, confusing paths, and unused placeholders when they obstruct current work. Keep cleanup scoped to the feature being built.

---

# Second part

## AWS Security

### Inspect EC2 and S3 access

Read-only. Reuse the current EC2 scan, S3 scan, findings, and chat. Do not change Amazon. Do not add a new page.

Source: `feature_aws_traffic.md`, plus the rules already in `atlas/app/core/cloud/`.

- [ ] For each instance, list every attached security group. Permissions from those groups combine.
- [ ] Report inbound access to ports 22, 80, and 443 from the whole internet, both IPv4 and IPv6.
- [ ] Keep the existing public-address finding. Do not invent a second id for the same fact.
- [ ] For S3, separate a public read from anonymous upload, overwrite, or delete.
- [ ] A public read is context to review. It is not automatically a critical hole. Kite’s image bucket is private and uses signed links.
- [ ] If a fact cannot be seen, say unknown. Do not say a missing app setting is disabled.
- [ ] After the ports and bucket rules work, add load balancers, a direct path around a load balancer, whether a firewall is already attached, and whether logs exist.
- [ ] Done when you can ask how exposed the Kite API and its bucket are, and the answer cites the rules it saw.

### Restrict app access and restore it

First change CloudPilot is allowed to make for this app. Single-instance Beanstalk only. Do not wait for the full resource-history feature. Do not add a load balancer or a firewall to do this.

Source: `feature_live_aws.md`.

- [ ] The person types the public IPv4 address. Discover the environment and security group from Amazon. Do not hardcode an id.
- [ ] The first look treats the live rules as the baseline.
- [ ] Preview the exact rule change. Confirm before writing.
- [ ] Save the previous rules in the existing action history before the write.
- [ ] Apply, then read the live rules again and check they match the preview.
- [ ] If the live rules changed after the preview, stop.
- [ ] Refuse a shared group or any setup this step does not understand.
- [ ] Restore puts back the saved rules, and that still works after a restart.
- [ ] A phone that leaves the current network loses access. Say that in the preview.
- [ ] Done when CloudPilot can restrict the API and restore the saved rules accurately.

### Fix unsafe S3 access

After inspection works, fix one clearly detected anonymous-write case. Versioning stays a separate recovery feature.

Source: `feature_aws_traffic.md`, `feature_s3_versioning_remediation.md`, `feature_s3_remediation_modes.md`.

- [ ] Use the existing preview, confirmation, run, check, and history flow.
- [ ] Show the exact policy, access list, or public-access setting that will change.
- [ ] Stop when more than one change could be the right one.
- [ ] Do not turn off a public read that Kite still needs. Confirm how images are delivered first.
- [ ] Check whether enabling versioning is already finished. Finish that plan if a piece is missing. Do not rebuild it.
- [ ] Say that versioning can increase storage cost, and that suspending it does not return a bucket to never-enabled.
- [ ] Done when one supported exposure can be fixed and checked without breaking intended access.

## Traffic and Logs

### Explain application traffic

Explain a log someone already has. Do not invent counts.

Source: `feature_live_aws.md`, `feature_aws_traffic.md`.

- [ ] Accept an uploaded Nginx access log.
- [ ] Show the time span actually in the file, request counts, client addresses, response codes, and common paths.
- [ ] Handle broken lines.
- [ ] Repeated requests for paths the app does not have can be called automated probing.
- [ ] A 404 is not proof that someone broke in.
- [ ] If a log source is missing, say it is not monitored.
- [ ] Later: notice logs Amazon is already writing. Offer to turn logging on only as its own confirmed change.
- [ ] A firewall is only for an app that already has a supported front door.
- [ ] Done when a real log produces a summary that uses only that file.

## Cost Knowledge and Spending Controls

### Show the real AWS bill

The bill is what Amazon charged. It is not a price-list estimate.

Source: `feature_first_useful_aws_costs.md`, `billing.md`.

- [ ] Connect the Costs page to the billing path chat already uses.
- [ ] Keep daily rows, page through long results, and use the same UTC 30-day window as chat.
- [ ] Show totals by service.
- [ ] Remove the design-mock numbers from that page.
- [ ] Done when the real account bill is on the page for that date range.

### Estimate individual resource costs

A guess is a stored rate times a quantity. Leave it blank when an input is missing.

Source: `feature_useful_costs.md`, `feature_understand_costs.md`.

- [ ] Show existing EC2 compute guesses beside a resource, labeled as guesses.
- [ ] Add an S3 storage guess only when the size and a supported rate both exist.
- [ ] Say what the guess includes and what it leaves out.
- [ ] Comparisons, forecasts, and alerts come later.

### Control CloudPilot spending

Visibility stays available when a new paid action is blocked. A check before an Amazon write cannot promise a hard cap on the Amazon bill.

Source: `feature_spending_hard_limit.md`.

- [ ] A central gate on OpenAI spending can be its own small task.
- [ ] Show combined Amazon and OpenAI spending after both numbers are real.
- [ ] A check before a supported Amazon write comes after the cost numbers are trustworthy.

## AWS Connections

### Connect another AWS account

Start read-only. Scans and fixes today use one named profile.

Source: `feature_adding_services.md`.

- [ ] Save a connection record.
- [ ] Hand the person a CloudFormation role to approve in their own account.
- [ ] Test the connection with AssumeRole. Do not ask them to paste access keys.
- [ ] EC2 and S3 first, read-only.
- [ ] Scope scans, findings, requests, and history to that account.
- [ ] Add selected write permissions after read-only works. Each write still requires confirmation.
- [ ] Support disconnecting.
- [ ] Move this up only when someone is ready to try their own account.
- [ ] Done when a second account can be scanned without using the machine profile.

## Resource History

### Record and compare changes

Read-only first. One timeline per resource. Recents stays the list of what you did.

Source: `feature_history.md`.

- [ ] Build the timeline from saved scans and existing action history.
- [ ] Save a supported snapshot of configuration.
- [ ] Add a version only when the configuration changed.
- [ ] Compare two versions.
- [ ] A change found on a later scan is marked as detected. Do not guess who made it.
- [ ] Restoring an old setting is a later feature, and only for settings CloudPilot knows how to write.
- [ ] Done when one bucket or instance has a readable timeline and a comparison.

## Conversations and Findings

### Improve conversations

Fix the blocker in front of the feature being built. Leave a full chat redesign for later.

Sources: `feature_better_chat.md`, `feature_conversation.md`, `feature_chat_guardrails.md`, `feature_message_reply_followups.md`, `make_scans_useful.md`.

- [ ] Answer a follow-up inside an open request.
- [ ] Ask when a region or a resource is ambiguous. Do not pick the first one.
- [ ] “What is this service?” explains. “Do I have it?” inspects. “Turn it on” previews and waits.
- [ ] Use plain labels in chat.
- [ ] Support a question about one named resource.

### Make findings useful

- [ ] Explain a finding with the evidence, why it matters, and what a proposed fix would change.
- [ ] Say when a public setting looks intentional.
- [ ] Filter findings by security, cost, reliability, and configuration.

## Testing and Demos

### Make the practice environment remember

Extend the mock store that already exists. Do not build a fake Amazon.

Source: `feature_mock_aws.md`.

- [ ] Remember mock EC2 and S3 changes.
- [ ] Inventory and scans read that remembered state.
- [ ] Support the actions a demo needs, including pause and a setting change.
- [ ] Add a reset to a known start.
- [ ] Store only the fields CloudPilot already uses.

## Projects and Navigation

### Give each page a clear purpose

Do not rebuild navigation while security work is the priority.

Source: `feature_core_organization_ideas.md`.

- [ ] Dashboard opens the same overview every time.
- [ ] Cloud is where you browse infrastructure.
- [ ] Findings lists problems across resources.
- [ ] Recents lists activity.
- [ ] Sidebar recents match the Recents page.

### Organize work into projects

- [ ] A project holds its chat, connections, resources, findings, and history.
- [ ] Start with one main chat per project.
- [ ] More chats wait until one chat is not enough.

## Saved Work

### Return to unfinished work

Build this when someone is actually leaving work unfinished.

Sources: `to_do.md`, `current_development.md`.

- [ ] Show open requests in chat.
- [ ] Show them on the dashboard.
- [ ] Save a proposed action for later.
- [ ] Before running it, review the live conditions and confirm.
- [ ] Add a To Do list only when it is not a second Findings page.
- [ ] Several open requests at once can wait.

## Changes and Execution Modes

### Offer more ways to apply a change

One request flow. More ways to deliver a change that was already confirmed. The reply says whether Amazon was actually changed.

Sources: `feature_github_pull_requests.md`, `remediations.md`, `feature_s3_remediation_modes.md`.

- [ ] Run the existing GitHub pull-request path from end to end and write down what is still missing.
- [ ] Check the S3 versioning change the same way.
- [ ] Add instructions and a command-line writeup for a selected fix.
- [ ] Add pull-request delivery for a supported change.
- [ ] Automatic execution stays behind the existing confirmation.
- [ ] Merging a pull request to apply it, and reverting it, come later.

## AWS Service Coverage

### Inspect more AWS services

Attached security groups on an instance belong to Inspect EC2 and S3 access, not to this section.

Sources: `future_services.md`, `scans.md`.

- [ ] RDS inspection.
- [ ] IAM inspection.
- [ ] Security groups that are not attached to an instance.
- [ ] Lambda inspection.
- [ ] One scan that can cover more than one service.
- [ ] A fix for a new service waits until the inspection is useful.

## External Integrations

### Connect tools people already use

Build one when a person has a workflow for it.

Source: `future_services.md`.

- [ ] Slack.
- [ ] Jira.
- [ ] Deeper GitHub than the pull-request path above.
- [ ] Datadog and PagerDuty.
- [ ] Confluence and Splunk.
- [ ] Teams, ServiceNow, and HCP Terraform.

## Code Maintenance

### Simplify code when needed

Do this only for the feature in front of you.

Sources: `step_one_cleanup.md`, `capability_migration.md`, `single_capabiity_change.md`, `feature_code_reorganize.md`, `feature_clean_cloudpilot_folder.md`, `feature_clean_cloudpilotintelligence_folder.md`, `feature_cloud_pilot_safety.md`, `mvp.md`.

- [ ] Remove a placeholder or a duplicate path that the active change is touching.
- [ ] Finish a capability move only when the active change needs that entry point.
- [ ] Simplify orchestration that the active change has to edit.
- [ ] Move folders only when the working code is hard to find.
