# Adding Services — connect an AWS account

## What this is

A person who just created an AWS account should not have to invent IAM policies, roles, and access keys before CloudPilot can see it.

They open CloudPilot, choose EC2 and S3, choose how much CloudPilot may do, and approve a CloudFormation stack in their own account. CloudPilot then assumes a role. Scans and fixes they already have keep working. They receive an authorized client for that account instead of a single machine profile.

**Status:** Plan. Do not implement from this file until a step is chosen.  
**Codename:** `feature_adding_services`  
**Related:** [Useful Costs](./feature_useful_costs.md) · [Mock AWS](./feature_mock_aws.md)

This is one of the product’s main doors. Connections is setup. Chat explains the setup and, later, can start the same wizard. Dashboard stays a view of resources and findings, not a second place to grant access.

---

## Feeling we want

> Someone connects the AWS account they are standing up — including the account that will run CloudPilot’s own API — and the next sentence is “scan this account and tell me if anything looks wrong.”

---

## What exists today

| Piece | Today |
|-------|--------|
| `/connections` | Design mock. Hardcoded “Connected · Account 631447262459”. Manage opens a dialog that says the real flow is not built. OpenAI, Gmail, Jira, Slack, Azure, and Team are the same mock |
| Atlas credentials | One boto3 **named profile** from config (`PROFILE`). `create_session(profile, region)` builds EC2, S3, CloudWatch, RDS, and STS clients |
| Scans and writes | EC2 and S3 scanners and operations call that profile directly. There is no account id, role ARN, or connection id |
| Chat | Understand → decide → fulfill, with confirmation before changes. No “connect an account” capability |
| Services that work | EC2 and S3 inventory, scan, and a small set of confirmed writes (pause/resume, create, tags, S3 versioning, and similar) |

There is no stored AWS connection. “Connected” on the page is not a role CloudPilot can assume.

---

## Two doors, one wizard

Connections and Chat do different jobs. They do not each grow an onboarding system.

```text
                 CLOUDPILOT
                     │
          ┌──────────┴──────────┐
          │                     │
     Connections              Chat
     setup and config         explain, then start
          │                     │
          └──────────┬──────────┘
                     │
              AWS Connection
                  Wizard
                     │
                AWS Account
```

| Surface | Job |
|---------|-----|
| **Connections** | What accounts and services can CloudPilot access? Add, view, test, disconnect |
| **Dashboard** | What resources, findings, and activity exist in those accounts? |
| **Chat** | What does the user want done? For MVP, chat does not run the wizard. Later, “connect my new AWS account” opens this same wizard |

MVP builds the wizard once and opens it from **Add AWS Account** on Connections. Chat is a later caller of that wizard, not a second implementation.

---

## The experience

### 1 — Connected accounts

The AWS block on Connections lists accounts, not a single fake row.

```text
Connected Services

AWS

Production AWS
Account: 123456789012
Status: Connected

Services: EC2, S3
Permissions: Read + Selected Actions

[ Manage ]

[ + Add AWS Account ]
```

The data model holds many accounts from the start (personal, development, production, a client). The first ship can be used with one account. The screen and the table are not shaped for “the” account.

Manage shows status, services, permission level, last test, and Disconnect. Disconnect in CloudPilot marks the row disconnected and stops using the role. It does **not** delete the IAM role in AWS unless a later cleanup is built. Say that on the screen.

OpenAI and the other mock tiles stay out of this feature.

### 2 — Choose services

Add AWS Account asks what CloudPilot may touch. The person is not granting the whole account.

```text
Which AWS services would you like CloudPilot to manage?

[x] EC2
    Virtual machines and compute resources

[x] S3
    Storage buckets and objects

[ ] RDS
    Managed databases
    Coming soon

[ ] Lambda
    Serverless functions
    Coming soon
```

MVP: only EC2 and S3 can be checked. RDS and Lambda are visible and disabled. At least one of EC2 or S3 must be selected.

### 3 — Choose permissions

Three levels. MVP ships the first two. The third is the advanced path later.

