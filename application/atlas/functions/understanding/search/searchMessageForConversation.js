/*
FUNCTIONS A: Conversation intent extraction from user message (status / list / focus)
    1) Function A1: searchMessageForConversation
*/

const LIST_OPEN_PHRASES = [
    'show open actions',
    'show my open actions',
    'list open actions',
    'list my actions',
    'what am i waiting on',
    'what are my open actions',
    'open actions',
    'my open actions'
];

const STATUS_PHRASES = [
    'what is the status',
    'whats the status',
    "what's the status",
    'show status',
    'request status',
    'current status',
    'where are we',
    'what step are we on',
    'what am i missing',
    'what am i still missing',
    "what's missing",
    'whats missing',
    'what do you still need',
    'what do you need from me',
    'what fields do you need'
];

//Function A1: Find status, list, or focus conversation intents in the message
function searchMessageForConversation(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text) {
        return null;
    }

    for (let i = 0; i < LIST_OPEN_PHRASES.length; i++) {
        const phrase = LIST_OPEN_PHRASES[i];
        if (text === phrase || text.includes(phrase)) {
            return 'list_open';
        }
    }

    for (let i = 0; i < STATUS_PHRASES.length; i++) {
        const phrase = STATUS_PHRASES[i];
        if (text === phrase || text.includes(phrase)) {
            return 'status';
        }
    }

    if (/^(?:switch to|focus on|work on|use|select|run)\s*#?\d+$/i.test(text)) {
        return 'focus_switch';
    }

    if (/^(?:switch to|focus on|work on|use|select)\s+\S+/i.test(text)) {
        return 'focus_switch';
    }

    return null;
}

module.exports = { searchMessageForConversation };
