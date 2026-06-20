const navigatorResponseFunctions = require('../../../navigator/functions/navigatorFunctions');

function buildS3ScanNavigatorData(formattedAtlas, options = {}) {
    const summary = formattedAtlas && formattedAtlas.summary ? formattedAtlas.summary : {};
    const buckets = formattedAtlas && Array.isArray(formattedAtlas.buckets) ? formattedAtlas.buckets : [];
    const findings = formattedAtlas && Array.isArray(formattedAtlas.findings) ? formattedAtlas.findings : [];
    const navigatorData = navigatorResponseFunctions.createEmptyNavigatorData();

    navigatorData.meta = {
        region: summary.region || null,
        resourcesScanned: summary.resourcesScanned || buckets.length,
        findingCount: summary.findingCount || findings.length,
        scanType: summary.scanType || null
    };

    navigatorData.stats = [
        { id: "resources_scanned", label: "Resources Scanned", value: navigatorData.meta.resourcesScanned, type: "number" },
        { id: "findings", label: "Findings", value: navigatorData.meta.findingCount, type: "number" },
        { id: "scan_type", label: "Scan Type", value: navigatorData.meta.scanType, type: "text" },
        { id: "region", label: "Region", value: navigatorData.meta.region, type: "text" }
    ];

    navigatorData.tables = [
        buildS3BucketsTable(buckets),
        buildS3FindingsTable(findings)
    ];

    navigatorData.raw =
        options.includeRaw === true
            ? (options.raw || null)
            : null;

    return navigatorData;
}

function buildS3ScanNavigatorResponse(formattedAtlas, options = {}) {
    return navigatorResponseFunctions.createNavigatorResponse({
        success: options.success === true,
        message: options.message || "",
        statusCode: options.statusCode || 200,
        errors: Array.isArray(options.errors) ? options.errors : [],
        currentUser: options.currentUser || null,
        data: buildS3ScanNavigatorData(formattedAtlas, options)
    });
}

function buildS3BucketsTable(buckets) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: "s3_buckets",
        title: "S3 Buckets",
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "name", label: "Bucket", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "region", label: "Region", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "encryption_enabled", label: "Encryption", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "lifecycle_configured", label: "Lifecycle", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "public_access_block", label: "Public Block", type: "status" })
        ],
        rows: buckets.map(buildS3BucketRow)
    });
}

function buildS3BucketRow(bucket) {
    return {
        row_id: buildS3RowID(bucket.bucketName, bucket.region),
        name: bucket.name || null,
        region: bucket.region || null,
        encryption_enabled: bucket.defaultEncryptionEnabled === true ? "enabled" : "disabled",
        lifecycle_configured: bucket.hasLifecycleRules === true ? "yes" : "no",
        public_access_block: bucket.publicAccessBlockConfigured === true ? "enabled" : "disabled"
    };
}

function buildS3FindingsTable(findings) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: "s3_findings",
        title: "S3 Findings",
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "title", label: "Finding", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "severity", label: "Severity", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "status", label: "Status", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "resource_name", label: "Bucket", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "category", label: "Category", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "recommendation_action", label: "Recommendation", type: "text" })
        ],
        rows: findings.map(buildS3FindingRow)
    });
}

function buildS3FindingRow(finding) {
    return {
        row_id: buildS3RowID(finding.findingID, finding.resourceID),
        title: finding.title || null,
        severity: finding.severity || null,
        status: finding.status || null,
        resource_name: finding.resourceName || null,
        resource_id: finding.resourceID || null,
        category: finding.category || null,
        recommendation_action: finding.recommendationAction || null,
        recommendation: finding.recommendation || null,
        risk: finding.risk || null,
        issue_code: finding.issueCode || null,
        rule_id: finding.ruleID || null
    };
}

function buildS3RowID(primaryID, secondaryID) {
    if (primaryID) {
        return primaryID;
    }

    return String(secondaryID || "s3-row");
}

module.exports = {
    buildS3ScanNavigatorData,
    buildS3ScanNavigatorResponse
};
