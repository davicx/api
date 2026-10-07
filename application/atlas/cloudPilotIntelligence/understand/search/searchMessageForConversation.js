/*
FUNCTIONS A: Conversation intent extraction from user message (status / list / focus / undo)
    1) Function A1: searchMessageForConversation

Open-requests phrases live in questions/searchForOpenRequests.js (Question path).
*/

const SearchLogs = require('./helpers/searchLogs');

const UNDO_PHRASES = [
    'undo',
    'undo last',
    'undo that',
    'undo last toggle',
    'undo last change'
];

const LIST_HISTORY_PHRASES = [
    'show my history',
    'show my recent history',
    'recent history',
    'change history',
    'what did i change',
    'what did i change recently',
    'show recent changes',
    'recent changes',
    'history'
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

    let result = null;

    if (text) {
        for (let i = 0; i < UNDO_PHRASES.length; i++) {
            const phrase = UNDO_PHRASES[i];
            if (text === phrase || text.includes(phrase)) {
                result = 'undo';
                break;
            }
        }

        if (result === null) {
            for (let i = 0; i < LIST_HISTORY_PHRASES.length; i++) {
                const phrase = LIST_HISTORY_PHRASES[i];
                if (text === phrase || text.includes(phrase)) {
                    result = 'list_history';
                    break;
                }
            }
        }

        if (result === null) {
            for (let i = 0; i < STATUS_PHRASES.length; i++) {
                const phrase = STATUS_PHRASES[i];
                if (text === phrase || text.includes(phrase)) {
                    result = 'status';
                    break;
                }
            }
        }

        if (result === null) {
            if (/^(?:switch to|focus on|work on|use|select|run)\s*#?\d+$/i.test(text)) {
                result = 'focus_switch';
            } else if (/^(?:switch to|focus on|work on|use|select)\s+\S+/i.test(text)) {
                result = 'focus_switch';
            }
        }
    }

    SearchLogs.recordSearch({
        name: 'Conversation',
        method: 'Internal',
        result: result
    });

    return result;
}

module.exports = { searchMessageForConversation };
