/*
//GOAL: This is where we create messages for the user. We could ask Open AI to do this but we just do them ourselves here. 

FUNCTIONS A: Atlas Message Builder Functions
    1) Function A1: Build EC2 Scan Message
    2) Function A2: Build EC2 Inventory Message (Information Request)
*/

//FUNCTIONS A: Atlas Message Builder
//Function A1: Build EC2 Scan Message (explicit scan_ec2 capability)
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

//Function A2: Build EC2 Inventory Message (get_ec2_inventory — grounded in Fulfill result)
function buildEC2InventoryMessage(formattedAtlas) {
    var summary = {};
    var instances = [];

    if (formattedAtlas && formattedAtlas.summary) {
        summary = formattedAtlas.summary;
    }

    if (formattedAtlas && Array.isArray(formattedAtlas.instances)) {
        instances = formattedAtlas.instances;
    }

    var region = summary.region || "the selected region";
    var count = instances.length;

    if (count === 0) {
        return "I don't see any EC2 instances in " + region + ".";
    }

    var lines = [];

    if (count === 1) {
        lines.push("You have 1 EC2 instance in " + region + ":");
    } else {
        lines.push("You have " + count + " EC2 instances in " + region + ":");
    }

    for (var i = 0; i < instances.length; i++) {
        var instance = instances[i] || {};
        var label = instance.name || instance.instanceID || "instance";
        var parts = ["- " + label];

        if (instance.instanceID && instance.name) {
            parts[0] = "- " + instance.name + " (" + instance.instanceID + ")";
        } else if (instance.instanceID) {
            parts[0] = "- " + instance.instanceID;
        }

        if (instance.state) {
            parts.push(String(instance.state));
        }

        if (instance.instanceType) {
            parts.push(String(instance.instanceType));
        }

        lines.push(parts.join(" — "));
    }

    return lines.join("\n");
}

module.exports = {
    buildEC2ScanMessage,
    buildEC2InventoryMessage
};
