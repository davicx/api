const Message = require('../../../../functions/classes/Message');

/*
ConversationHistoryContext — past turns for AI (not Situation).

One job: load recent DB messages and format them for OpenAI-style roles.
Does not build Identity, Situation, or Knowledge. Does not call OpenAI.

getMessages(messageHistoryCount) = that many message ROWS (not exchanges).
Excludes the current turn's user message when it was already saved to DB.
Skips placeholder assistant replies (e.g. offline stub) so they never pollute OpenAI history.
*/

const PLACEHOLDER_ASSISTANT_REPLIES = {
    'Open AI will respond when Live': true
};

class ConversationHistoryContext {
    constructor(conversationId, options) {
        this.conversationId = conversationId;
        this.currentUserMessage =
            options && typeof options.currentUserMessage === 'string'
                ? options.currentUserMessage.trim()
                : '';
    }

    // Load last N prior rows, oldest → newest, as { role, content, speakerName }
    async getMessages(messageHistoryCount) {
        const count = normalizeMessageHistoryCount(messageHistoryCount);

        if (!this.conversationId || count < 1) {
            return [];
        }

        const outcome = await Message.getConversationMessages(this.conversationId);
        const rows =
            outcome && outcome.success && Array.isArray(outcome.messages)
                ? outcome.messages
                : [];

        const withoutCurrent = dropCurrentUserMessage(rows, this.currentUserMessage);
        const withoutPlaceholders = dropPlaceholderAssistantReplies(withoutCurrent);
        const recent = withoutPlaceholders.slice(-count);

        return recent.map(formatMessageRowForAI).filter(Boolean);
    }
}

function normalizeMessageHistoryCount(messageHistoryCount) {
    const parsed = Number(messageHistoryCount);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return 0;
    }

    return Math.floor(parsed);
}

// User message is saved before prepareGeneralMessageReply — drop that trailing row so current turn is not duplicated
function dropCurrentUserMessage(messages, currentUserMessage) {
    if (!currentUserMessage || !messages.length) {
        return messages;
    }

    const last = messages[messages.length - 1];
    const from = String(last.messageFrom || '');
    const caption = String(last.messageCaption || '').trim();

    if (from !== 'CloudPilot' && caption === currentUserMessage) {
        return messages.slice(0, -1);
    }

    return messages;
}

// Offline stub replies saved while OpenAI was off — never send these to the model
function dropPlaceholderAssistantReplies(messages) {
    const filtered = [];

    for (let i = 0; i < messages.length; i++) {
        const row = messages[i];
        const from = String(row.messageFrom || '');
        const caption = String(row.messageCaption || '').trim();

        if (from === 'CloudPilot' && PLACEHOLDER_ASSISTANT_REPLIES[caption]) {
            continue;
        }

        filtered.push(row);
    }

    return filtered;
}

function formatMessageRowForAI(row) {
    const content = String(row.messageCaption || '').trim();

    if (!content) {
        return null;
    }

    const from = String(row.messageFrom || '');
    const role = from === 'CloudPilot' ? 'assistant' : 'user';
    const speakerName = from === 'CloudPilot' ? 'CloudPilot' : from || 'Current User';

    return {
        role: role,
        content: content,
        speakerName: speakerName
    };
}

module.exports = ConversationHistoryContext;
