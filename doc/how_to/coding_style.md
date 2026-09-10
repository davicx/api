# API folder code style

Read this document **before** changing any code under `api/`.

## 1. Never delete commented code

Do **not** remove existing comments or commented-out code—including block comments, `//STEP` markers, `FUNCTIONS A:` TOC blocks, appendix sections, or temporarily disabled snippets—unless the user explicitly asks you to remove them. Prefer adding or adjusting active code around preserved comments.

## 2. Variable names: no one-letter identifiers

Do **not** use one-letter variable names (`a`, `b`, `x`, …) for values that carry domain meaning (request bodies, DB rows, config, message payloads, and similar). Use descriptive names so readers can follow the code without guessing. The only acceptable single-letter names are conventional indices in tight loops (e.g. `i` for a numeric index) when a longer name would add noise.

## 3. Scope of edits

Do only what the request requires: avoid drive-by refactors, renames, or reordering large sections unless asked.

## 4. API-specific shapes

`Message.createMessageText` expects a plain message object (same shape as `buildNewMessage` output), not a raw Express `req`. Keep call-site shapes consistent when you touch message creation.
