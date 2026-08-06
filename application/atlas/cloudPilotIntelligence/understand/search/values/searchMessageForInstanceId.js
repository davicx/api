const SearchLogs = require('../helpers/searchLogs');

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

    let result = {};

    if (matches.length === 1) {
        result = { instance_id: matches[0] };
    } else if (matches.length > 1) {
        result = {
            primary_instance_id: matches[0],
            secondary_instance_id: matches[1]
        };
    }

    SearchLogs.recordSearch({
        name: 'Instance ID',
        method: 'Internal',
        result: Object.keys(result).length > 0 ? result : null
    });

    return result;
}

module.exports = { searchMessageForInstanceId };
