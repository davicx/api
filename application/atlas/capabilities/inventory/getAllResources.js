const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Inventory AWS — thin Atlas POST /inventory/aws (placeholder — handler still uses atlasAWSFunctions)
    1) Function A1: getAllResources
*/

//Function A1: Get all AWS resources (inventory)
async function getAllResources(options) {
    const opts = options || {};

    return AtlasPostFunctions.atlasPost('/inventory/aws', {
        region: opts.region || 'us-west-2',
        services: opts.services || ['ec2', 's3']
    });
}

module.exports = { getAllResources };
