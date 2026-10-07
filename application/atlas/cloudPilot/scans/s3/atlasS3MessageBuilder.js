/*
FUNCTIONS A: Atlas S3 Message Builder Functions
    1) Function A1: Build S3 Scan Message
    2) Function A2: Build S3 Inventory Message (Information Request)
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

//Function A2: Build S3 Inventory Message (get_s3_inventory — grounded in Fulfill result)
function buildS3InventoryMessage(formattedAtlas) {
    var buckets = [];

    if (formattedAtlas && Array.isArray(formattedAtlas.buckets)) {
        buckets = formattedAtlas.buckets;
    }

    var count = buckets.length;

    if (count === 0) {
        return "I don't see any S3 buckets in this account.";
    }

    var lines = [];

    if (count === 1) {
        lines.push("You have 1 S3 bucket:");
    } else {
        lines.push("You have " + count + " S3 buckets:");
    }

    for (var i = 0; i < buckets.length; i++) {
        var bucket = buckets[i] || {};
        var name = bucket.bucketName || bucket.name || "bucket";
        var line = "- " + name;

        if (bucket.region) {
            line += " (" + bucket.region + ")";
        }

        lines.push(line);
    }

    return lines.join("\n");
}

module.exports = {
    buildS3ScanMessage,
    buildS3InventoryMessage
};
