/*
Vocabulary: Action = what CloudPilot does | Mode = how CloudPilot delivers it |
Capability = implementation | Handler = orchestration

User → Action → Mode → Handler → Capability → Atlas → AWS

Mode reply (1–4) is parsed here (STEP 3). Routed in decideNextStep.handleExecutionModeSelection (STEP 4).
Future strategies 1–3: change/strategies/ (STEP 7). Automatic (4): confirmation → STEP 6 handler → capability → Atlas.
Request templates: conversation/CloudPilotMessage.js
*/

const EXECUTION_MODES = {
    '1': 'instructions',
    '2': 'cli',
    '3': 'pr',
    '4': 'automatic'
};

// Exact whole-message confirms (existing path — reply = 'confirm')
const CONFIRM_MESSAGES = [
    'yes',
    'yeah',
    'yep',
    'yup',
    'confirm',
    'run it',
    'do it',
    'proceed',
    'execute',
    'go ahead',
    'sure'
];

// Natural confirmation of the open request ("that" / "it" / yes + proceed)
const CONFIRM_PATTERNS = [
    /^(yes|yeah|yep|yup|sure)[\s,]+(please\s+)?(run|do|execute|proceed|go\s+ahead)\b/,
    /^(please\s+)?can you\s+(please\s+)?(run|do|execute)\s+(it|that|this)\b/,
    /^(please\s+)?(run|do|execute)\s+(it|that|this)\b/,
    /^(please\s+)?go ahead(\s+and\b.*)?$/
];

const DECLINE_MESSAGES = [
    'no',
    'nope',
    'no thanks',
    'no thank you'
];

const CANCEL_PHRASES = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];

const SearchLogs = require('./helpers/searchLogs');

function looksLikeConfirmReply(normalized) {
    if (!normalized) {
        return false;
    }

    if (CONFIRM_MESSAGES.indexOf(normalized) !== -1) {
        return true;
    }

    for (let i = 0; i < CONFIRM_PATTERNS.length; i++) {
        if (CONFIRM_PATTERNS[i].test(normalized)) {
            return true;
        }
    }

    return false;
}

//Function A1: Find confirm, cancel, or execution mode in the message
function searchMessageForReply(message) {
    const normalized = String(message || '').toLowerCase().trim().replace(/[.!?]+$/g, '');

    let result = null;

    if (normalized) {
        if (Object.prototype.hasOwnProperty.call(EXECUTION_MODES, normalized)) {
            result = EXECUTION_MODES[normalized];
        } else {
            for (let i = 0; i < CANCEL_PHRASES.length; i++) {
                const phrase = CANCEL_PHRASES[i];
                if (normalized === phrase || normalized.includes(phrase)) {
                    result = 'cancel';
                    break;
                }
            }

            if (result === null && looksLikeConfirmReply(normalized)) {
                result = 'confirm';
            }

            if (result === null && DECLINE_MESSAGES.includes(normalized)) {
                result = 'decline';
            }
        }
    }

    SearchLogs.recordSearch({
        name: 'Reply',
        method: 'Internal',
        result: result
    });

    return result;
}

module.exports = { searchMessageForReply };
