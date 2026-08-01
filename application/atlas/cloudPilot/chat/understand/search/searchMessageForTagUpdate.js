/*
FUNCTIONS A: Tag update phrase extraction
    1) Function A1: searchMessageForTagUpdate
*/

//Function A1: "Update CloudPilot-Test to B" / "Update tag CloudPilot-Test to B"
function searchMessageForTagUpdate(message) {
    const text = String(message || '').trim();

    if (!text) {
        return {};
    }

    const match = text.match(/^update\s+(?:tag\s+)?(\S+)\s+to\s+(.+)$/i);

    if (!match) {
        return {};
    }

    const tagKey = String(match[1] || '').trim().replace(/^["']|["']$/g, '');
    const tagValue = String(match[2] || '').trim().replace(/^["']|["']$/g, '');

    if (!tagKey || !tagValue) {
        return {};
    }

    return {
        tag_key: tagKey,
        tag_value: tagValue
    };
}

module.exports = { searchMessageForTagUpdate };
