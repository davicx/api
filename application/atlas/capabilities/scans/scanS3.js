const AtlasPostFunctions = require('../atlas/atlasPost');

/*
FUNCTIONS A: Scan S3 — thin Atlas POST /scan/s3 (placeholder — handler still uses atlasS3Functions)
    1) Function A1: scanS3
*/

//Function A1: Scan S3
async function scanS3(region) {
    return AtlasPostFunctions.atlasPost('/scan/s3', {
        scan_type: 'full',
        region: region,
        rules: []
    });
}

module.exports = { scanS3 };
