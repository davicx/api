const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Create EC2 — thin Atlas POST /ec2/create (placeholder — handler still uses atlasEC2Functions)
    1) Function A1: createEC2
*/

//Function A1: Create EC2
async function createEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/create', requestBody);
}

module.exports = { createEC2 };
