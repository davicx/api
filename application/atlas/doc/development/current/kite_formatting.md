# Kite Formatting — Bold + Bullets from API

**Status:** Plan — not started  
**Scope:** Send lightly formatted CloudPilot chat text from the API and display it in Kite  
**Work type:** Markdown-in-caption + Kite bubble renderer (MVP: bold + bullets only)  
**Last updated:** 2026-08-02

**Related:** [current.md](./current.md) · [cloud_pilot_chat.md](./cloud_pilot_chat.md) · Chat UI: `kite/src/pages/ChatPage.js`

---

## Goal

Support simple formatting in CloudPilot chat bubbles:

- **Bold**
- **Bullets**
- Newlines that actually show

Primary use later: live OpenAI message responses asked to return this markdown.

First smoke test: insert one formatted CloudPilot row in `messages` and confirm Kite renders it — no OpenAI required.

---

## Today

Chat is **plain string** end-to-end:

```text
API cloudPilotMessage
  → messages.message_caption
  → Kite bubble {m.messageCaption}
```

| Capability | Today |
|------------|--------|
| Plain text | Yes |
| Newlines in bubble | No (often collapsed) |
| Bold / bullets / markdown | No |
| HTML rendering | No |
| Structured rich UI | Via `atlasResponse` panels only (navigator, PR, instructions) |

Key paths:

| Layer | Path |
|-------|------|
| Persist / return | `api/application/atlas/logic/messages.js` |
| DB | `messages.message_caption` (`TEXT`) |
| Speak | `cloudPilot/conversation/CloudPilotMessage.js` |
| Kite bubble | `kite/src/pages/ChatPage.js` — `{m.messageCaption}` |

No markdown libs, no `dangerouslySetInnerHTML`, no `pre-wrap` on chat bubbles today.

---

## Approach (locked for MVP)

**Markdown in the string, render in Kite.**

| Layer | Change |
|-------|--------|
| API / DB | Store markdown in `message_caption`. No new column. |
| Convention | `**bold**`, `- item` / `* item`, `\n` for lines |
| Kite | Allowlisted markdown → React (`strong`, `ul`/`li`, breaks). Not raw HTML. |

Do **not** ship HTML from the API into `dangerouslySetInnerHTML`.

Keep formatting in the **caption**. Do not invent a parallel format path inside `atlasResponse` for this MVP.

### Agreed format example

```text
**Ready to scan.**

Here is what I need:
- Region
- Instance type
```

---

## Steps

### 0. Agree format

Locked: `**bold**` + `-` / `*` bullets + newlines only.

### 1. Smoke test via DB (no OpenAI)

Insert (or script) one CloudPilot `messages` row for a real conversation with a markdown caption.

Reload Kite chat.

Until Kite renders markdown, markers may show literally — that proves storage/load. After Step 2, the same row should show bold + bullets.

### 2. Kite — minimal renderer in `ChatPage.js`

Replace `{m.messageCaption}` for CloudPilot bubbles (or all bubbles if one path is simpler):

- Prefer tiny allowlisted markdown → React elements, **or**
- `white-space: pre-wrap` + only `**…**` and `- ` lines (zero deps)

Treat all captions as untrusted (user + CloudPilot).

### 3. API OpenAI (later, small)

When `CLOUDPILOT_MESSAGE_RESPONSE=openai`, instruct the model:

> Reply with simple markdown only: **bold** and `-` bullets. No tables, no HTML, no headings.

Deterministic templates can stay plain or adopt the same markdown over time.

### 4. Explicit non-goals (MVP)

- No italics / links / code / images / tables  
- No new `message_type` or format flag column  
- No formatting via `atlasResponse`  
- No full markdown suite  

---

## Risks

| Risk | Mitigation |
|------|------------|
| XSS | Markdown → React / allowlist; never trust raw HTML |
| User messages | Same renderer must treat captions as untrusted |
| Existing `\n` replies | Renderer / `pre-wrap` also fixes CLI/template newlines |
| latin1 caption charset | Stick to ASCII markdown for MVP |

---

## Success check

1. Seeded CloudPilot message shows **bold** + bullets in Kite  
2. Plain template replies still look fine  
3. Later: OpenAI live reply with the same markdown renders correctly  

---

## Build order

1. [ ] Seed / insert formatted CloudPilot `message_caption` (visual proof)  
2. [ ] Kite bubble renderer (bold + bullets + newlines)  
3. [ ] OpenAI message path: ask for simple markdown only  
4. [ ] Optional: migrate a few deterministic templates to markdown  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-02 | Plan captured — markdown-in-caption, Kite render, DB smoke first |
