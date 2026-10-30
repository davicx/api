# Security MVP

This is the next CloudPilot feature because Kite is a real app to practice on. You can see how it is exposed, close it while developing, and open it again when you need to.

Ask in the existing chat. Evidence stays in Findings. A change uses the existing preview, confirmation, and history. Do not add a security page, a security chat, or a second undo system.

Sources, left as they are: `backup/notes-current/feature_aws_traffic.md`, `backup/notes-current/feature_live_aws.md`, and the AWS Security section of `future/master_future_work.md`.

Build and use the first two capabilities before finishing the rest of this document. The second one needs the most care. A demo is easy. Trust comes from restoring the saved rules, noticing a conflicting edit, and checking every attached security group.

**First usable release:** Ask about Kite → inspect the real rules → restrict to your public IP → test from your computer and from cellular → restart CloudPilot → restore → verify the saved rules are back.

---

# Part 1

## 1. Inspect exposure

Read every security group attached to the instance. Show who is allowed on ports 22, 80, and 443. Separate a public bucket read from an anonymous write. Cite the rules you saw. Say when something could not be seen. Do not change Amazon.

## 2. Restrict Kite and restore access

Discover the Beanstalk environment. Preview the change, confirm it, save the previous rules in durable storage, apply them, and read them back. Restart CloudPilot and restore those saved rules.

## 3. Explain a supplied Nginx log

Next, after the first two are in use. Summarize only what is in the file the person provides.

## 4. Fix one anonymous bucket write

Later. Kite’s bucket is already private, so this does not solve the current problem. When it is built, fix one case where a stranger can upload, overwrite, or delete, and leave an intentional public read alone.

---

# Part 2

## 1. Inspect exposure

Read-only. Reuse the current EC2 scan, S3 scan, findings, and chat.

Today the EC2 scan notes a public address. It does not yet read security-group ports. The S3 scan already checks a public access block, a public access list, a public bucket policy, encryption, versioning, and access logging. There is no rule yet for ports 22, 80, or 443, a load balancer, WAF, or flow logs.

The last look at the Kite API, a single-instance Beanstalk app in `us-west-2`, found a security-group rule for HTTP on port 80 from `0.0.0.0/0`. There is no load balancer, so WAF has nothing to attach to. Saving a “My IP” replacement was not confirmed. Kite’s image bucket is private and uses signed links.

A public address plus an open security group means people can attempt a connection. Say that the rules allow the attempt. Say the instance was actually reached only after a request succeeds.

- [ ] For each instance, list every attached security group. Permissions from those groups combine.
- [ ] Show the sources allowed on ports 22, 80, and 443, including the whole internet, for both IPv4 and IPv6.
- [ ] Keep the existing public-address finding. Do not invent a second id for the same fact.
- [ ] For S3, separate a public read from anonymous upload, overwrite, or delete.
- [ ] A public read is context to review. It is a critical hole only when the settings show anonymous write.
- [ ] If a fact cannot be seen, say unknown. Do not say a missing app setting is disabled.
- [ ] For the bucket, limit the claim to the settings that were inspected.
- [ ] Record whether Nginx logs, load-balancer logs, flow logs, or a WAF web ACL already exist. Do not turn them on here.
- [ ] After the ports and bucket rules work, add load balancers, a direct path around a load balancer, whether a firewall is already attached, and whether logs exist.
- [ ] Done when you can ask how exposed the Kite API and its bucket are, and the answer cites the rules it saw.

Finding ids to add only when the scan can see them: `ec2_public_http`, `ec2_public_https`, `ec2_public_ssh`, `ec2_direct_access_beside_load_balancer`, `s3_public_write_access`, `alb_missing_waf`, `alb_access_logging_disabled`, `traffic_logging_unavailable`.

Already exist: `ec2_public_ip_attached`, `s3_public_access_block_disabled`, `s3_bucket_policy_public`, `s3_public_acl`, `s3_default_encryption_off`, `s3_versioning_disabled`, `s3_access_logging_disabled`.

Do not add `api_rate_limiting_disabled`. Express rate limiting is invisible to these AWS calls.

### Example

> **You:** How exposed is the Kite API and its bucket?
>
> **CloudPilot:** The security-group rules allow anyone on the internet to attempt HTTP access on port 80. The instance also has a public address. I have not confirmed that the full network path is open. Port 22 and port 443 are not open to the world in these rules. There is no load balancer in front of this API.
>
> In the settings I could inspect, I found no anonymous upload or delete permission. The image bucket blocks public access, and files are read with signed links.
>
> I have not changed anything.

## 2. Restrict Kite and restore access

This is the step to build carefully. Single-instance Beanstalk only. Discover the environment and security group from Amazon. Do not hardcode an id. Do not add a load balancer or a firewall to do this.

The person can ask to allow only their IP, to put access back, or to undo the last access change. “Back” means the rule from immediately before CloudPilot’s change. It is not permission to open other ports.

