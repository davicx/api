/*
FUNCTIONS A: Reply extraction from user message (confirm / cancel / execution mode)
    1) Function A1: searchMessageForReply
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

//Function A1: Find confirm, cancel, or execution mode in the message
function searchMessageForReply(message) {
    const normalized = String(message || '').toLowerCase().trim().replace(/[.!?]+$/g, '');

    if (!normalized) {
        return null;
    }

    if (Object.prototype.hasOwnProperty.call(EXECUTION_MODES, normalized)) {
        return EXECUTION_MODES[normalized];
    }

    for (let i = 0; i < CANCEL_PHRASES.length; i++) {
        const phrase = CANCEL_PHRASES[i];
        if (normalized === phrase || normalized.includes(phrase)) {
            return 'cancel';
        }
    }

    if (CONFIRM_MESSAGES.includes(normalized)) {
        return 'confirm';
    }

    return null;
}

module.exports = { searchMessageForReply };
