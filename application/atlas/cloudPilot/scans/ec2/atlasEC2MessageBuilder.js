/*
//GOAL: This is where we create messages for the user. We could ask Open AI to do this but we just do them ourselves here. 

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
        return "I found 1 thing worth looking at on your EC2 instances (" + region + "). Open the Dashboard to see what's wrong and what you can do.";
    }

    return "I found " + findingCount + " things worth looking at on your EC2 instances (" + region + "). Open the Dashboard to see what's wrong and what you can do.";
}

module.exports = {
    buildEC2ScanMessage
};
