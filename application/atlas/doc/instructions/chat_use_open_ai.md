# How to: Chat use OpenAI (`MESSAGE_RESPONSE`)

**Mimic Region Search exactly.**  
Reference implementation: `cloudPilot/conversation/understand/search/searchMessageForRegion.js`  
Chat target: `cloudPilot/conversation/CloudPilotMessage.js` → `speakGeneral`

**Related:** [sample_env.md](../sample_env.md) · [current_development.md](../development/current_development.md) · `config/cloudPilotAIConfig.js`

---

## Goal

Turn general chat replies on/off with OpenAI the same way Region Search works:

```text
Master OFF  → always internal (safe stub)
Feature OFF → internal
Master ON + feature openai → live OpenAI
```

| | **Region Search** (reference) | **Chat use OpenAI** (this guide) |
|--|-------------------------------|----------------------------------|
| Env feature | `CLOUDPILOT_REGION_SEARCH` | `CLOUDPILOT_MESSAGE_RESPONSE` |
| Env logs | `CLOUDPILOT_REGION_LOGS` | `CLOUDPILOT_MESSAGE_LOGS` |
| Env tokens | `CLOUDPILOT_REGION_TOKEN_LIMIT` | `CLOUDPILOT_MESSAGE_TOKEN_LIMIT` |
| When | STEP 3 understand | STEP 7 general speak |
| Gateway file | `searchMessageForRegion.js` | `CloudPilotMessage.speakGeneral` |
| Internal | Regex → `{ region }` or `{}` | Stub: `Open AI will respond when Live` |
| OpenAI | `createOpenAiChatCompletion` | `sendGeneralChat` |
| Public contract | `{ region }` or `{}` | `{ success, cloudPilotMessage, chatType, … }` |

Shared master: **`CLOUDPILOT_AI_ENABLED`** (OFF always wins).

---

## 1. Env (same shape as region)

In `api/.env`:

```env
# MASTER — OFF always wins
CLOUDPILOT_AI_ENABLED=false

# Feature: chat replies
CLOUDPILOT_MESSAGE_RESPONSE=internal   # or openai

# Feature logs / tokens (parity with region)
CLOUDPILOT_MESSAGE_LOGS=false
CLOUDPILOT_MESSAGE_TOKEN_LIMIT=500

# History (chat only — region does not use these)
OPENAI_SEND_CONVERSATION_HISTORY=true
OPENAI_CONVERSATION_HISTORY_LIMIT=12

OPENAI_API_KEY=…
```

### Demo: chat OpenAI live

```env
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
CLOUDPILOT_MESSAGE_LOGS=true
CLOUDPILOT_REGION_SEARCH=internal
```

Restart API after edits.

### Demo: region OpenAI (for comparison)

```env
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_REGION_SEARCH=openai
CLOUDPILOT_REGION_LOGS=true
CLOUDPILOT_MESSAGE_RESPONSE=internal
```

Config reader: `config/cloudPilotAIConfig.js` → `CLOUDPILOT_AI_CONFIG.messageResponse` / `.messageLogs` / `.messageTokenLimit`.

---

## 2. The pattern (copy from Region)

Every GenAI feature follows this skeleton:

```text
1) Read config
      openaiRequested = feature === 'openai'
      masterDisabled  = !aiEnabled
      useOpenAI       = openaiRequested && !masterDisabled

2) if useOpenAI → OpenAI path
   else          → Internal path

3) On OpenAI failure → fall back to Internal (never break chat)

4) Log compact story if *LOGS=true

5) Return stable public contract (callers never see billing/fallback)
```

### Region gateway (exact)

```js
const openaiRequested = CLOUDPILOT_AI_CONFIG.regionSearch === 'openai';
const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
const useOpenAI = openaiRequested && !masterDisabled;

if (useOpenAI) {
    // OpenAI → may fall back to internal inside
} else {
    // Internal only
}

logRegionSearch({ ... });
return result; // public contract only
```

### Chat gateway (exact — already in code)

```js
const useOpenAIMessageResponse =
    CLOUDPILOT_AI_CONFIG.aiEnabled &&
    CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';

if (useOpenAIMessageResponse) {
    openAIResult = await openAIFunctions.sendGeneralChat({ ... });
} else {
    openAIResult = {
        success: true,
        data: GENERAL_CHAT_STUB_MESSAGE  // Internal
    };
}
```

**Same rule:** master OFF or feature `internal` → never bill OpenAI.

---

## 3. Code map

### Region (reference — STEP 3)

| Piece | Path |
|-------|------|
| Gateway + Internal + OpenAI | `cloudPilot/conversation/understand/search/searchMessageForRegion.js` |
| Called from | `searchMessageForValues.js` → `understandMessage.js` → STEP 3 |
| Situation piece | `ai/context/contextTypes/cloudPilotSituationContext.js` → `region` |
| Context assemble | `ai/context/buildContext.js` with `situationTypes: ['region']`, `includeKnowledge: false` |
| System message | `ai/context/buildSystemMessage.js` |
| Transport | `ai/client/openAIClient.js` → `createOpenAiChatCompletion` + `feature: 'region_search'` |
| Config | `CLOUDPILOT_AI_CONFIG.regionSearch` / `regionLogs` / `regionTokenLimit` |

