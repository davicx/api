const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: EC2 changes — thin Atlas POST /ec2/*
    1) Function A1: toggleEC2
    2) Function A2: createEC2
    3) Function A3: deleteEC2
*/

//Function A1: Toggle EC2 (Atlas /ec2/toggle)
async function toggleEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/toggle', requestBody);
}

//Function A2: Create EC2 (Atlas /ec2/create)
async function createEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/create', requestBody);
}

//Function A3: Delete EC2 (Atlas /ec2/delete)
async function deleteEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/delete', requestBody);
}

module.exports = { toggleEC2, createEC2, deleteEC2 };
