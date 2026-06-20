/*
FUNCTIONS A: Structured field extraction from user message
    1) Function A1: searchMessageForStructuredFields
*/

//Function A1: Find field: "value" pairs in the message
function searchMessageForStructuredFields(message) {
    const values = {};
    const text = String(message || '');
    const regex = /(\w+)\s*:\s*"([^"]+)"/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        values[match[1]] = match[2];
    }

    return values;
}

module.exports = { searchMessageForStructuredFields };
