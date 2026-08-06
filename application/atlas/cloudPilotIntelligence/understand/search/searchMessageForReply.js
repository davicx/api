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

const CONFIRM_MESSAGES = [
    'yes',
    'confirm',
    'run it',
    'do it',
    'proceed',
    'execute'
];

const CANCEL_PHRASES = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];

const SearchLogs = require('./helpers/searchLogs');

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

            if (result === null && CONFIRM_MESSAGES.includes(normalized)) {
                result = 'confirm';
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
