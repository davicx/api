/*
FUNCTIONS A: Atlas Data Formatting Functions
    1) Function A1: Format Atlas EC2 Output
*/

//FUNCTIONS A: Atlas Data Formatting
//Function A1: Format Atlas EC2 Output
function formatAtlasEC2Output(atlasResponse) {

    //STEP 1: Safety checks
    const atlasData = atlasResponse?.data || {};

    const instances = atlasData.instances || [];
    const findings = atlasData.findings || [];

    //STEP 2: Build summary
    const summary = {
        resourcesScanned: atlasData.resourcesScanned || 0,
        findingCount: atlasData.findingCount || 0,
        scanType: atlasData.scanType || null,
        region: atlasData.region || null
    };

    //STEP 3: Simplify instances
    const formattedInstances = instances.map((instance) => {

        return {
            instanceID: instance.instance_id || null,
            name: instance.name || null,
            state: instance.state || null,
            instanceType: instance.instance_type || null,
            avgCPU: instance.avg_cpu || null,
            region: instance.region || null,

            role: instance.tags?.["cloudpilot-role"] || null,

            environmentName:
                instance.tags?.["elasticbeanstalk:environment-name"] || null
        };
    });

    //STEP 4: Simplify findings
    const formattedFindings = findings.map((finding) => {

        return {
            findingID: finding.id || null,

            service: finding.service || null,
            provider: finding.provider || null,
            region: finding.region || null,

            resourceID: finding.resource?.id || null,
            resourceName: finding.resource?.name || null,
            resourceType: finding.resource?.instance_type || null,

            issueCode: finding.issue?.code || null,
            title: finding.issue?.title || null,
            description: finding.issue?.description || null,

            severity: finding.issue?.severity || null,
            confidence: finding.issue?.confidence || null,
            category: finding.issue?.category || null,

            status: finding.status || null,
            priority: finding.priority || null,

            avgCPU: finding.metrics?.avg_cpu || null,

            recommendationAction:
                finding.recommendation?.action || null,

            recommendation:
                finding.recommendation?.description || null,

            risk:
                finding.recommendation?.risk || null,

            remediationAvailable:
                finding.remediation?.available || false,

            estimatedMonthlySavings:
                finding.cost?.estimated_monthly_savings || 0,

            currency:
                finding.cost?.currency || "USD",

            summary:
                finding.summary || null,

            ruleID:
                finding.metadata?.rule_id || null
        };
    });

    //STEP 5: Final formatted output
    return {
        summary,
        instances: formattedInstances,
        findings: formattedFindings
    };
}

module.exports = {
    formatAtlasEC2Output
};
