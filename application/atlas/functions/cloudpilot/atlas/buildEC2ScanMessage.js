/*
FUNCTIONS A: Atlas Message Builder Functions
    1) Function A1: Build EC2 Scan Message
*/

//FUNCTIONS A: Atlas Message Builder
//Function A1: Build EC2 Scan Message
function buildEC2ScanMessage(formattedAtlas) {
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
        return "EC2 scan completed for " + region + ". No findings detected.";
    }

    if (findingCount === 1) {
        var finding = findings[0] || {};
        var resourceName = finding.resourceName || finding.resourceID || "one resource";
        var title = finding.title || "an infrastructure finding";

        return "I found 1 EC2 finding in " + region + ". " + resourceName + " has " + String(title).toLowerCase() + ".";
    }

    var firstFinding = findings[0] || {};
    var firstFindingTitle = firstFinding.title || "infrastructure findings";

    return "I found " + findingCount + " EC2 findings in " + region + ", including " + String(firstFindingTitle).toLowerCase() + ".";
}

module.exports = {
    buildEC2ScanMessage
};
