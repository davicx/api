def build_explanation_prompt(finding):
    r = finding.resource
    issue = finding.issue
    metrics = finding.metrics
    rec = finding.recommendation
    cost = finding.cost
    return f"""
You are a senior cloud engineer helping a developer understand a cloud optimization finding.

Explain the issue clearly and briefly.

Service: {finding.service}
Region: {finding.region}
Resource id: {r.get("id")}
Resource name: {r.get("name")}
Instance type: {r.get("instance_type")}
Issue code: {issue.get("code")}
Issue: {issue.get("title")}
Details: {issue.get("description", "")}
Metrics (JSON): {metrics}
Recommended action: {rec.get("action")}
Recommendation: {rec.get("description")}
Estimated monthly savings: {cost.get("estimated_monthly_savings")}
Currency: {cost.get("currency", "USD")}
Savings note (if any): {cost.get("savings_note", "")}
Summary: {finding.summary}

Rules:
- Be concise (3–4 sentences)
- Do NOT invent AWS information
- Only explain the provided data
"""