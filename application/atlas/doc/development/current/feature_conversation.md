# Feature Conversation

## Current step

**Plan locked** — Phase 1 (Better Conversation) awaiting start.

## Next

Say **do Phase 1** when you want to start.

**Status:** Active  
**Codename:** `feature_conversation`  
**Related:** [Current Development](./current_development.md) · [Feature Chat](../finished/feature_chat.md) · [CloudPilot Context](../how_to/cloud_pilot_context.md) · [Use OpenAI Chat](../how_to/use_openai_chat.md) · [Organizational Knowledge](../finished/feature_organizational_knowledge.md) · [Chat guardrails](../future/feature_chat_guardrails.md)

---

Yes. Given your goal, I would make **Phase 1 much more about “make the conversation noticeably better now”** and deliberately push the more ambitious infrastructure-agent architecture later.

## Phase 1 — MVP: Better Conversation

**Goal:** Make CloudPilot feel much more natural, useful, and coherent with the infrastructure knowledge it already has.

### Model / OpenAI

* [ ] Move general conversation from `gpt-4o-mini` to a stronger current model
* [ ] Move general conversation to the Responses API
* [ ] Keep the existing deterministic AWS questions/actions working
* [ ] Do **not** redesign the entire AWS retrieval architecture yet

### Conversation quality

* [ ] Clean up the system/developer prompt
* [ ] Remove the duplicated current user message from the system prompt
* [ ] Keep permanent CloudPilot behavior/instructions separate from dynamic AWS context
* [ ] Make responses more conversational and less like generated reports
* [ ] Let the model naturally explain, compare, summarize, and answer follow-ups when it has enough information
* [ ] Make uncertainty explicit when CloudPilot does **not** have enough AWS information

### Conversation memory

* [ ] Improve beyond the simple “last 12 database rows” approach
* [ ] Preserve enough recent conversation for natural follow-ups
* [ ] Keep track of the current subject/resource when practical
* [ ] Avoid treating old AWS facts from conversation history as guaranteed current truth
* [ ] Make conversation continuity consistent across the main chat paths

### Existing context

* [ ] Continue supplying known AWS facts from the existing CloudPilot system
* [ ] Preserve the current grounding rules: don't invent resources, findings, costs, or state
* [ ] Preserve existing organization-knowledge behavior
* [ ] Preserve selected-finding allowlists
* [ ] Keep deterministic operations for questions CloudPilot already knows how to answer

### Basic validation

* [ ] Create ~10–20 realistic CloudPilot conversations
* [ ] Include follow-ups such as:

  * “What EC2 instances do I have?”
  * “Which ones are stopped?”
  * “Tell me more about that one.”
  * “Is that costing me anything?”
  * “What should I fix?”
  * “Why?”
* [ ] Compare old vs. new conversation quality
* [ ] Verify CloudPilot doesn't confidently invent missing AWS information

**Phase 1 success = CloudPilot feels substantially more like talking to ChatGPT, while keeping roughly the infrastructure capabilities it already has.**

---

# Phase 2 — AI Can Investigate AWS

**Goal:** Stop requiring CloudPilot to predict every possible infrastructure question beforehand.

This is where the major architectural improvement from the review happens.

* [ ] Add model tool/function calling
* [ ] Start with EC2 only
* [ ] Add a very small read-only tool set, perhaps:

  * [ ] `search_resources`
  * [ ] `get_resource_details`
  * [ ] `get_cost_data`
  * [ ] `get_findings`
* [ ] Allow multiple tool calls during one conversation turn
* [ ] Return structured AWS data rather than giant text dumps
* [ ] Include timestamps / freshness with results
* [ ] Include account and region scope
* [ ] Clearly indicate partial or unavailable data
* [ ] Keep tools strictly read-only

Then CloudPilot can handle:

```text
"What EC2 instances do I have?"

"What about the stopped ones?"

"Which costs the most?"

"Why?"

"Is it oversized?"

"Anything else wrong with it?"
```

without you creating six separate regex/question handlers.

**Phase 2 success = the AI can decide what infrastructure information it needs and retrieve it itself.**

---

# Phase 3 — Broader Infrastructure Understanding

**Goal:** Expand the successful EC2 pattern across AWS.

