/*
//GOAL: This is where we call atlas. Atlas interacts and performs AWS Actions
FUNCTIONS A: Atlas Scanner Functions
    1) Function A1: Scan EC2
    2) Function A2: Create EC2
    3) Function A3: Delete EC2
    4) Function A4: Toggle EC2
FUNCTIONS B: Atlas POST (legacy — prefer capabilities/atlas/atlasPost)
    1) Function B1: atlasPost via AtlasPostFunctions
*/

const AtlasPostFunctions = require('../../../capabilities/atlas/atlasPost');
const ScanEC2Functions = require('../../../capabilities/scans/scanEC2');
const ToggleEC2Functions = require('../../../capabilities/changes/toggleEC2');

//FUNCTIONS A: Atlas Scanner
//Function A1: Scan EC2 — legacy shim; prefer capabilities/scans/scanEC2 (C7 removes)
async function scanEC2(region) {
    return ScanEC2Functions.scanEC2(region);
}

//Function A2: Create EC2 (Atlas /ec2/create)
async function createEC2(requestBody) {
    return AtlasPostFunctions.atlasPost("/ec2/create", requestBody);
}

//Function A3: Delete EC2 (Atlas /ec2/delete)
async function deleteEC2(requestBody) {
    return AtlasPostFunctions.atlasPost("/ec2/delete", requestBody);
}

//Function A4: Toggle EC2 — legacy shim; prefer capabilities/changes/toggleEC2 (C7 removes)
async function toggleEC2(requestBody) {
    return ToggleEC2Functions.toggleEC2(requestBody);
}

module.exports = { scanEC2, createEC2, deleteEC2, toggleEC2 };
