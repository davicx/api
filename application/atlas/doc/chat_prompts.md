# CloudPilot — Chat prompts (smoke / demo)

Copy-paste messages for manual chat testing. Prefer a **fresh conversation** when switching features so you are not stuck mid-request.

**Related:** [understanding_actions.md](./understanding_actions.md) · [sample_env.md](./sample_env.md) · [use_openai_chat](./development/how_to/use_openai_chat.md)

```bash
curl -X POST http://localhost:3003/message \
  -H "Content-Type: application/json" \
  -d '{"conversationID":1,"messageFrom":"davey","messageCaption":"hello","masterSite":"kite"}'
```

---

## Organizational knowledge (S3)

Requires seed: `sql/seed/seed_cloudpilot_organization_knowledge.sql`  
Env: `CLOUDPILOT_ORG_KNOWLEDGE_SEARCH=internal` (typical). With `MESSAGE_RESPONSE=internal`, reply is grounded DB text; with `openai`, Knowledge is in the system message.

| Prompt | Expect |
|--------|--------|
| *(select finding / resource `cloudpilot-user-uploads`)* then `What is this bucket for?` | Critical / do-not-delete |
| `What is sam-youtube-demo for?` | Low / likely safe |
| `Tell me about my tutorial bucket.` | → `sam-youtube-demo` (tag) |
| `Tell me about the Sam YouTube Demo bucket.` | Same via display name |
| `Tell me about website images.` | → `cloudpilot-assets` |
| `What is my uploads bucket for?` | → `cloudpilot-user-uploads` |
| `hello` | No org Knowledge loaded |
| `What is totally-fake-bucket-xyz for?` | No invented purpose |

Other useful tags from seed: `youtube`, `hello world`, `sam`, `assets`, `images`, `frontend`, `uploads`, `profile photos`, `production data`.

---

## General chat / product

| Prompt | Expect |
|--------|--------|
| `hello` / `hi` | Short greeting (General Chat) |
| `what is cloud pilot?` | Product-accurate, concise |
| `what is a region` | Short definition (not a region *provide*) |
| `What is US West 2?` | Region Search → `{}` (ask, not provide) |

---

## Actions (start a request)

| Prompt | Action |
|--------|--------|
| `scan ec2` | `scan_ec2` |
| `scan ec2 in us-west-2` | `scan_ec2` + region |
| `scan s3` | `scan_s3` (explicit Action) |
| `what S3 buckets do I have` / `show my s3 buckets` / `list my buckets` | Question `s3_inventory` → `scan_s3` |
| `toggle ec2` / `switch ec2` | `toggle_ec2` |
| `create ec2` / `create instance` | `create_ec2` |
| `delete ec2` / `delete instance` | `delete_ec2` |
| `pause ec2` / `stop instance` | `pause_ec2` |
| `resume ec2` / `start instance` | `resume_ec2` |
| `show me all my aws resources` | `inventory_aws` |

**Local Atlas S3 mock** (`atlas/.../s3_scan_routes_test.py`) — same **5 buckets** as org knowledge seed. After `scan s3` (or inventory ask) → `us-west-2` → `yes`:

| Bucket | Region | Encryption | Lifecycle | Public Block | Versioning | Logging |
|--------|--------|------------|-----------|--------------|------------|---------|
| `sam-youtube-demo` | us-west-2 | disabled | no | disabled | disabled | disabled |
| `cloudpilot-assets` | us-west-2 | enabled | yes | enabled | enabled | enabled |
| `cloudpilot-user-uploads` | us-west-2 | enabled | yes | enabled | disabled | enabled |
| `customer-uploads-demo` | us-west-2 | disabled | no | disabled | disabled | disabled |
| `kite-app-assets` | us-west-2 | enabled | yes | enabled | enabled | enabled |

---

## Values (while a request is open)

| Prompt | Field |
|--------|-------|
| `us-west-2` | region |
| `region: "us-west-2"` | region (structured) |
| `I want to use USA Weste 2` | region → `us-west-2` (typo OK) |
| `I dont want to use US West 2` | region Search → `{}` (reject) |
| `i-0abc123def4567890` | instance_id / primary (context-dependent) |
| `name it my-demo-server` | name |
| `t3.micro` | instance_type |

---

## Reply / execution mode

| Prompt | Meaning |
|--------|---------|
| `yes` / `confirm` / `run it` / `do it` | confirm |
| `cancel` / `stop` / `never mind` | cancel request |
| `1` | instructions |
| `2` | CLI |
| `3` | PR |
| `4` | automatic |
| `undo` | undo latest undoable change |

---

## Conversation / open requests

| Prompt | Expect |
|--------|--------|
| `what am i waiting on` / `list open actions` / `do I have any open requests` | list open |
| `what is the status` / `show status` | status |
| `switch to 2` / `focus on Toggle EC2` | focus switch |

---

## History

| Prompt | Expect |
|--------|--------|
| `show my recent history` / `what did I change recently` / `recent changes` | last changes + Navigator table when wired |

---

## AI spend

| Prompt | Expect |
|--------|--------|
| `How much have I spent on OpenAI?` | `show_ai_usage` summary |
| `AI spend today` / `OpenAI costs` | same |
| `Show all costs` / `AWS + OpenAI` | deferred (not combined yet) |

---

## Quick demo paths

**Org knowledge (Internal):**  
`Tell me about my tutorial bucket.` → low-importance demo bucket facts.

**Scan (fields → confirm):**  
`scan ec2` → `us-west-2` → `yes`

**Create (guided):**  
`create ec2` → name → region → `t3.micro` → mode `4` → `yes`

**Toggle undo:**  
`toggle ec2` → collect fields → `4` → `yes` → `undo`

**History:**  
after a change → `show my recent history`

---

## Env cheat sheet

```env
# Org Knowledge search (extractor)
CLOUDPILOT_ORG_KNOWLEDGE_SEARCH=internal

# Chat replies
CLOUDPILOT_MESSAGE_RESPONSE=internal   # grounded stub / org speak
# CLOUDPILOT_MESSAGE_RESPONSE=openai   # live phrasing + Knowledge in system msg

CLOUDPILOT_MESSAGE_LOGS=true           # dump AI context + Knowledge status
CLOUDPILOT_AI_ENABLED=true             # master; OFF forces Internal everywhere
```

Restart API after `.env` edits.