### Chat use OpenAI (STEP 7)

| Piece | Path |
|-------|------|
| Gateway | `cloudPilot/conversation/CloudPilotMessage.js` → `speakGeneral` |
| Called from | General Conversation after STEP 4 |
| Context | `buildAIContext(context)` (default; no region situationTypes) |
| System message | `buildAISystemMessage(aiContext)` |
| History | `ConversationHistoryContext` if `OPENAI_SEND_CONVERSATION_HISTORY` |
| Transport | `sendGeneralChat({ systemMessage, conversationHistory, userMessage })` |
| Internal stub | `GENERAL_CHAT_STUB_MESSAGE = 'Open AI will respond when Live'` |
| Config | `messageResponse` / `messageLogs` / `messageTokenLimit` |

---

## 4. Logs (mimic region style)

### Region (when `CLOUDPILOT_REGION_LOGS=true`)

```text
==================================================
REGION SEARCH
==================================================
Region Search: OPENAI | INTERNAL
OpenAI Requested: YES          ← only if master blocked openai
OpenAI Disabled By Master: YES
OpenAI Billing: YES            ← only if API was called
OpenAI Failed — using INTERNAL: …
User Message: …
OpenAI Response: …
Region Found: us-west-2 | none
==================================================
```

### Chat (today)

| Log | When |
|-----|------|
| STEP 7a AI Context + full `cloudPilotAIConfig` | Always |
| STEP 7b System Message | `CLOUDPILOT_MESSAGE_LOGS=true` |
| STEP 7c Conversation History | History enabled |
| `OPEN AI MESSAGE` payload | Always (structured roles) |
| STEP 7d Send OpenAI Request | Only when `useOpenAIMessageResponse` |
| Detailed messages JSON | `CLOUDPILOT_MESSAGE_LOGS=true` |

### Parity checklist (if you tighten chat logs later)

Match region’s compact story:

```text
==================================================
MESSAGE RESPONSE
==================================================
Message Response: OPENAI | INTERNAL
OpenAI Requested: YES
OpenAI Disabled By Master: YES
OpenAI Billing: YES
OpenAI Failed — using INTERNAL: …
User Message: …
==================================================
```

Gate that block with `CLOUDPILOT_MESSAGE_LOGS` only (same as region).

---

## 5. Context rules (same philosophy)

| Rule | Region | Chat |
|------|--------|------|
| CloudPilot owns facts | Situation says what to find | Identity / situation / knowledge in system message |
| JSON schema in the **operation** | User prompt asks for `{"region"}` or `{}` | Chat returns natural language (not JSON) |
| Situation pieces are data | `situationPieces.region` | Add pieces only if chat needs them |
| Don’t invent | No default region | Templates still own confirm / modes / errors |

---

## 6. OpenAI call differences (intentional)

| | Region | Chat |
|--|--------|------|
| Temperature | `0` | `CHAT_CONFIG.LOW` (~0.2) |
| max_tokens | `regionTokenLimit` (40) | `messageTokenLimit` (500) |
| History | No | Yes (optional) |
| User turn | Fixed “return JSON only” instructions | Real user message |
| feature tag (usage) | `region_search` | `general_chat` |
| Fallback | Internal regex | Stub string (or keep last good template) |

---

## 7. Checklist: add another feature the same way

Use this when adding e.g. Action Search (`CLOUDPILOT_ACTION_SEARCH`):

1. [ ] Env in `sample_env.md` + `.env`: `CLOUDPILOT_<FEATURE>=internal|openai`
2. [ ] Env: `CLOUDPILOT_<FEATURE>_LOGS`, `CLOUDPILOT_<FEATURE>_TOKEN_LIMIT`
3. [ ] Wire keys in `cloudPilotAIConfig.js` (`readImplementation` + logs + tokens)
4. [ ] One gateway function: master + feature → `useOpenAI`
5. [ ] `*Internal` deterministic path
6. [ ] `*OpenAI` path: client → `buildAIContext` → `buildAISystemMessage` → completion → parse → contract
7. [ ] On missing key / API fail / bad parse → Internal fallback
8. [ ] Compact log gated by `*_LOGS`
9. [ ] Stable public return (no billing fields leaked)
10. [ ] Tag `feature:` for `ai_usage` if you call OpenAI
11. [ ] Master OFF never calls OpenAI

---

## 8. Quick verify

**Chat internal (default)**

```env
CLOUDPILOT_AI_ENABLED=false
# or MESSAGE_RESPONSE=internal
```

Send a general chat message → reply is stub: `Open AI will respond when Live`.

**Chat OpenAI**

```env
CLOUDPILOT_AI_ENABLED=true
CLOUDPILOT_MESSAGE_RESPONSE=openai
CLOUDPILOT_MESSAGE_LOGS=true
```

Send general chat → STEP 7d runs → live reply; usage may appear in `ai_usage`.

**Master blocks feature**

```env
CLOUDPILOT_AI_ENABLED=false
CLOUDPILOT_MESSAGE_RESPONSE=openai
```

Still stub — master wins (same as region with `REGION_SEARCH=openai` and master off).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | How-to: chat MESSAGE_RESPONSE mirrors Region Search env/code/logs |
