const AtlasPostFunctions = require('../client/atlasPost');

async function readS3Versioning(requestBody) {
    return AtlasPostFunctions.atlasPost('/s3/versioning/read', requestBody);
}

async function enableS3Versioning(requestBody) {
    return AtlasPostFunctions.atlasPost('/s3/versioning/enable', requestBody);
}

module.exports = {
    readS3Versioning,
    enableS3Versioning
};
