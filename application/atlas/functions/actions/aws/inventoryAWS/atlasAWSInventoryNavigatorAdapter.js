const navigatorResponseFunctions = require('../../../navigatorResponseFunctions');

/*
 
FUNCTIONS A: All Functions Related to AWS Inventory Navigator Data
	1) Function A1: Build AWS Inventory Navigator Data
	2) Function A2: Build AWS Inventory Navigator Response

FUNCTIONS B: All AWS Inventory Navigator Helper Functions
	1) Function B1: Build AWS Inventory Table
	2) Function B2: Build AWS Inventory Row
	3) Function B3: Build AWS Inventory Row ID
 
*/

//FUNCTIONS A: All Functions Related to AWS Inventory Navigator Data
//Function A1: Build AWS Inventory Navigator Data
function buildAWSInventoryNavigatorData(formattedAtlas) {
    const summary = formattedAtlas && formattedAtlas.summary ? formattedAtlas.summary : {};
    const items = formattedAtlas && Array.isArray(formattedAtlas.items) ? formattedAtlas.items : [];
    const navigatorData = navigatorResponseFunctions.createEmptyNavigatorData();

    navigatorData.meta = {
        region: summary.region || null,
        resourceCount: summary.resourceCount || items.length,
        services: Array.isArray(summary.services) ? summary.services : [],
        serviceCounts: summary.serviceCounts || {}
    };

    navigatorData.tables = [
        buildAWSInventoryTable(items)
    ];

    navigatorData.raw = null;

    return navigatorData;
}

//Function A2: Build AWS Inventory Navigator Response
function buildAWSInventoryNavigatorResponse(formattedAtlas, options = {}) {
    return navigatorResponseFunctions.createNavigatorResponse({
        success: options.success === true,
        message: options.message || "",
        statusCode: options.statusCode || 200,
        errors: Array.isArray(options.errors) ? options.errors : [],
        currentUser: options.currentUser || null,
        data: buildAWSInventoryNavigatorData(formattedAtlas)
    });
}

//FUNCTIONS B: All AWS Inventory Navigator Helper Functions
//Function B1: Build AWS Inventory Table
function buildAWSInventoryTable(items) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: "aws_inventory",
        title: "AWS Inventory",
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "service", label: "Service", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "name", label: "Name", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "region", label: "Region", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "type", label: "Type", type: "text" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "state", label: "State", type: "status" }),
            navigatorResponseFunctions.createNavigatorTableColumn({ key: "cost_estimate_monthly_usd", label: "Monthly Cost", type: "currency" })
        ],
        rows: items.map(buildAWSInventoryRow)
    });
}

//Function B2: Build AWS Inventory Row
function buildAWSInventoryRow(item) {
    return {
        row_id: buildAWSInventoryRowID(item),
        service: item.service || null,
        name: item.resourceName || null,
        region: item.region || null,
        type: item.resourceType || null,
        state: item.state || null,
        cost_estimate_monthly_usd: item.estimatedMonthlyCost
    };
}

//Function B3: Build AWS Inventory Row ID
function buildAWSInventoryRowID(item) {
    if (item.resourceID) {
        return item.resourceID;
    }

    return [
        item.service,
        item.region,
        item.resourceName,
        item.resourceType
    ].filter(Boolean).join(":");
}

module.exports = {
    buildAWSInventoryNavigatorData,
    buildAWSInventoryNavigatorResponse
};
