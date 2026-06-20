
/*
//GOAL: Take raw data from atlas and format it so it is easier to display
FUNCTIONS A: Atlas Data Formatting Functions
    1) Function A1: Format Atlas AWS Inventory Output
*/

//FUNCTIONS A: Atlas Data Formatting
//Function A1: Format Atlas AWS Inventory Output
function formatAtlasAWSInventoryOutput(atlasResponse) {

    //STEP 1: Safety checks
    const atlasData = atlasResponse?.data || {};

    const items = atlasData.items || [];
    const services = atlasData.services || [];
    const serviceCounts = {};

    items.forEach((item) => {
        const service = item.service || "unknown";
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    //STEP 2: Build summary
    const summary = {
        resourceCount: items.length,
        region: atlasData.region || null,
        services: services,
        serviceCounts: serviceCounts
    };

    //STEP 3: Simplify inventory items
    const formattedItems = items.map((item) => {

        return {
            service: item.service || null,
            resourceID: item.id || null,
            resourceName: item.name || null,
            region: item.region || null,
            resourceType: item.type || null,
            state: item.state || null,
            estimatedMonthlyCost: item.cost_estimate_monthly_usd || null,
            currency: "USD"
        };
    });

    //STEP 4: Final formatted output
    return {
        summary,
        items: formattedItems
    };
}

module.exports = {
    formatAtlasAWSInventoryOutput
};
