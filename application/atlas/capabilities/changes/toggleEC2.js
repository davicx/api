const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Toggle EC2 — thin Atlas POST /ec2/toggle
    1) Function A1: toggleEC2
*/

//Function A1: Toggle EC2
async function toggleEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/toggle', requestBody);
}

module.exports = { toggleEC2 };
