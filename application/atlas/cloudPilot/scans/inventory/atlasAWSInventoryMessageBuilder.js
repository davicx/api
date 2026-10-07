/*
//GOAL: This is where we create messages for the user. We could ask Open AI to do this but we just do them ourselves here. 

FUNCTIONS A: Atlas Message Builder Functions
    1) Function A1: Build AWS Inventory Message
*/

//FUNCTIONS A: Atlas Message Builder
//Function A1: Build AWS Inventory Message
function buildAWSInventoryMessage(formattedAtlas) {
    var summary = {};
    var items = [];

    if (formattedAtlas && formattedAtlas.summary) {
        summary = formattedAtlas.summary;
    }

    if (formattedAtlas && Array.isArray(formattedAtlas.items)) {
        items = formattedAtlas.items;
    }

    var region = summary.region || "the selected region";
    var resourceCount = items.length;
    var serviceSummary = buildServiceSummary(summary.serviceCounts || {});

    if (resourceCount === 0) {
        return "I checked your AWS resources in " + region + ". I did not find any resources to add to your dashboard.";
    }

    if (resourceCount === 1) {
        return "Great, I found " + (serviceSummary || "1 AWS resource") + " in " + region + " and added it to your dashboard.";
    }

    return "Great, I found " + (serviceSummary || resourceCount + " AWS resources") + " in " + region + " and added them to your dashboard.";
}

function buildServiceSummary(serviceCounts) {
    var parts = [];

    Object.keys(serviceCounts).forEach((service) => {
        var count = serviceCounts[service];

        if (!count) {
            return;
        }

        parts.push(formatServiceCount(service, count));
    });

    if (parts.length === 0) {
        return "";
    }

    if (parts.length === 1) {
        return parts[0];
    }

    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
}

function formatServiceCount(service, count) {
    var serviceLabels = {
        ec2: ["EC2 instance", "EC2 instances"],
        s3: ["S3 bucket", "S3 buckets"]
    };

    var labels = serviceLabels[service] || [service.toUpperCase() + " resource", service.toUpperCase() + " resources"];
    var label = count === 1 ? labels[0] : labels[1];

    return count + " " + label;
}

module.exports = {
    buildAWSInventoryMessage
};
