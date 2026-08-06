const actionMap = require('../../../cloudPilot/actionMap');
const SearchLogs = require('./helpers/searchLogs');

/*
FUNCTIONS A: Action detection from user message (rules / registry)
    1) Function A1: searchMessageForAction

Actions = do something (scan_ec2, toggle_ec2, …).
AI spend is a Question (searchForAiSpend via searchMessageForQuestion) — not an action.
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

    let outcome;

    if (matches.length > 1) {
        outcome = {
            action: null,
            ambiguous: true,
            candidates: matches.slice(),
            source: 'rules',
            confidence: 1.0
        };
    } else if (matches.length === 1) {
        outcome = {
            action: matches[0],
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    } else {
        outcome = {
            action: 'general_chat',
            ambiguous: false,
            candidates: [],
            source: 'rules',
            confidence: 1.0
        };
    }

    SearchLogs.recordSearch({
        name: 'Action',
        method: 'Internal',
        result: formatActionSearchResult(outcome)
    });

    return outcome;
}

function formatActionSearchResult(outcome) {
    if (!outcome) {
        return null;
    }

    if (outcome.ambiguous) {
        return 'ambiguous: ' + (outcome.candidates || []).join(', ');
    }

    const actionType = outcome.action;

    if (!actionType || actionType === 'general_chat') {
        return 'general_chat';
    }

    const definition = actionMap[actionType];

    if (definition && definition.actionLabel) {
        return definition.actionLabel;
    }

    return actionType;
}

module.exports = { searchMessageForAction };
