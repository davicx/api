const actionRegistry = require('../actions/actionRegistry');

/*
FUNCTIONS A: Action detection from user message (rules / registry)
    1) Function A1: getAction
*/

//Function A1: Detect action type from message (registry match)
function getAction(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim();
    const matches = [];

    for (const action of Object.values(actionRegistry)) {
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

module.exports = { getAction };
