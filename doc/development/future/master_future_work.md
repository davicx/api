# Future work

CloudPilot plans, in the order to pick them up. Nothing here is current work. Pull one section into `current/` when you want to build it.

The old notes are in `api/doc/development/backup/`. This file is the map. Those files are the full writeups.

---

# First part

## See who can reach it

Look at a computer and a file bucket and say, in plain words, who is allowed in. Do not change anything.

## Let only me in, then put it back

Close the door of the live app so only one address can open it. Remember the old door, and put that door back when asked.

## Close one unsafe bucket hole

If strangers can add or delete files in a bucket, fix that one hole after someone says yes. Leave pictures that are supposed to be readable alone.

## Read a traffic log

Someone hands over a list of visits. Say what happened in that list. A weird request is not proof that someone got in.

## Show the real bill, then a guess beside one thing

First, show what Amazon actually charged. Later, show a separate guess for one computer or one bucket, and label it as a guess.

## Let someone connect their own Amazon account

Another person can let CloudPilot look at their account without pasting secret keys. Looking comes before changing.

## Remember what changed

One bucket or one computer gets a story of how its settings changed. Reading that story comes before any promise to put an old setting back.

## Talk more clearly

A question, a list of what exists, and a security check stay three different jobs. Follow-up questions stay in the same conversation.

## A practice set that remembers

The fake Amazon used for tests remembers a pause or a setting change, and can be put back to a known start.

## Each page has one job

The home page is a steady overview. The cloud page is where you browse. Findings are the problems. Recents are what you did.

## Come back later

Work someone chose not to run yet can be found again, reviewed, and then run.

## More ways to make a change

Some changes can be explained, typed as commands, or opened as a pull request. That uses the same confirm-then-run path.

## Look at more Amazon services

After computers and buckets are useful, look at databases, permissions, and small functions. Looking comes before fixing.

## Other apps

Slack, Jira, and the rest wait until a real person has a real reason.

## Tidy the code when it gets in the way

Clean a folder or remove a duplicate only when the feature being built needs it.

---

# Second part

## See who can reach it

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

## Let only me in, then put it back

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

## Close one unsafe bucket hole

After inspection works, fix one clearly detected anonymous-write case. Versioning stays a separate recovery feature.

Source: `feature_aws_traffic.md`, `feature_s3_versioning_remediation.md`, `feature_s3_remediation_modes.md`.

- [ ] Use the existing preview, confirmation, run, check, and history flow.
- [ ] Show the exact policy, access list, or public-access setting that will change.
- [ ] Stop when more than one change could be the right one.
- [ ] Do not turn off a public read that Kite still needs. Confirm how images are delivered first.
- [ ] Check whether enabling versioning is already finished. Finish that plan if a piece is missing. Do not rebuild it.
- [ ] Say that versioning can increase storage cost, and that suspending it does not return a bucket to never-enabled.
- [ ] Done when one supported exposure can be fixed and checked without breaking intended access.

## Read a traffic log

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

## Show the real bill, then a guess beside one thing

These stay two features. The bill is what Amazon charged. The guess is a rate times a quantity.

Sources: `feature_first_useful_aws_costs.md`, `feature_useful_costs.md`, `billing.md`, `feature_understand_costs.md`, `feature_spending_hard_limit.md`.

- [ ] Connect the Costs page to the billing path chat already uses.
- [ ] Keep daily rows, page through long results, and use the same UTC 30-day window as chat.
- [ ] Remove the design-mock numbers from that page.
- [ ] Show existing EC2 compute guesses beside a resource, labeled as guesses.
- [ ] Add an S3 storage guess only when the size and a supported rate both exist.
- [ ] Say what is left out of a guess.
- [ ] A central gate on OpenAI spending can be its own small task.
- [ ] A combined Amazon and OpenAI view comes after both numbers are real.
- [ ] A check before an Amazon write comes after the cost numbers are trustworthy. It cannot promise a hard cap on the Amazon bill.
- [ ] Comparisons, forecasts, and alerts come later.
- [ ] Done when the real account bill is on the page, and each per-resource number is clearly a guess or clearly absent.

## Let someone connect their own Amazon account

Start read-only. Scans and fixes today use one named profile.

Source: `feature_adding_services.md`.

- [ ] Save a connection record.
- [ ] Hand the person a CloudFormation role to approve in their own account.
- [ ] Test the connection with AssumeRole.
- [ ] EC2 and S3 first, read-only.
- [ ] Scope scans, findings, requests, and history to that account.
- [ ] Add selected write permissions after read-only works.
- [ ] Support disconnecting.
- [ ] Move this up only when someone is ready to try their own account.
- [ ] Done when a second account can be scanned without using the machine profile.

