const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Delete EC2 — thin Atlas POST /ec2/delete (placeholder — handler still uses atlasEC2Functions)
    1) Function A1: deleteEC2
*/

//Function A1: Delete EC2
async function deleteEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/delete', requestBody);
}

module.exports = { deleteEC2 };
