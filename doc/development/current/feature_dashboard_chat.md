# CloudPilot — Dashboard companion chat (right panel)

## What this does

Add an **open/close CloudPilot chat panel on the right** of Cloud / S3 dashboard
pages, so the user can ask about the current page without leaving the drill-down.

```text
┌────────────┬─────────────────────────────┬──────────────────┐
│ Atlas Menu │  S3 Buckets / Bucket / …    │  CloudPilot Chat │
│            │                             │  (open / close)  │
└────────────┴─────────────────────────────┴──────────────────┘
```

**Status:** Current — design captured; implement **after** Level 1+ of
[feature_dashboard](./feature_dashboard.md) feel solid.  
**Codename:** `feature_dashboard_chat`  
**Depends on:** `feature_dashboard` (Buckets → Bucket → Finding)

**Related:**
* [S3 Dashboard Migration](./feature_dashboard.md)
* Design HTML (paste / local mock): S3 + right chat (`--chat-width: 390px`)

---

## Feeling we want

> I'm looking at this bucket (or this finding). I can open CloudPilot beside it,
> ask a question, and it already knows what page I'm on.

Not a second full Chat app. A **companion** to the dashboard page.

---

## Design source (locked)

Full mockup provided as **S3 + right chat** HTML (header + left sidebar + main
+ fixed right `chat-panel`).

For Atlas: **do not rebuild header/left menu** — those already exist. Port only:

1. Right **chat panel** (FUNCTIONS J)
2. Main area **margin / width** when chat is open vs closed
3. **Ask CloudPilot** open control on the page header
4. Optional **page context** strip above messages

### Key tokens

```css
--chat-width: 390px;
```

### Open / close

```text
body.chat-closed  →  panel slides off (translateX(100%))
                     main uses full width (no right margin)
open              →  remove chat-closed; main reserves --chat-width
```

Mock controls:

* `Ask CloudPilot` / finding `Review →` → `openChat()`
* Panel `×` → `closeChat()`

---

## Panel structure (extract — not full HTML)

```text
.chat-panel (fixed, top under header, right, bottom, width 390px)
  ├── .chat-header
  │     brand (C logo + "CloudPilot" + "Ask about this page")
  │     .chat-close (×)
  ├── .chat-context          ← Current context (page resource)
  │     label: CURRENT CONTEXT
  │     resource name + meta (e.g. S3 bucket · region · N findings)
  ├── .chat-messages         ← scrollable thread
  │     assistant messages (+ optional mini finding card)
  │     user bubbles (right-aligned, green-soft)
  └── .chat-composer
        input + send
        note: "CloudPilot has context from this page."
```

### Context strip

Shows what the dashboard page is about, e.g.:

```text
CURRENT CONTEXT
◫  codepipeline-us-west-2-…
   S3 bucket · us-west-2 · 6 findings
```

Update when route changes (Buckets list vs Bucket vs Finding).

### Mini finding card in chat (optional MVP+)

Same visual language as chat scan card / mock `.chat-finding`:

* Priority · title · short description · `Review fix` button  
* Do not invent remediation here — link into Finding page / TODO Fix later

---

## Layout rules (Atlas)

```text
Atlas Header (existing)
Atlas Menu (existing, left)
app-main
  ├── Cloud page content (flex: 1, shrinks when chat open)
  └── DashboardChatPanel (fixed or flex sibling, ~390px)
```

When closed: content full width of `app-main`.  
When open: content leaves room for panel (or overlay with shadow on narrow viewports — mock uses shadow under 1250px).

**TODO for `feature_dashboard` pages:** keep Cloud page layout able to accept
this right column without a redesign.

---

## Behavior (product)

| Action | Result |
|--------|--------|
| Ask CloudPilot | Open panel |
| Close × | Close panel |
| Send message | Same CloudPilot chat pipeline as `/chat` when wired (conversation + context) |
| Page navigation | Update **context strip**; optionally keep thread or start page-scoped thread (decide in implementation) |

### MVP scope for first coding pass

1. Panel shell + open/close + layout shift (UI only / mock replies OK)  
2. Context strip driven by current route + `AtlasFindingsContext` when available  
3. Wire send to real `sendMessageAPI` **only after** shell works  

Do **not** block S3 Buckets Level 1 on full companion chat.

---

## Relationship to main Chat (`/chat`)

| Main Chat | Dashboard companion |
|-----------|---------------------|
| Full thread, Projects, scan cards | Narrow panel, page context |
| Primary workspace | Assist while browsing Cloud |

Prefer **reuse** send / poll hooks where practical; **do not** embed full
`ChatPage` (no second Projects sidebar, no duplicate header).

---

## Suggested files (when implementing)

```text
components/cloud/
  DashboardChatPanel.js      # panel shell + open/close
  DashboardChatContext.js    # optional context strip
pages/cloud/…                # Ask CloudPilot button on headers
```

State: `chatOpen` can live in React context shared by Cloud pages, or local
layout wrapper around `/cloud/*` routes.

---

## Scope guard

### Do NOT

```text
rebuild Atlas Header / Menu from the mock
require companion chat before Buckets Level 1
duplicate full ChatPage into the panel
rewrite scan / confirmation backend
build cost or remediation in this panel
```

### Do

```text
right panel open/close matching mock
page context strip
reuse CloudPilot visual language (green, soft borders, quiet type)
implement after dashboard drill-down is usable
```

---

## Implementation order

1. Finish **feature_dashboard Step 1** (Buckets page + context).  
2. Add layout wrapper + **DashboardChatPanel** shell (open/close, empty/mock).  
3. Context strip from route + scan state.  
4. Wire real send/poll.  
5. Deep-link actions (Review fix → finding page).

---

## Success criteria

* On a Cloud page, **Ask CloudPilot** opens a ~390px right panel  
* **×** closes it and main content expands  
* Context strip reflects current bucket/page when data exists  
* Visuals stay close to the provided mock (panel section), not a redesign  
* Main `/chat` remains the primary full chat experience  
