import os

from openai import OpenAI

from config.config import AI_MAX_OUTPUT_TOKENS, DEFAULT_MODEL
from core.models.finding import Finding

from .prompts import build_explanation_prompt


def simple_test():
    """
    Minimal OpenAI API connectivity test. Uses DEFAULT_MODEL; output capped by AI_MAX_OUTPUT_TOKENS.
    """
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[{"role": "user", "content": "Respond in 1 short sentence. No explanation."}],
        max_tokens=AI_MAX_OUTPUT_TOKENS,
    )
    return response.choices[0].message.content.strip()

'''
FUNCTIONS A: All Functions Related API interaction
	1) Function A1: Explain Finding (real API)
	2) Function A2: Mock Explain Finding (no API call)

'''
def mock_explain_finding(finding: Finding) -> str:
    """
    Return a mock AI explanation for development/testing.
    No API calls are made.
    """
    r = finding.resource
    m = finding.metrics
    c = finding.cost
    rec = finding.recommendation.get("description", "")
    name = r.get("name") or r.get("id", "instance")
    avg_cpu = m.get("avg_cpu")

    if avg_cpu is not None:
        explanation = (
            f"This EC2 instance ({name}) is running as {r.get('instance_type')} "
            f"with ~{avg_cpu}% average CPU.\n\n{rec}"
        )
        note = c.get("savings_note")
        savings = c.get("estimated_monthly_savings")
        if note:
            explanation += f"\n\n{note}"
        elif savings is not None and savings > 0:
            explanation += f"\n\nEstimated savings: about ${savings}/month ({c.get('currency', 'USD')})."
        else:
            explanation += (
                "\n\nAdditional downsizing options may be limited for this instance type."
            )
        return explanation

    return f"{finding.summary}\n\n{rec}"


def explain_finding(finding: Finding) -> str:
    """
    Generate a short AI explanation for a CloudPilot finding (calls OpenAI API).
    Requires OPENAI_API_KEY. Output capped by AI_MAX_OUTPUT_TOKENS.
    """
    prompt = build_explanation_prompt(finding)

    try:
        client = OpenAI()
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful cloud infrastructure expert."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=AI_MAX_OUTPUT_TOKENS,
            temperature=0.2,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"[AI explanation unavailable: {e}]"


'''
from openai import OpenAI
from core.models.finding import Finding
from .prompts import build_explanation_prompt

"""
FUNCTIONS A: All Functions Related API interaction
    1) Function A1: Explain Finding (real API)
    2) Function A2: Mock Explain Finding (no API call)
    3) Function A3: Explain Finding With Cache
"""

# simple in-memory cache
_EXPLANATION_CACHE = {}

client = OpenAI()


def _build_cache_key(finding: Finding) -> str:
    """Create a simplified key representing this issue."""
    return f"{finding.service}:{finding.issue}:{finding.instance_type}"


def mock_explain_finding(finding: Finding) -> str:
    """
    Return a mock AI explanation for development/testing.
    No API calls are made.
    """

    explanation = (
        f"This EC2 instance ({finding.name}) is currently running as a "
        f"{finding.instance_type} and has averaged only {finding.avg_cpu}% CPU "
        f"usage over the past monitoring period. This indicates the instance "
        f"may be significantly underutilized.\n\n"
        f"{finding.recommendation}. If the workload is consistently light, "
        f"downsizing could reduce unnecessary compute costs while maintaining "
        f"adequate performance."
    )

    if finding.estimated_savings > 0:
        explanation += (
            f" This change could save approximately "
            f"${finding.estimated_savings} per month."
        )
    else:
        explanation += (
            " However, additional downsizing options may be limited for "
            "this instance type."
        )

    return explanation


def explain_finding(finding: Finding) -> str:
    """
    Generate a short AI explanation for a CloudPilot finding (calls OpenAI API).
    Requires OPENAI_API_KEY.
    """

    prompt = build_explanation_prompt(finding)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful cloud infrastructure expert."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=120,
            temperature=0.2,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"[AI explanation unavailable: {e}]"


def explain_finding_cached(finding: Finding) -> str:
    """
    Explain a finding but reuse explanations when possible
    to reduce API calls.
    """

    key = _build_cache_key(finding)

    if key in _EXPLANATION_CACHE:
        return _EXPLANATION_CACHE[key]

    explanation = explain_finding(finding)
    _EXPLANATION_CACHE[key] = explanation

    return explanation
'''