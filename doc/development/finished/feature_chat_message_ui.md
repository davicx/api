# Chat Message UI Cleanup

## What this does

Improve ONLY the React chat message presentation so CloudPilot conversations feel closer to ChatGPT: clean, readable, and able to render Markdown correctly.

## Status

**Finished** — Markdown rendering + ChatGPT-like layout in Kite (`ChatMessage` + `react-markdown`).

**Related:** [Current Development](../current/current_development.md) · Chat UI: `kite/src/pages/ChatPage.js` · Older stub: [feature_chat_formatting.md](./feature_chat_formatting.md)

---

## Goal

Improve ONLY the React chat message presentation.

Make CloudPilot conversations feel closer to ChatGPT: clean, readable, lightweight, and able to render formatted responses correctly.

Do not change backend logic, API behavior, message data structures, routing, or CloudPilot intelligence.

**Frontend note:** Prefer Bootstrap / existing Kite styles where they help. Do not invent a parallel design system.

---

## Steps

### Step 1 — Markdown rendering

- [x] Add `react-markdown` (v8 for React 17).
- [x] Render CloudPilot captions as Markdown.

### Step 2 — Assistant + user layout

- [x] Drop the large gray assistant card.
- [x] Keep compact blue user bubbles with max width.
- [x] Centered readable thread (`max-width: 720px`).

### Step 3 — Typography + metadata

- [x] Quieter body text (~16px, ~1.65 line-height).
- [x] Secondary timestamps (`You · time` / `CloudPilot · time`); dropped relative `(10 minutes ago)` from UI.

### Step 4 — Acceptance smoke

- [x] Markdown + layout shipped in Kite (`ChatMessage`).

---

## Current Problems

The current assistant message UI has several issues:

1. Markdown is displayed literally:

```text
### Why It Matters
**Resource Management**
- item
```

2. Line breaks are lost or compressed.

3. Assistant responses are inside a large gray bordered box.

4. Long responses become visually overwhelming.

5. User and CloudPilot messages do not have enough visual distinction beyond the blue user bubble.

6. Message metadata competes too much with the actual conversation.

---

# Desired Direction

Use ChatGPT as the main interaction reference.

Keep the existing CloudPilot visual identity, but simplify the conversation area.

Conceptually:

```text
                    ┌─────────────────────┐
                    │ what is cloud pilot? │
                    └─────────────────────┘
                              You · 4:07 PM


CloudPilot

CloudPilot helps you understand and manage your cloud
infrastructure through conversation.

You can ask about your AWS resources, run scans, understand
issues, and perform supported actions.


CloudPilot · 4:07 PM
```

The assistant response should generally NOT look like a card.

The page itself is the container.

---

# 1. Render Markdown

CloudPilot responses need to support basic Markdown.

Use an established React Markdown renderer rather than writing custom parsing logic.

Support at minimum:

```text
**bold**

*italic*

# / ## / ### headings

- bullet lists
- bullet lists

1. numbered lists
2. numbered lists

`inline code`

code blocks

paragraphs / line breaks
```

Keep this implementation simple.

Do not build a custom Markdown parser.

---

# 2. Assistant Messages

Remove the large gray card/border around normal CloudPilot responses.

Current:

```text
┌───────────────────────────────────────────────┐
│                                               │
│ huge assistant response                      │
│                                               │
└───────────────────────────────────────────────┘
```

Prefer:

```text
CloudPilot

CloudPilot helps you understand and manage your
cloud infrastructure.

You can:

• Scan EC2 resources
• Inspect S3
• understand infrastructure issues

CloudPilot · 4:07 PM
```

Assistant messages should feel like content on the page rather than a UI panel.

Use:

* transparent/white background
* no normal border
* comfortable line-height
* reasonable maximum text width
* spacing between paragraphs
* clear lists
* subtle formatting for code

Do NOT add excessive shadows or cards.

---

# 3. User Messages

Keep the user message as a compact bubble aligned right.

The current blue direction is good.

Something approximately:

```text
                         ┌────────────────────────┐
                         │ how many EC2s do I have │
                         └────────────────────────┘
                                  You · 4:07 PM
```

Keep:

* blue background
* white text
* rounded corners
* width based on content

