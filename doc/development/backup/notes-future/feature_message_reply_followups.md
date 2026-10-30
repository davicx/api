# Message Reply Follow-ups — After Important Fixes

## What this is

Intentional leftovers from [Important Fixes](../finished/feature_important_fixes.md).

That feature shipped **naming clarity + mental model cleanup**. These items are **not** unfinished naming. They are separate architectural or organizational decisions. Do not reopen Important Fixes to do them.

**Status:** Future — **open:** #1 provider architecture · #4 responsibility leaks  
**Closed:** #2 general rename · #3 `questions/` pillar + Understanding vocabulary  
**Codename:** `feature_message_reply_followups`  
**Came from:** Closing [Important Fixes](../finished/feature_important_fixes.md) (2026-08-16)  
**Related:** [CloudPilot Turn](../how_to/cloud_pilot_turn.md) · [Intelligence Provider](../finished/feature_intelligence_provider.md) · [Questions](../finished/feature_questions.md) · [`questions/README.md`](../../../cloudPilot/questions/README.md)

---

## Why they were split out

| Leftover | What it really is | Status |
| -------- | ----------------- | ------ |
| Internal AI no-op for Request Message Reply | **Provider architecture follow-up** | Open |
| Two responsibility leaks | **Real logic-move refactors** | Open |
| `generateGeneralReply()` → `generateGeneralMessageReply()` | Tiny vocabulary cleanup | **Closed** |
| `questions/` folder + Understanding lock | Folder / product-boundary | **Closed** |

---

## Open follow-ups

### 1. Move deterministic Request Message Reply behind Internal AI

**Kind:** Provider architecture

**Today**

```text
getRequestMessageReply()          → deterministic text (templates)
prepareRequestMessageReply()      → holds that text
generateRequestMessageReply()
    Internal → { success: false, message: '' }   # no-op
    OpenAI   → reword or fail
caller keeps template text when Internal / OpenAI fails
```

**Target**

```text
getRequestMessageReplyContext()
    ↓
generateRequestMessageReply()
   ┌────┴────┐
Internal   OpenAI
   │          │
   └────┬─────┘
        ↓
 SAME shape: success + Message Reply text
```

Internal AI should return `success: true` + deterministic Message Reply. OpenAI returns reworded text (or falls back to Internal result). Caller should not keep a side copy of “template vs AI.”

**Touches:** `generateRequestMessageReply.js`, `CloudPilotMessage.prepareRequestMessageReply`, possibly where `getRequestMessageReply()` lives relative to Intelligence.

**Not:** A rename-only change.

---

### 4. Fix two responsibility leaks

**Kind:** Logic-move refactors (not renames)

| Leak | Where | What happens | Why wrong |
| ---- | ----- | ------------ | --------- |
| A | `generateGeneralMessageReply.js` | Org-knowledge search + DB resolve + Internal org Message Reply | Org Knowledge **Question** work inside General Message Reply |
| B | `getRequestMessageReply()` in `requestTemplates.js` | `execution_requested` → `AtlasExecution.startNewAtlasExecution(payload)` | Starts execution inside a Message Reply builder |

Leak A is the main **Question-related** misplacement today (see placement note below). Fixing these means moving logic to the right Turn stage — separate small features, not naming.

---

## Closed (do not reopen)

### 2. `generateGeneralReply()` → `generateGeneralMessageReply()` — closed 2026-08-16

File: `cloudPilotIntelligence/conversation/generateGeneralMessageReply.js`

### 3. `cloudPilot/questions/` ownership + Understanding — closed 2026-08-16

**Decision:** Keep `questions/` as the Question fulfillment pillar. Do not nest under `chat/` / `requests/`.

**UNDERSTANDING — LOCKED** (canonical copies: `understandMessage.js`, Turn how-to, `questions/README.md`):

```text
Action        → I want CloudPilot to DO something.
Value         → I'm TELLING CloudPilot something.
Question      → I want CloudPilot to TELL ME something it knows or can retrieve.
Conversation  → I want to TALK.
```

Understanding Conversation ≠ Turn Conversation (history).

**Question types** — Organizational Knowledge is a **type of Question**, not a rename of Question:

```text
Question
├── Organizational Knowledge Question
├── CloudPilot State Question      ← questions/openRequests.js
├── AWS State Question             ← scans
└── Usage Question                 ← scans/aiUsage
```

---

## Question placement note (audit — no code change)

| Layer | Where it lives | OK? |
|-------|----------------|-----|
| Classify | Intelligence `understand/search/questions/` | Yes |
| Route | `decideNextStep.resolveQuestionDecision` | Yes (Handle Request) |
| CloudPilot State speak | `questions/openRequests.js` | Yes |
| Glue | `RequestConversation` → `prepareKnownMessageReply` | Yes |
| Usage speak | `scans/aiUsage/` | Intentional (not under `questions/` yet) |
| AWS State | `scan_ec2` / `scan_s3` | Intentional |
| Org Knowledge **data** | `knowledge/` | Yes |
| Org Knowledge **Question path** | Still inside `generateGeneralMessageReply.js` | **Misplaced** → open leak #4A |

Not a `questions/` ownership problem — ownership is closed. Leak #4A is the remaining Question-shaped cleanup.

---

## Do not

- Reopen Important Fixes or closed #2 / #3 for these
- Bundle remaining items into one mega-refactor

## Suggested order

1. **#1** when Request Message Reply should match Internal \| OpenAI  
2. **#4** (A and/or B) when ready for real logic moves
