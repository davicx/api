# CloudPilot — Core Organization Ideas

## What this is

An information-architecture note. The individual pages are fine. **Dashboard, Recents, Cloud, and Findings are starting to overlap**, and this is a way to give each one a job.

**Status:** Ideas only. Not ready to change the product.  
**Codename:** `feature_core_organization_ideas`  
**Do not implement from this file yet.**

---

## Feeling we want

Each layer has one question it answers. Chat can still jump straight to a resource. The Dashboard menu item is a stable overview, not “wherever I was last.”

---

## 1. Clicking Dashboard

Today:

> **Dashboard → last scan / whatever resource I was viewing**

A menu item called **Dashboard** should be a stable destination. If it opens S3 today and an EC2 instance tomorrow because that was the last thing touched, Dashboard feels unpredictable.

**Dashboard is not Recents.** Recents already has its own page.

```text
DASHBOARD
What's happening right now?

Needs attention
2 high-priority findings

AWS
3 EC2 instances
5 S3 buckets

Costs
$42.18 this month

Recent
S3 scan · 5 findings          20 min ago
EC2 scan · 2 findings         Yesterday
```

**Dashboard is the stable overview / home base.**

```text
RECENTS
What have I been doing?

Sep 27   Scanned sam-youtube-demo
Sep 27   Enabled versioning
Sep 26   Scanned EC2
Sep 25   Created EC2 instance
...
```

Opening a specific resource stays. It happens when something is explicitly selected.

If the user says in Chat:

> "Show me my S3 buckets"

CloudPilot opens:

`Dashboard → S3 → Buckets`

If they click a bucket:

`Dashboard → S3 → sam-youtube-demo`

If Chat says:

> "That EC2 instance has two findings"

and the user clicks it:

`Dashboard → EC2 → cloudpilot-demo`

**Chat takes you directly to context. Clicking Dashboard takes you to the overview.**

---

## 2. Chat | Cloud | Findings

Keep the top bar. Those three are not arbitrary pages. They are the three primary ways of looking at CloudPilot.

```text
CHAT        CLOUD        FINDINGS
Ask         Explore      Act
```

### Chat

The conversational interface to everything.

```text
Chat

"What's costing me the most?"
"Scan S3."
"Why does this bucket exist?"
"Who owns wishlist-api?"
"Pause cloudpilot-demo."
```

### Cloud

**Cloud is the infrastructure explorer.**

```text
Cloud

AWS

EC2
3 instances

S3
5 buckets


EC2 INSTANCES

cloudpilot-demo        us-west-2     running
wishlist-api           us-west-2     running
kite-demo              us-east-1     stopped


S3 BUCKETS

wishlist-images        us-west-2
cloudpilot-data        us-west-2
...
```

Everything under a resource hangs off Cloud:

```text
Cloud
 │
 ├── AWS
 │    │
 │    ├── EC2
 │    │    └── cloudpilot-demo
 │    │         ├── Findings
 │    │         ├── About / Story
 │    │         ├── Costs
 │    │         └── History
 │    │
 │    └── S3
 │         └── sam-youtube-demo
 │              ├── Findings
 │              ├── About / Story
 │              ├── Costs
 │              └── History
 │
 └── eventually Azure / GCP / etc.
```

**Cloud is not Dashboard.**

Dashboard says **"Here's what matters."**

Cloud says **"Let me browse my infrastructure."**

### Findings

The third perspective: **show problems regardless of where they live.**

```text
Findings

12 open findings

HIGH

Encryption is off
sam-youtube-demo · S3

Public IP attached
cloudpilot-demo · EC2


MEDIUM

Versioning is off
sam-youtube-demo · S3

Instance is underutilized
cloudpilot-demo · EC2
```

Click one and you travel into that resource or finding.

**Cloud:** start with infrastructure, then discover its findings.

**Findings:** start with a problem, then discover the affected infrastructure.

---

## Two navigation layers

### Global product modes — top header

```text
CloudPilot       Chat     Cloud     Findings
```

Available everywhere:

**Chat** — talk to your infrastructure  
**Cloud** — browse your infrastructure  
**Findings** — see what needs attention

### Workspace — left sidebar

```text
MAIN

⌂  Home
▣  Dashboard
＋  New Chat
↶  Recents
☑  To Do
◎  Team
⬡  Connections


PROJECTS

Wishlist
Kite
CloudPilot


RECENT

S3 scan
cloudpilot-demo
Create EC2 instance
```

These answer a different set of questions:

**Dashboard** — What's happening?  
**Recents** — What was I doing?  
**To Do** — What do I need to do?  
**Team** — Who am I working with?  
**Connections** — What is CloudPilot connected to?

**Projects** scope that world.

---

## Home vs Dashboard

Home and Dashboard may eventually be redundant. The overview described above is what would naturally be called the CloudPilot home:

```text
Good morning, David

Needs attention
2 high priority findings

Recent activity
...

Costs
...

Projects
...

CloudPilot insight
...
```

That is essentially a Dashboard.

Do not change this yet. If it becomes hard to explain Home and Dashboard in one sentence each, one of them does not need to exist.

A later sidebar might be:

```text
MAIN

▣  Home
＋  New Chat
↶  Recents
☑  To Do
◎  Team
⬡  Connections
```

where **Home is the dashboard**. Or keep the name **Dashboard** if that word fits CloudPilot better.

---

## Model to use when placing new features

