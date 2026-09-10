# Intelligence Provider — One operation, same context

**Status:** Development guide  
**Use when:** Adding or changing an Intelligence capability that has Internal and OpenAI (or a future third provider).

**Related:** [Finished feature](../finished/feature_intelligence_provider.md) · [CloudPilot Context](./cloud_pilot_context.md) · [Add an Intelligence Capability](./add_intelligence_capability.md) · [Intelligence front door](../finished/feature_intelligence_front_door.md)

---

## One-sentence rule

> **One CloudPilot operation. Same context in. Same result out. Different implementation.**

```text
SAME OPERATION
SAME CONTEXT IN
SAME RESULT OUT
DIFFERENT IMPLEMENTATION
```

Internal and OpenAI are **not** two different flows. They are two providers behind one door.

---

## Proven shape — Search TASK family

```text
get<Search>Context(...)
        ↓
SearchContext { userMessage, task, … }
        ↓
CloudPilotIntelligence / search…
        ↓
choose provider (when OpenAI exists)
   ┌────┴────┐
Internal   OpenAI
(context)  (context)
   │          │
   └────┬─────┘
        ↓
same operation result
```

| Search | Operation context |
|--------|-------------------|
| Region | `getRegionSearchContext.js` |
| Action | `getActionSearchContext.js` |
| AI Spend | `getAiSpendSearchContext.js` |
| Open Requests | `getOpenRequestsSearchContext.js` |
| Org Knowledge | `getOrganizationalKnowledgeSearchContext.js` |
| EC2 Inventory | `getEc2InventorySearchContext.js` (Internal-only MVP) |
| S3 Inventory | `getS3InventorySearchContext.js` (Internal-only MVP) |

OpenAI message builders (`build…OpenAIMessages`) are **adapters only**.

**Stop at the Search boundary.** Do not apply this to Friendly Reply or General Chat until a feature asks.

---

## Two levels of context

```text
cloudPilotIntelligence/context/
├── contextTypes/        building blocks (Identity, Situation, Current State, …)
└── operationContext/    what THIS operation sends to Intelligence
```

- `contextTypes/` = reusable kinds of CloudPilot information  
- `operationContext/` = assemble context for one operation  

Do **not** name folders after providers (`openAIContext/`, `providerContext/`).

**Same context** means the same object across providers for **one** operation.  
It does **not** mean Region Search gets General Chat’s Identity stack.

---

## Invariants (do not break)

1. Caller says the operation name — not `…WithOpenAI` / `…Internal`.
2. Build **one** operation context object once.
3. Pass that **literal same object** to every provider. Do not shrink it for Internal.
4. `Internal` means CloudPilot’s internally selected implementation — not “regex forever.”
5. OpenAI message builders are **adapters**, not the operation context.
6. Nothing outside Intelligence should need to know which provider ran.
7. Adding a third provider must not change the caller.

---

## Do not

- Invent a Provider base class, registry, or `executeOperation()` for this pattern
- Apply this to Friendly Reply / General Chat until a feature asks
- Give Search Identity “for consistency”
- Hide operation context assembly inside OpenAI-only helpers

---

## When adding another Search

1. Add `getThingSearchContext` under `operationContext/`.
2. Pass that same object to Internal and OpenAI (or Internal only until OpenAI exists).
3. Keep the public Intelligence door provider-agnostic.
4. Do **not** invent a provider framework.
