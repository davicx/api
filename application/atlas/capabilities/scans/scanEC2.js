const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Scan EC2 — thin Atlas POST /scan/ec2
    1) Function A1: scanEC2
*/

//Function A1: Scan EC2
async function scanEC2(region) {
    return AtlasPostFunctions.atlasPost('/scan/ec2', {
        scan_type: 'full',
        team: 'cloud-pilot',
        region: region,
        rules: []
    });
}

module.exports = { scanEC2 };
