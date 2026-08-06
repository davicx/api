const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: EC2 instance type extraction from user message
    1) Function A1: searchMessageForInstanceType
*/

//Function A1: Find an EC2 instance type in the message
function searchMessageForInstanceType(message) {
    const text = String(message || '');
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);

    const result = match ? { instance_type: String(match[0]).toLowerCase() } : {};

    SearchLogs.recordSearch({
        name: 'Instance Type',
        method: 'Internal',
        result: result.instance_type || null
    });

    return result;
}

module.exports = { searchMessageForInstanceType };
