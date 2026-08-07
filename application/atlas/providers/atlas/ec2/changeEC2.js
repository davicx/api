const AtlasPostFunctions = require('../client/atlasPost');

/*
FUNCTIONS A: EC2 changes — thin Atlas POST /ec2/*
    1) Function A1: toggleEC2
    2) Function A2: createEC2
    3) Function A3: deleteEC2
    4) Function A4: updateEC2Tag
    5) Function A5: deleteEC2Tag
    6) Function A6: pauseEC2
    7) Function A7: resumeEC2
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

//Function A6: Pause EC2 (Atlas /ec2/pause → AWS stop)
async function pauseEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/pause', requestBody);
}

//Function A7: Resume EC2 (Atlas /ec2/resume → AWS start)
async function resumeEC2(requestBody) {
    return AtlasPostFunctions.atlasPost('/ec2/resume', requestBody);
}

module.exports = {
    toggleEC2,
    createEC2,
    deleteEC2,
    updateEC2Tag,
    deleteEC2Tag,
    pauseEC2,
    resumeEC2
};