But add a reasonable maximum width so long user messages wrap cleanly.

Do not make user bubbles stretch across the entire conversation.

---

# 4. Conversation Width

Long lines are currently difficult to read.

Create a centered conversation content area with a sensible maximum width.

For example conceptually:

```text
|             PAGE                         |

       |------ CHAT CONTENT ------|

       User message

       CloudPilot response

       User message

       CloudPilot response
```

Do not blindly copy exact ChatGPT dimensions.

Use the existing CloudPilot layout and choose a comfortable readable width.

Long assistant paragraphs should not span the entire monitor.

---

# 5. Typography

Assistant body text should be visually quieter than it is currently.

Aim for:

* approximately 16px normal text
* ~1.5–1.7 line height
* normal/400 body weight
* headings slightly heavier
* strong/bold text clearly visible but not oversized

Do not use giant typography.

The conversation should feel easy to scan.

---

# 6. Markdown Spacing

Add deliberate styling for rendered Markdown.

Examples:

Paragraph:

```css
margin-bottom
```

Headings:

```text
space above
smaller space below
```

Lists:

```text
indent correctly
space between list and surrounding paragraphs
```

Code:

```text
subtle gray background
monospace font
small rounded corners
```

Code blocks:

```text
separate block
overflow-x: auto
```

The important goal is that this:

```markdown
Here are your instances:

- **web-server** — running
- **worker** — stopped
- **database** — running
```

actually renders visually as:

Here are your instances:

* **web-server** — running
* **worker** — stopped
* **database** — running

rather than showing `**`, `-`, and Markdown syntax literally.

---

# 7. Metadata

Current metadata such as:

```text
CloudPilot · 3:58 pm (10 minutes ago)
```

is visually prominent.

Make metadata secondary.

Use:

* smaller font
* muted gray
* less spacing
* don't let timestamps dominate the message

For MVP, there is probably no need to show BOTH:

```text
3:58 pm
(10 minutes ago)
```

unless that information is useful elsewhere.

Prefer something simpler such as:

```text
CloudPilot · 3:58 PM
```

and:

```text
You · 3:58 PM
```

Keep existing data available; this is primarily a presentation change.

---

# 8. Do Not Over-Design

This is important.

Do NOT turn every type of content into:

* cards
* panels
* badges
* colored boxes
* shadows

Normal conversation should be extremely simple.

Later CloudPilot can have special components for things like:

```text
EC2 scan results
S3 scan results
pending requests
cost information
confirmation before an action
```

Those MAY eventually deserve structured UI.

But:

```text
"What is a region?"
```

should simply look like a normal conversational answer.

---

# 9. Keep Existing Structure Where Possible

Inspect the existing React chat components first.

Make the smallest reasonable change.

Ideal scope is approximately:

```text
Message / ChatMessage component
+
chat/message CSS
+
Markdown dependency
```

Prefer Bootstrap utilities / existing Kite CSS where they fit.

Do not refactor unrelated frontend architecture.

Do not modify backend response formatting for this task.

---

# Acceptance Tests

### Plain response

Input:

```text
An AWS region is the geographic location where your AWS resources run.
```

Displays as a normal CloudPilot paragraph without a giant card.

---

### Bold

Input:

```markdown
You have **3 running instances**.
```

`3 running instances` renders bold.

No literal `**`.

---

### Bullets

Input:

```markdown
Your instances:

- web-server
- worker
- database
```

Displays as a real bulleted list.

---

### Paragraphs

Input:

```text
An AWS region is a geographic location.

CloudPilot needs the region so it knows where to run the scan.
```

Displays as two visibly separate paragraphs.

---

### Code

Input:

```markdown
Region: `us-west-2`
```

`us-west-2` displays as inline code.

---

### User message

User message remains a compact blue bubble aligned right.

---

### Assistant message

CloudPilot response:

* aligned left
* no large gray bordered card
* readable maximum width
* correctly rendered Markdown
* subtle metadata

---

# Scope

UI/UX only.

Do NOT change:

* CloudPilot intelligence
* OpenAI prompts/context
* API responses
* actions
* scans
* backend message formatting
* conversation routing

The backend can send Markdown text.

React is responsible for rendering that Markdown properly.
