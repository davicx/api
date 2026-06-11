/*
FUNCTIONS A: EC2 instance ID extraction from user message
    1) Function A1: searchMessageForInstanceId
*/

//Function A1: Find EC2 instance IDs in the message
function searchMessageForInstanceId(message) {
    const text = String(message || '');
    const matches = [];

    const regex = /\b(i-[0-9a-f]{8,17})\b/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push(String(match[1]).toLowerCase());
    }

    if (matches.length === 0) {
        return {};
    }

    if (matches.length === 1) {
        return { instance_id: matches[0] };
    }

    return {
        primary_instance_id: matches[0],
        secondary_instance_id: matches[1]
    };
}

module.exports = { searchMessageForInstanceId };
