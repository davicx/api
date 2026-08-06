const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: Tag update phrase extraction
    1) Function A1: searchMessageForTagUpdate
*/

//Function A1: "Update CloudPilot-Test to B" / "Update tag CloudPilot-Test to B"
function searchMessageForTagUpdate(message) {
    const text = String(message || '').trim();
    let result = {};

    if (text) {
        const match = text.match(/^update\s+(?:tag\s+)?(\S+)\s+to\s+(.+)$/i);

        if (match) {
            const tagKey = String(match[1] || '').trim().replace(/^["']|["']$/g, '');
            const tagValue = String(match[2] || '').trim().replace(/^["']|["']$/g, '');

            if (tagKey && tagValue) {
                result = {
                    tag_key: tagKey,
                    tag_value: tagValue
                };
            }
        }
    }

    SearchLogs.recordSearch({
        name: 'Tag Update',
        method: 'Internal',
        result: Object.keys(result).length > 0 ? result : null
    });

    return result;
}

module.exports = { searchMessageForTagUpdate };
