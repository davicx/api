from typing import Any, Callable, Iterable, List

from core.models.finding import Finding


RuleFn = Callable[[dict], Finding | None]


def run_rules(items: Iterable[dict], rules: Iterable[RuleFn]) -> List[Finding]:
    findings: List[Finding] = []

    for item in items:
        for rule in rules:
            result = rule(item)
            if result is not None:
                findings.append(result)

    return findings