| Level | CloudPilot can | CloudPilot cannot |
|-------|----------------|-------------------|
| **Read only** (recommended) | Discover EC2 and S3. Scan configuration and security. Recommend changes | Modify resources |
| **Read + selected actions** | Read only, plus the operations CloudPilot already knows how to confirm: start/stop, create EC2, update EC2 tags, supported S3 fixes | Act as an account administrator. Run actions that are not in the product |
| **Custom** (later) | An IAM policy the account owner supplies | — |

Read + selected actions is the write option. It is not `AdministratorAccess`. The IAM policy lists the API actions behind today’s confirmations, plus the read actions for inventory and scan. New product actions mean a new template version, not a quiet widening of the role.

Chat confirmation still runs before a write. The role is the ceiling. Confirmation is the second gate.

### 4 — Connect with CloudFormation

Do not ask for access keys.

```text
USER AWS ACCOUNT
    IAM role
        trust: CloudPilot account only
        external id: unique per connection
        permissions: the template for the chosen services and level
            │
            │  STS AssumeRole (temporary credentials)
            ▼
CLOUDPILOT
    EC2 inventory / scan
    S3 inventory / scan
    authorized remediation
```

**Connect with CloudFormation** is the MVP path.

1. User clicks Connect.
2. CloudPilot creates a pending connection: name, chosen services, permission level, a new external id, and the CloudFormation launch URL.
3. The user signs in to AWS. The console shows the role and the policy that will be created.
4. They approve the stack.
5. They return with the role ARN (stack output, or a paste field if the callback is not ready).
6. CloudPilot calls STS `AssumeRole` with that ARN and the external id, then `GetCallerIdentity`. Success marks the connection `connected` and stores the account id from the caller identity.

Security bar for the template:

- Trust policy allows only CloudPilot’s account.
- `sts:ExternalId` must match the id stored for this connection. A new id per connection. Never one global id.
- Policy is least privilege for the selected services and level. Read only omits mutating actions.
- No long-lived keys in CloudPilot’s database. Store role ARN, external id (protected), account id, services, level, status. AssumeRole at use time.

A manual “paste a role ARN” path can exist for the person debugging the template. It is not the recommended button.

### 5 — You are connected

```text
AWS account connected

Development AWS
Region for EC2: us-west-2

Services: EC2, S3
Permissions: Read only

[ Scan my AWS account ]
[ View resources ]
[ Open chat ]
```

Scan uses the scans that already exist, aimed at this connection. View resources opens the dashboard for this account. Open chat does not connect anything. It is the place to say “scan my new account and tell me if anything looks wrong.”

EC2 work is regional. S3 bucket discovery is account-wide. The connection is account access. The region on the connection is the default region for EC2 operations, not a limit on which buckets exist. An EC2 scan still takes a region. An S3 scan does not pretend the bucket list is only `us-west-2`.

---

## Backend

One concept: an **AWS connection**. One row is one account.

```json
{
  "id": 1,
  "name": "Production AWS",
  "accountId": "123456789012",
  "roleArn": "arn:aws:iam::123456789012:role/CloudPilotRole",
  "externalId": "stored-protected",
  "defaultRegion": "us-west-2",
  "services": ["ec2", "s3"],
  "permissionLevel": "read_write",
  "status": "connected"
}
```

`read_write` in storage means **Read + selected actions**, not admin.

Fulfillment stays the pipeline you have. The new step is “which connection, then which client.”

```text
"Scan EC2 in my production account"
    UNDERSTAND
    DECIDE
    find AWS connection
    AssumeRole
    FULFILL  — existing EC2 scan
    RESPOND
```

Scan and remediation code should not know about CloudFormation or the Connections page. They should receive clients already built for the selected account (the same shape `create_session` returns today). A small session helper assumes the role, or in local dev keeps using the named profile when no connection id is passed.

Until Connections is real, the current `PROFILE` path can remain the default so today’s scans do not break. A request that names an account uses that connection. A request that names none uses the default connection once one exists, and until then the profile.

Guard writes with both checks:

- Connection `permissionLevel` is read + selected actions.
- The action is one CloudPilot already confirms.

A read-only connection never receives a write, even if chat tries to confirm one.

