const actionMap = require('../../actions/actionMap');

/*
FUNCTIONS A: Action detection from user message (rules / registry)
    1) Function A1: searchMessageForAction
*/

//Function A1: Find an action intent in the message
function searchMessageForAction(message) {
    const normalizedMessage = String(message || '').toLowerCase().trim();
    const matches = [];

    for (const action of Object.values(actionMap)) {
        if (typeof action.match === 'function' && action.match(normalizedMessage)) {
            matches.push(action.type);
        }
    }

    if (matches.length > 1) {
        return {
            action: null,
            ambiguous: true,
            candidates: matches.slice(),
            source: 'rules',
            confidence: 1.0
        };
    }

    if (matches.length === 1) {
        return {
            action: matches[0],
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    }

    return {
        action: 'general_chat',
        ambiguous: false,
        candidates: [],
        source: 'rules',
        confidence: 1.0
    };
}

module.exports = { searchMessageForAction };
