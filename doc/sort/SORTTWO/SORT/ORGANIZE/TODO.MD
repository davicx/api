# CloudPilot — Architecture & Finding contract (planning)

Senior-engineer review: align codebase to one architecture, one Finding schema, scalable EC2 → S3/RDS.

**Do not over-engineer.** Fix inconsistencies; avoid unnecessary rewrites.

---

## Goal

1. All scan logic follows the defined architecture.
2. All rules return the **standardized Finding format** (see below).
3. No legacy / outdated Finding structures remain.
4. Code stays modular and scalable for new services (S3, RDS).

---

## Target flow

```text
API Route → Service Layer → Core Logic → Scanner → Rule Engine → Rules → Findings
```

---

## Folder responsibilities (target)

| Area | Responsibility |
|------|------------------|
| `api/` | HTTP only; validate input; call services; format response |
| `api/services/` | Orchestration; call core logic; return structured data for API |
| `core/ec2/` | `ec2_scanner.py` — AWS data only, no business logic; `ec2_logic.py` — scanner + rule engine |
| `core/rules/` | Rule functions only; resource dict in → `Finding` or `None`; **no AWS** |
| Rule engine + registry | Today: `core/shared/rule_engine.py`, `core/shared/registry.py` — doc may say `engine/`; **reconcile naming vs reality** |
| `core/models/` | `finding.py` — single **Finding** dataclass (new structure) |

---

## Finding model — target

- [x] `core/models/finding.py` matches the agreed dataclass: `id`, `provider`, `service`, `region`, `status`, `priority`, nested dicts (`resource`, `issue`, `metrics`, `recommendation`, `remediation`, `cost`), `summary`, `metadata`, plus `to_dict()`.
- [x] **Active rules** use nested `Finding` only (`low_cpu`, `old_instance`). Legacy flat usage remains under `core/ORIGINAL/` only.

**Old format (remove / do not use):** flat `Finding(service="EC2", resource_id=..., issue=..., recommendation=..., instance_type=..., avg_cpu=...)`.

**New format:** nested `resource`, `issue`, `metrics`, `recommendation`, `remediation`, `cost`, `metadata`; consistent `service` casing (e.g. `ec2` not `EC2` where agreed).

---

## Audit checklist

### 1. Rules

- [x] All rules return `Finding` using the **new** structure.
- [x] No rule returns only flat fields (`resource_id`, `instance_type`, `avg_cpu` at top level).
- [x] No business logic inside scanner (EC2 scanner: data + scope filters only).
- [x] No AWS calls inside rules.

### 2. Scanner (`ec2_scanner` / future scanners)

- [x] Returns clean, normalized dicts per resource — ``_normalize_ec2_instance`` + ``CANONICAL_EC2_INSTANCE_KEYS``; resource id is ``instance_id``.
- [x] No recommendations or findings created in the scanner.

### 3. Rule engine

- [ ] Iterates over resources.
- [ ] Applies registered rules.
- [ ] Collects non-null findings only.

### 4. Service layer (`api/services/`)

- [ ] Calls `run_ec2_scan` (or equivalent core entry).
- [ ] Returns findings in API shape via helpers — **does not** hand-build Finding objects except via rules/engine.

### 5. API layer

- [ ] Serializes findings with `to_dict()` (or equivalent single path).
- [ ] Wraps responses in the standard JSON envelope.

### 6. Dead code & cleanup

- [x] Active rules: removed dead legacy `Finding` snippet in `low_cpu.py`; `old_instance` migrated.
- [x] `finding.py`: duplicate imports removed.
- [x] AI helpers (`mock_explain_finding`, `build_explanation_prompt`) updated for nested schema (`core/ORIGINAL/` still legacy).

### 7. Registry & adding rules

- [ ] Adding a new rule = **one** rule file + **one** registry entry (document pattern in ReadMe if helpful).

### 8. Naming & consistency

- [ ] `ec2` vs `EC2` — align with contract (service identifiers).
- [ ] Rule IDs consistent (`rule_id` in metadata, registry keys).

---

## Constraints

- Do **not** change the overall architecture — **align** code to it.
- No new abstractions unless clearly needed.
- Prefer simple, readable code.

---

## Desired outcome

- One Finding schema end-to-end.
- EC2 works today; S3/RDS can add scanner + rules + registry without a big refactor.

---

## Extra credit (if easy)

- [ ] Small refactors for clarity (naming, file splits).
- [ ] Call out duplication to consolidate.
- [ ] Second rule (`old_instance`) implemented cleanly on the new contract.
- [ ] Outline S3 scanner + first rule using the same pattern (plan only or spike).

---

## Review mode (for Cursor / humans)

Act as a senior engineer reviewing for:

- Architecture correctness  
- Schema consistency  
- Scalability  
- Code cleanliness  

**Do not rewrite everything** — fix inconsistencies and improve structure incrementally.

---

## Optional follow-ups (not blocking)

- [ ] Add **second rule cleanly** (`old_instance`) on the new Finding format.
- [ ] **S3:** scanner + first rule using the same system.