```text
                     CLOUDPILOT

              CHAT    CLOUD    FINDINGS
               │       │          │
              Ask    Explore    Problems
                       │
                  Infrastructure
                       │
                 ┌─────┴─────┐
                 EC2         S3
                  │           │
              Resource     Resource
                  │
        ┌─────────┼──────────┐
      About     History     Costs
                  │
               Changes
```

```text
Dashboard = overview
Recents   = activity
To Do     = future work
Team      = people
```

Each recent design gets a distinct job instead of competing for the same space.

**Stop making the Dashboard menu remember the last resource.** Keep direct-to-resource behavior when the user explicitly opens something from Chat, Findings, Cloud, Recents, and similar places. The Dashboard menu item is the reliable way back to the overview.

---

## Notes on this model (2026-09-27)

The split is the right one. Dashboard answers what matters right now. Cloud is where you browse infrastructure. Findings starts from a problem. Recents is what you already did. To Do is work someone chose to come back to. Those are different questions, and the pages stop competing once each one owns only its question.

The decision worth keeping is the menu behavior. Clicking **Dashboard** always opens the overview. Chat, Cloud, Findings, and Recents still open a specific bucket or instance when the user picks one. Today the Dashboard menu does not actually reopen the last bucket or instance. That open resource is forgotten when you leave the page. What it does keep is the last scan, so Dashboard opens as the S3 list or the EC2 list depending on what ran most recently. That is already enough to make the menu feel unstable. An overview replaces that. The direct jump from Chat stays.

The top bar is the bigger structural change, and it is the right one. **Chat** and **Cloud** both go to `/chat` right now, and **Findings** opens the S3 findings mock. In this model, the page currently called Dashboard — the bucket list and the instance list — mostly becomes **Cloud**. Dashboard becomes the small overview above that: needs attention, a count of EC2 and S3, this month’s cost, and the latest scans. Per-resource findings stay on the resource. The Findings mode is the cross-resource list: encryption on one bucket and a public IP on an instance, in one place.

Two things are already overlapping more tightly than Home versus Dashboard.

**Home** and **New Chat** both open `/chat`. Home versus Dashboard is a later naming question. Home versus New Chat is the one that is true today. If Home eventually becomes the overview, New Chat can stay the way to start a conversation, and Dashboard as a second name can wait.

There are also two Recents. The **Recents** menu item is the mock activity page. Lower in the sidebar, **Recent** is the real list of completed scans. The note still shows both. The lower list works as a short preview of the Recents page — the last few scans — as long as it is the same activity, not a second history.

About, History, and Costs belong on the resource, which matches the **More Info** and **History** buttons. A cost number on the Dashboard overview is the summary. The Costs page is the detail. To Do stays separate from Findings: a finding is something CloudPilot discovered, and a to-do is something David, Sam, or CloudPilot put on a list.

---

## The project is the container (2026-09-27)

**New Chat** is probably the wrong concept. What you are actually creating is a **new Project**.

```text
CloudPilot
│
├── Project: Wishlist
│   ├── Chat: General
│   ├── Chat: AWS Deployment
│   ├── Chat: S3 Cleanup
│   ├── Chat: Production Issue
│   └── Scans / Findings / History
│
├── Project: Kite
│   ├── Chat: General
│   ├── Chat: Infrastructure
│   └── ...
│
└── Project: University of Hawaii
    ├── Chat: General
    └── ...
```

### MVP

Do not build multiple chats yet.

Treat the data model mentally as:

> **Project → one primary chat**

The sidebar action becomes:

**＋ New Project**

Clicking a project opens that project's existing chat.

That makes the current one-conversation setup feel intentional. It is the first version of the model, not a temporary limit.

Later a project can grow into:

```text
PROJECT
  ↓
Chats
Cloud
Findings
Recents
Connected Services
Team
```

**The chat is not CloudPilot's main container. The project is.**

A project can eventually hold AWS and Azure connections, repos, people, knowledge, scans, findings, actions, history, and multiple conversations. Chat is one way of interacting with everything that belongs to that project.

---

## Chat is the experience (2026-09-27)

**Project is the container. Chat is the experience.**

The user should not feel like they entered a project-management dashboard and then picked Chat as one tool among six. They should feel like they entered **CloudPilot**, where the primary thing they do is talk to it.

```text
PROJECT: Wishlist
│
├── ★ Chat              ← HOME / STAR
│
├── Cloud
├── Findings
├── Recents
│
├── Team
└── Connected Services
```

Later, with more than one conversation:

```text
PROJECT: Wishlist
│
├── Chats
│   ├── General             ← default
│   ├── AWS Deployment
│   ├── S3 Cleanup
│   └── Production Issue
│
├── Cloud
├── Findings
├── Recents
└── ...
```

Even with multiple chats, **the most recent or default chat opens immediately when the user enters the project.** They do not land on a project overview unless there is a strong reason.

The other pages support what happens in Chat.

CloudPilot says:

> I scanned your S3 buckets and found 6 things worth looking at.

The user can handle that in Chat. If they want all six in detail, they click **View findings** and move into the Findings UI.

Or:

> I paused `wishlist-worker-02`. Want me to show you what changed?

Chat does the work. **Recents** keeps the permanent record.

```text
Chat        = Do things
Cloud       = Understand things
Findings    = Investigate things
Recents     = Go back to things
Team / Connections = Configure things
```

Chat deserves the most product attention. The tables and dashboards can be excellent, and they are supporting cast.

CloudPilot is not a cloud dashboard with an AI chat attached. It is an **AI cloud teammate whose work has dashboards, history, findings, and controls attached to it.**
