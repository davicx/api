const navigatorResponseFunctions = require('../../../navigator/functions/navigatorFunctions');

/*
 
FUNCTIONS A: All Functions Related to EC2 Scan Navigator Data
	1) Function A1: Build EC2 Scan Navigator Data
	2) Function A2: Build EC2 Scan Navigator Response

FUNCTIONS B: All EC2 Scan Navigator Table Helper Functions
	1) Function B1: Build EC2 Instances Table
	2) Function B2: Build EC2 Instance Row
	3) Function B3: Build EC2 Findings Table
	4) Function B4: Build EC2 Finding Row
	5) Function B5: Build EC2 Row ID
 
*/

//FUNCTIONS A: All Functions Related to EC2 Scan Navigator Data
//Function A1: Build EC2 Scan Navigator Data
function buildEC2ScanNavigatorData(formattedAtlas, options = {}) {
    const summary = formattedAtlas && formattedAtlas.summary ? formattedAtlas.summary : {};
    const instances = formattedAtlas && Array.isArray(formattedAtlas.instances) ? formattedAtlas.instances : [];
    const findings = formattedAtlas && Array.isArray(formattedAtlas.findings) ? formattedAtlas.findings : [];
    const navigatorData = navigatorResponseFunctions.createEmptyNavigatorData();

    navigatorData.meta = {
        region: summary.region || null,
        resourcesScanned: summary.resourcesScanned || instances.length,
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
        buildEC2InstancesTable(instances),
        buildEC2FindingsTable(findings)
    ];

    navigatorData.raw =
        options.includeRaw === true
            ? (options.raw || null)
            : null;

    return navigatorData;
}

//Function A2: Build EC2 Scan Navigator Response
function buildEC2ScanNavigatorResponse(formattedAtlas, options = {}) {
    return navigatorResponseFunctions.createNavigatorResponse({
        success: options.success === true,
        message: options.message || "",
        statusCode: options.statusCode || 200,
        errors: Array.isArray(options.errors) ? options.errors : [],
        currentUser: options.currentUser || null,
        data: buildEC2ScanNavigatorData(formattedAtlas, options)
    });
}

//FUNCTIONS B: All EC2 Scan Navigator Table Helper Functions
//Function B1: Build EC2 Instances Table
function buildEC2InstancesTable(instances) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: "ec2_instances",
        title: "EC2 Instances",
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "name", label: "Name", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "instance_id", label: "Instance ID", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "region", label: "Region", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "instance_type", label: "Type", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "state", label: "State", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "avg_cpu", label: "Avg CPU", type: "number" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "role", label: "Role", type: "text" })
        ],
        rows: instances.map(buildEC2InstanceRow)
    });
}

//Function B2: Build EC2 Instance Row
function buildEC2InstanceRow(instance) {
    return {
        row_id: buildEC2RowID(instance.instanceID, instance.name, instance.region),
        name: instance.name || null,
        instance_id: instance.instanceID || null,
        region: instance.region || null,
        instance_type: instance.instanceType || null,
        state: instance.state || null,
        avg_cpu: instance.avgCPU,
        role: instance.role || null,
        environment_name: instance.environmentName || null
    };
}

//Function B3: Build EC2 Findings Table
function buildEC2FindingsTable(findings) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: "ec2_findings",
        title: "EC2 Findings",
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "title", label: "Finding", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "severity", label: "Severity", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "status", label: "Status", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "resource_name", label: "Resource", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "resource_id", label: "Resource ID", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "avg_cpu", label: "Avg CPU", type: "number" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "estimated_monthly_savings", label: "Monthly Savings", type: "currency" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "recommendation_action", label: "Recommendation", type: "text" })
        ],
        rows: findings.map(buildEC2FindingRow)
    });
}

//Function B4: Build EC2 Finding Row
function buildEC2FindingRow(finding) {
    return {
        row_id: buildEC2RowID(finding.findingID, finding.resourceID, finding.region),
        title: finding.title || null,
        severity: finding.severity || null,
        status: finding.status || null,
        resource_name: finding.resourceName || null,
        resource_id: finding.resourceID || null,
        avg_cpu: finding.avgCPU,
        estimated_monthly_savings: finding.estimatedMonthlySavings,
        recommendation_action: finding.recommendationAction || null,
        recommendation: finding.recommendation || null,
        risk: finding.risk || null,
        remediation_available: finding.remediationAvailable === true,
        issue_code: finding.issueCode || null,
        category: finding.category || null
    };
}

//Function B5: Build EC2 Row ID
function buildEC2RowID(primaryID, secondaryID, region) {
    if (primaryID) {
        return primaryID;
    }

    return [
        secondaryID,
        region
    ].filter(Boolean).join(":");
}

module.exports = {
    buildEC2ScanNavigatorData,
    buildEC2ScanNavigatorResponse
};