## Remember what changed

Read-only first. One timeline per resource. Recents stays the list of what you did.

Source: `feature_history.md`.

- [ ] Build the timeline from saved scans and existing action history.
- [ ] Save a supported snapshot of configuration.
- [ ] Add a version only when the configuration changed.
- [ ] Compare two versions.
- [ ] A change found on a later scan is marked as detected. Do not guess who made it.
- [ ] Restoring an old setting is a later feature, and only for settings CloudPilot knows how to write.
- [ ] Done when one bucket or instance has a readable timeline.

## Talk more clearly

Fix the blocker in front of the feature being built. Leave a full chat redesign for later.

Sources: `feature_better_chat.md`, `feature_conversation.md`, `feature_chat_guardrails.md`, `feature_message_reply_followups.md`, `make_scans_useful.md`.

- [ ] Answer a follow-up inside an open request.
- [ ] Ask when a region or a resource is ambiguous. Do not pick the first one.
- [ ] “What is this service?” explains. “Do I have it?” inspects. “Turn it on” previews and waits.
- [ ] Explain a finding with the evidence, the impact, and the next step.
- [ ] Use plain labels in chat.
- [ ] Filter findings by security, cost, reliability, and configuration.
- [ ] Support a question about one named resource.

## A practice set that remembers

Extend the mock store that already exists. Do not build a fake Amazon.

Source: `feature_mock_aws.md`.

- [ ] Remember mock EC2 and S3 changes.
- [ ] Inventory and scans read that remembered state.
- [ ] Support the actions a demo needs, including pause and a setting change.
- [ ] Add a reset to a known start.
- [ ] Store only the fields CloudPilot already uses.

## Each page has one job

Do not rebuild navigation while the security work is the priority.

Source: `feature_core_organization_ideas.md`.

- [ ] Dashboard opens the same overview every time.
- [ ] Cloud is where you browse infrastructure.
- [ ] Findings lists problems across resources.
- [ ] Recents lists activity.
- [ ] Sidebar recents match the Recents page.
- [ ] A project has one main chat.
- [ ] More chats wait until one chat is not enough.

## Come back later

Build this when someone is actually leaving work unfinished.

Sources: `to_do.md`, `current_development.md`.

- [ ] Show open requests in chat.
- [ ] Show them on the dashboard.
- [ ] Save an action for later.
- [ ] Resume it through review, confirm, and run.
- [ ] Add a To Do list only when it is not a second Findings page.
- [ ] Several open requests at once can wait.

## More ways to make a change

One execution path. More ways to deliver a change that was already confirmed.

Sources: `feature_github_pull_requests.md`, `remediations.md`, `feature_s3_remediation_modes.md`.

- [ ] Run the existing GitHub pull-request path from end to end and write down what is still missing.
- [ ] Check the S3 versioning change the same way.
- [ ] Add instructions and a command-line writeup for a selected S3 fix.
- [ ] Add pull-request delivery for a supported change.
- [ ] Merging a pull request to apply it, and reverting it, come later.

## Look at more Amazon services

Attached security groups belong to “See who can reach it,” not to this section.

Sources: `future_services.md`, `scans.md`.

- [ ] RDS inspection.
- [ ] IAM inspection.
- [ ] Security groups that are not hanging off an instance.
- [ ] Lambda inspection.
- [ ] One scan that can cover more than one service.
- [ ] A fix for a new service waits until the inspection is useful.

## Other apps

Build one when a person has a workflow for it.

Source: `future_services.md`.

- [ ] Slack.
- [ ] Jira.
- [ ] Deeper GitHub than the pull-request path above.
- [ ] Datadog and PagerDuty.
- [ ] Confluence and Splunk.
- [ ] Teams, ServiceNow, and HCP Terraform.

## Tidy the code when it gets in the way

Do this only for the feature in front of you.

Sources: `step_one_cleanup.md`, `capability_migration.md`, `single_capabiity_change.md`, `feature_code_reorganize.md`, `feature_clean_cloudpilot_folder.md`, `feature_clean_cloudpilotintelligence_folder.md`, `feature_cloud_pilot_safety.md`, `mvp.md`.

- [ ] Remove a placeholder or a duplicate path that the active change is touching.
- [ ] Finish a capability move only when the active change needs that entry point.
- [ ] Simplify orchestration that the active change has to edit.
- [ ] Move folders only when the working code is hard to find.
