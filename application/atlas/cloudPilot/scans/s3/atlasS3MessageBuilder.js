/*
FUNCTIONS A: Atlas S3 Message Builder Functions
    1) Function A1: Build S3 Scan Message
*/

function buildS3ScanMessage(formattedAtlas) {
    var summary = {};
    var findings = [];

    if (formattedAtlas && formattedAtlas.summary) {
        summary = formattedAtlas.summary;
    }

    if (formattedAtlas && Array.isArray(formattedAtlas.findings)) {
        findings = formattedAtlas.findings;
    }

    var region = summary.region || "the selected region";
    var findingCount = findings.length;

    if (findingCount === 0) {
        return "S3 scan completed for " + region + ". No findings detected.";
    }

    if (findingCount === 1) {
        return "I found 1 thing worth looking at in your S3 buckets (" + region + "). Open the Dashboard to see what's wrong and what you can do.";
    }

    return "I found " + findingCount + " things worth looking at in your S3 buckets (" + region + "). Open the Dashboard to see what's wrong and what you can do.";
}

module.exports = {
    buildS3ScanMessage
};
