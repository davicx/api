
/*
//GOAL: Take raw data from atlas and format it so it is easier to display
FUNCTIONS A: Atlas S3 Data Formatting Functions
    1) Function A1: Format Atlas S3 Output
*/

//Function A1: Format Atlas S3 Output
function formatAtlasS3Output(atlasResponse) {

    const atlasData = atlasResponse?.data || {};

    const buckets = atlasData.buckets || [];
    const findings = atlasData.findings || [];

    const summary = {
        resourcesScanned: atlasData.resourcesScanned || 0,
        findingCount: atlasData.findingCount || 0,
        scanType: atlasData.scanType || null,
        region: atlasData.region || null
    };

    const formattedBuckets = buckets.map((bucket) => {
        return {
            bucketName: bucket.bucket_name || bucket.name || null,
            name: bucket.name || bucket.bucket_name || null,
            region: bucket.region || null,
            defaultEncryptionEnabled: bucket.default_encryption_enabled === true,
            hasLifecycleRules: bucket.has_lifecycle_rules === true,
            publicAccessBlockConfigured:
                bucket.public_access_block?.configured === true
        };
    });

    const formattedFindings = findings.map((finding) => {
        return {
            findingID: finding.id || null,

            service: finding.service || null,
            provider: finding.provider || null,
            region: finding.region || null,

            resourceID: finding.resource?.id || null,
            resourceName: finding.resource?.name || null,
            resourceType: finding.resource?.type || null,

            issueCode: finding.issue?.code || null,
            title: finding.issue?.title || null,
            description: finding.issue?.description || null,

            severity: finding.issue?.severity || null,
            confidence: finding.issue?.confidence || null,
            category: finding.issue?.category || null,

            status: finding.status || null,
            priority: finding.priority || null,

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

    return {
        summary,
        buckets: formattedBuckets,
        findings: formattedFindings
    };
}

module.exports = {
    formatAtlasS3Output
};