---

## What to build

| Feature | MVP | Later |
|---------|-----|-------|
| Add AWS account | Yes | |
| Many accounts in the model and on the page | Yes | |
| Select EC2 and S3; RDS and Lambda shown as coming soon | Yes | |
| Read only | Yes | |
| Read + selected actions | Yes | |
| Custom IAM | | Yes |
| CloudFormation connect | Yes | |
| Test connection (`AssumeRole` + caller identity) | Yes | |
| List connected accounts | Yes | |
| Disconnect in CloudPilot, without deleting the AWS role | Yes | |
| Role cleanup in AWS on disconnect | | Yes |
| Start the wizard from Chat | | Yes |
| Change services or permission level after connect | | Yes |
| More AWS services actually enabled | | Yes |
| Guided troubleshooting when the stack fails | | Yes |
| Counts and findings on the Connections cards | | Yes |

The later Connections page can become a control center: each account with instance count, bucket count, and finding count, plus a way into chat. That is Dashboard data shown on Connections. Do not merge the two pages. Connections answers “what can we access?” Dashboard answers “what is in there?”

---

## Locked decisions

| Topic | Decision |
|-------|----------|
| Who configures access | Connections page |
| Who explains it | Chat. Wizard-from-chat is later, same wizard |
| Accounts | Many from the first schema. Using one is fine |
| Services in MVP | EC2 and S3 only. Others visible, not selectable |
| Keys | No access keys collected or stored |
| How we get in | IAM role, STS `AssumeRole`, external id per connection |
| How the role is created | CloudFormation launch is the recommended path |
| Write scope | Only APIs CloudPilot already performs, still behind confirmation |
| What code receives | An authorized client for that account, not the connection form |
| Region | Default region for EC2. S3 discovery stays account-wide |
| Disconnect | Stops CloudPilot using the role. Does not remove the role in AWS |
| Other Connections tiles | Unchanged mocks. This feature is AWS accounts |

---

## Steps

### Step 1 — Connection record

- Table and API for the JSON above.
- External id generated per row and stored protected.
- Status: `pending`, `connected`, `disconnected`, `error`.
- List and disconnect. Disconnect does not call AWS to delete the stack.

### Step 2 — Wizard UI

- Add account → services (EC2/S3 only) → permission level (read only, or read + selected actions) → CloudFormation handoff → paste or return role ARN → test.
- Success screen with Scan, View resources, Open chat.
- Connections list replaces the hardcoded AWS row for real accounts. The design-mock dialog for AWS goes away.

### Step 3 — AssumeRole session

- Helper: connection id + region → temporary clients in today’s session shape.
- EC2 and S3 scan and the existing write operations take that client when a connection id is present.
- Profile fallback remains for local dev with no connection.

### Step 4 — CloudFormation template

- One template parameterized by services, permission level, CloudPilot account id, and external id.
- Read only vs selected actions are two policy documents, not a broad admin policy.
- Document the trust policy and the stack outputs (role ARN, account id).

### Step 5 — Acceptance

| Check | Expected |
|-------|----------|
| Add account | Pending row, unique external id, no access key stored |
| EC2 + S3 only | RDS and Lambda cannot be selected |
| CloudFormation | User can see the role and policy before they approve |
| Test | `AssumeRole` with external id succeeds, account id saved, status connected |
| Wrong external id | AssumeRole fails, status error, no scan |
| Read only | Scan runs. A write is refused before confirm |
| Read + selected actions | An existing confirmed action runs with the assumed role |
| Second account | Both listed. A named account is the one assumed |
| Disconnect | CloudPilot stops using it. The role still exists in AWS until the user deletes the stack |
| Existing profile dev | Scans still run when no connection is selected |

---

## Out of scope

- Collecting or storing AWS access keys
- Administrator or power-user policies
- Chat-driven onboarding (same wizard, later)
- Editing services or permission level on a live connection
- Deleting the CloudFormation stack from Disconnect
- Enabling RDS, Lambda, or the other Connections tiles
- Putting finding counts on the account cards
- Replacing confirmation with “the role allows it”