* [ ] S3
* [ ] RDS
* [ ] Lambda
* [ ] ECS / containers
* [ ] Load balancers
* [ ] VPC / networking
* [ ] IAM/security information
* [ ] CloudWatch metrics
* [ ] Cost/billing information
* [ ] CloudTrail / recent changes
* [ ] CloudPilot findings
* [ ] Resource relationships/dependencies

Add richer tools when actually needed:

* [ ] `get_resource_relationships`
* [ ] `get_metrics`
* [ ] `get_recent_changes`
* [ ] `search_organization_knowledge`

This is where questions like these become realistic:

> “Why did production get slow yesterday?”

> “What changed before this started happening?”

> “What depends on this database?”

> “Why did our AWS bill increase?”

**Phase 3 success = CloudPilot can investigate across AWS instead of simply describing individual resources.**

---

# Phase 4 — Better Memory & Organizational Knowledge

**Goal:** CloudPilot understands the ongoing conversation **and** how the customer's organization works.

### Conversation memory

* [ ] Current topic/resource
* [ ] Active goal
* [ ] References such as “that instance” / “those buckets”
* [ ] Unresolved questions
* [ ] Useful conversation summaries
* [ ] Long-running conversation compaction

### Infrastructure truth

Keep this separate from conversation memory:

* [ ] Revalidate current AWS state
* [ ] Store evidence/source
* [ ] Store `observedAt`
* [ ] Track data freshness
* [ ] Never assume something remains true merely because CloudPilot said it earlier

### Organization knowledge

* [ ] Expand beyond S3 knowledge
* [ ] Architecture documentation
* [ ] Team/service ownership
* [ ] Jira
* [ ] Slack
* [ ] GitHub
* [ ] Runbooks
* [ ] Internal documentation

Then something like:

> “Why is this service configured this way?”

could potentially combine **AWS reality + company knowledge**.

**Phase 4 success = CloudPilot understands both the cloud and the organizational context around it.**

---

# Phase 5 — From Answers → Safe Actions

**Goal:** Connect the conversational intelligence to the remediation system you're already building.

Your remediation work already emphasizes getting a small AWS action working clearly before layering abstractions around it.  I'd preserve that philosophy here.

* [ ] AI identifies a problem
* [ ] AI explains the evidence
* [ ] AI proposes a remediation
* [ ] User chooses whether to act
* [ ] Route actions through CloudPilot's existing controlled remediation system
* [ ] Automatic remediation
* [ ] CLI instructions
* [ ] Infrastructure PR
* [ ] Manual instructions
* [ ] Verification
* [ ] Undo where supported
* [ ] Permission checking
* [ ] Confirmation for meaningful/destructive changes

Keep the boundary very clear:

```text
AI READ
→ fairly autonomous

AI CHANGE
→ CloudPilot authorization + safety controls
```

**Phase 5 success = CloudPilot doesn't just find and explain problems; it can safely help resolve them.**

---

# Phase 6 — Production Quality / Scale

**Goal:** Make all of this measurable, secure, reliable, and economical.

* [ ] Full conversation evaluation suite
* [ ] Groundedness tests
* [ ] Tool-selection tests
* [ ] Multi-turn tests
* [ ] Stale-data tests
* [ ] Prompt-injection tests
* [ ] Destructive-action safety tests
* [ ] Model comparisons
* [ ] Cost/latency benchmarks
* [ ] Prompt caching
* [ ] Model routing based on complexity
* [ ] Disable raw prompt logging by default
* [ ] Redact infrastructure identifiers where appropriate
* [ ] Formal retention/access policies
* [ ] Tool-call telemetry
* [ ] Groundedness/quality monitoring
* [ ] Failure/fallback handling

---

## The roadmap I'd actually follow

```text
PHASE 1 — NOW
Better conversation
Stronger model
Responses API
Better history/context
Prompt cleanup
10–20 test conversations

        ↓

PHASE 2
AI can retrieve EC2 information itself

        ↓

PHASE 3
AI can investigate AWS broadly

        ↓

PHASE 4
Memory + organizational knowledge

        ↓

PHASE 5
Conversation → safe remediation

        ↓

PHASE 6
Production hardening + evaluation
```

I especially like this split for CloudPilot because **Phase 1 doesn't turn into another giant infrastructure project**. You can improve what you originally cared about—the conversation—while the more ambitious “AI teammate that can investigate my entire AWS environment” becomes a deliberate evolution rather than an MVP requirement.