- [ ] The person types the public IPv4 address. Offer the address from `https://checkip.amazonaws.com` as the default when CloudPilot is running on their machine.
- [ ] Reject a private, loopback, link-local, or malformed address. Store a valid one as `/32`.
- [ ] If CloudPilot itself is running in AWS, that lookup is the server’s address. Do not treat it as the person’s IP.
- [ ] Preview the exact rule change. Confirm before writing. Name the environment, region, port, and address.
- [ ] Say that a phone on another network, including cellular, will lose access. The server keeps running and billing continues.
- [ ] Save the previous rules in the existing action history before the write. Do not keep the rollback only in memory.
- [ ] Add the chosen-IP rule, then remove the other reviewed web sources. Read the live rules again and check they match the preview.
- [ ] If the live rules changed after the preview, stop and preview again.
- [ ] Look at every attached group. A tight rule does nothing if another group still allows the internet.
- [ ] Include IPv6. Stop automatic execution for a shared group, a broad port range, all protocols, a prefix list, or a security-group source.
- [ ] Do not change outbound rules, RDS, SSH, or unrelated ports. If another public port such as 5000 is still open, say the HTTP limit can be bypassed.
- [ ] If the rule already matches, say “Already configured.” Do not write an Undo entry.
- [ ] Restart CloudPilot, then restore. The saved rules come back. If someone edited the rule after the change, show the conflict and preview again.
- [ ] A load-balanced or proxied environment is a different path. Do not apply this single-instance change there.
- [ ] Done when the first-release test passes: inspect Kite, restrict to your public IP, reach it from your computer, fail from cellular, restart CloudPilot, restore, and see the saved rules back.

A successful AWS read means the rules match the request. Ask the person to try the API from their computer, and to try again from cellular, where it should fail while the restriction is on.

### Example

> **You:** Only allow my IP.
>
> **CloudPilot:** I found one single-instance environment, Api-env. Your current public address looks like `203.0.113.25`. Use that, or type a different one.
>
> **You:** Use that.
>
> **CloudPilot:** Restrict HTTP on Api-env to `203.0.113.25/32`?
>
> This replaces the rule that allows anyone to attempt port 80. A phone on cellular, or any other network, will not be able to reach the API. The server keeps running.
>
> You can put the old rule back afterward.
>
> **You:** Yes.
>
> **CloudPilot:** HTTP is now limited to `203.0.113.25/32`. I read the security group again and it matches. Try the API from this computer. It should fail from cellular. Restore is available after a restart.

> **You:** Put access back.
>
> **CloudPilot:** Restore the previous HTTP rule, which allows port 80 from all IPv4 addresses?
>
> **You:** Yes.
>
> **CloudPilot:** The saved rule is back. Port 80 allows attempts from the internet again.

## 3. Explain a supplied Nginx log

Build this after the first two capabilities are in use. Explain a log someone already has. Do not invent counts. Nginx access logs on this Beanstalk app are the source that matches the API today.

Logs already seen contained automated probes (`/etc/passwd`, WordPress paths, and similar). A `400` or `404` on those paths is probing. A `200` on `/` with a short body is the normal greeting. Neither one is proof that someone got in.

- [ ] Accept an uploaded or pasted Nginx access log. Limit the size. Do not run commands from it, fetch its URLs, or copy tokens into the summary.
- [ ] Show the time span actually in the file, request counts, client addresses, response codes, and common paths.
- [ ] Handle broken lines and say how many were skipped.
- [ ] Repeated requests for paths the app does not have can be called automated probing.
- [ ] A 404 is not proof that someone broke in. An unknown status such as `498` needs the app’s own meaning.
- [ ] If a log source is missing, say it is not monitored.
- [ ] The log does not choose the environment. Offer the IP restriction only after the environment has been found on its own.
- [ ] Later: notice logs Amazon is already writing. Offer to turn logging on only as its own confirmed change, including retention and cost.
- [ ] A firewall is only for an app that already has a supported front door. Do not add one to finish this step.
- [ ] Done when a real log produces a summary that uses only that file.

### Example

> **You:** Are bots hitting the API? Here is the Nginx log.
>
> **CloudPilot:** This file covers 29 Oct, 22:40–23:15, and has 86 requests. One address asked for `/etc/passwd` and several WordPress paths. Those came back `400` or `404`. Requests to `/` came back `200` with the normal short greeting.
>
> That pattern looks like automated probing. This log does not show that anyone got in.
>
> The security-group rules still allow anyone to attempt HTTP. I can limit port 80 to your IP if you want.

## 4. Fix one anonymous bucket write

Keep this later. Kite’s bucket is already private, so it does not solve the immediate problem. Versioning stays a separate recovery feature.

- [ ] Use the existing preview, confirmation, run, check, and history flow.
- [ ] Show the exact policy, access list, or public-access setting that will change.
- [ ] Stop when more than one change could be the right one.
- [ ] Do not turn off a public read that the app still needs. Confirm how images are delivered first.
- [ ] Check whether enabling versioning is already finished. Finish that plan if a piece is missing. Do not rebuild it.
- [ ] Say that versioning can increase storage cost, and that suspending it does not return a bucket to never-enabled.
- [ ] Done when one supported exposure can be fixed and checked without breaking intended access.

## Leave these alone

- Navigation, chat routing, and the Findings page stay as they are.
- Cost Explorer, budgets, and Express rate limits stay in the cost plans.
- Do not create a load balancer or a web ACL as part of making this file true.
- The app printing access and refresh tokens in its logs is a separate task.
