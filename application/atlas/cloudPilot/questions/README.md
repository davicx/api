# `cloudPilot/questions/` — Question fulfillment (product pillar)

**KEEP this folder.** It is the CloudPilot home for answering **Questions** with known / retrieved truth — not for classifying them (that is Intelligence).

## UNDERSTANDING — LOCKED

```text
Action
→ I want CloudPilot to DO something.

Value
→ I'm TELLING CloudPilot something.

Question
→ I want CloudPilot to TELL ME something it knows or can retrieve.

Conversation
→ I want to TALK.
```

These four are **Understanding** concepts (`understandMessage`).  
Do **not** confuse Understanding **Conversation** (“I want to talk”) with Turn **Conversation** (message history).

## Question types (subtypes — not renames of Question)

**Organizational Knowledge Questions are a type of Question, not a replacement name for Question itself.**

```text
Question
├── Organizational Knowledge Question
│   → "Which S3 bucket stores user uploads?"
│
├── CloudPilot State Question
│   → "What open requests do I have?"
│
├── AWS State Question
│   → "What EC2 instances do I have?"
│
└── Usage Question
    → "How much have I spent on AI?"
```

| Type | Classify (Intelligence) | Fulfill (CloudPilot) |
|------|-------------------------|----------------------|
| CloudPilot State | `search/questions/searchForOpenRequests` | **`questions/openRequests.js`** |
| Usage | `search/questions/searchForAiSpend` | scans / `show_ai_usage` |
| AWS State | `search/questions/*Inventory` | `scan_ec2` / `scan_s3` |
| Organizational Knowledge | org-knowledge search | `knowledge/` + grounded Message Reply |

Question answers must **never** invent via `generateGeneralMessageReply()`.

## Today in this folder

- `openRequests.js` — CloudPilot State Question Message Reply (`buildOpenRequestsResponse`)

Grow other Question fulfillment helpers here when they need a dedicated speak builder. Classification stays under `cloudPilotIntelligence/understand/search/questions/`.

**Closed:** folder ownership — keep this pillar ([follow-ups](../../doc/development/future/feature_message_reply_followups.md) #3).

**Related:** [Questions feature](../../doc/development/finished/feature_questions.md) · [Message Reply Follow-ups](../../doc/development/future/feature_message_reply_followups.md) · [CloudPilot Turn](../../doc/development/how_to/cloud_pilot_turn.md)
