const AtlasPostFunctions = require('../../atlasClient/atlasPost');

/*
FUNCTIONS A: EC2 changes — thin Atlas POST /ec2/*
    1) Function A1: toggleEC2
    2) Function A2: createEC2
    3) Function A3: deleteEC2
    4) Function A4: updateEC2Tag
    5) Function A5: deleteEC2Tag
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

//Function A4: Update one EC2 tag (Atlas /ec2/tag)
async function updateEC2Tag(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/tag', requestBody);
}

//Function A5: Delete one EC2 tag key (Atlas /ec2/tag/delete)
async function deleteEC2Tag(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/tag/delete', requestBody);
}

module.exports = { toggleEC2, createEC2, deleteEC2, updateEC2Tag, deleteEC2Tag };
