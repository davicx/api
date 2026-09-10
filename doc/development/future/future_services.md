# Future services — integrations (post-MVP)

**Status:** Deferred — not MVP scope  
**Last updated:** 2026-09-05  

> Canonical MVP stays **EC2 + S3** only: [feature_mvp.md](../feature_mvp.md).  
> Do not expand CloudPilot into these integrations until the MVP demo loop is reliable.

These are **adjacent product surfaces** (where engineers already work), not additional AWS resource types.

---

## Priority order

| Order  | Service                             | Why it matters to CloudPilot                                         |
| ------ | ----------------------------------- | -------------------------------------------------------------------- |
| **1**  | **Slack**                           | Bring CloudPilot to where engineers already communicate              |
| **2**  | **Jira**                            | Turn findings/problems into trackable work                           |
| **3**  | **GitHub**                          | Connect infrastructure findings to IaC, PRs, deployments and changes |
| **4**  | **Datadog**                         | Give CloudPilot much better operational/observability context        |
| **5**  | **PagerDuty**                       | Connect incidents to infrastructure diagnosis and response           |
| **6**  | **Confluence**                      | Give CloudPilot company-specific infrastructure knowledge/runbooks   |
| **7**  | **Splunk**                          | Expand troubleshooting through logs/security/operational data        |
| **8**  | **Microsoft Teams**                 | Similar value to Slack, important for larger enterprises             |
| **9**  | **ServiceNow**                      | Very valuable once you're selling into larger enterprises            |
| **10** | **Terraform Cloud / HCP Terraform** | Deeper infrastructure-change workflow                                |

---

## Related

- GitHub PR demo (prebuilt / deferred): [feature_github_pull_requests.md](./feature_github_pull_requests.md)
- Future index: [future.md](./future.md)
