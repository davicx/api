const Conversation = require('../functions/classes/Conversation');
const Functions = require('../functions/functions');

async function createConversation(req, res) {
    const masterSite = req.body.masterSite || 'kite';
    const groupID = Number(req.body.groupID);
    const conversationTitle =
        req.body.conversationTitle || req.body.conversationName || 'New conversation';
    const createdBy =
        req.body.createdBy || req.body.username || req.currentUser || '';

    const currentUser = req.currentUser || req.body?.currentUser;

    Functions.addHeader('Create conversation for group ' + groupID);

    if (!Number.isFinite(groupID) || groupID <= 0) {
        Functions.addFooter();
        return res.status(400).json({
            data: null,
            message: 'Valid groupID is required',
            success: false,
            statusCode: 400,
            errors: [],
            currentUser,
        });
    }

    try {
        const created = await Conversation.createConversation({
            masterSite,
            groupID,
            conversationTitle,
            createdBy,
        });
        const full = await Conversation.getConversationById(created.conversationID);
        res.json({
            data: full.conversation,
            message: 'Conversation created',
            success: true,
            statusCode: 200,
            errors: [],
            currentUser,
        });
    } catch (e) {
        res.status(500).json({
            data: null,
            message: 'Could not create conversation',
            success: false,
            statusCode: 500,
            errors: [String(e?.message || e)],
            currentUser,
        });
    }

    Functions.addFooter();
}

async function getConversationsByGroup(req, res) {
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    // Functions.addHeader('Get conversations for group ' + groupID);

    try {
        const outcome = await Conversation.getConversationsByGroup(groupID);
        res.json({
            data: outcome.conversations || [],
            message: 'Conversations for group',
            success: outcome.success,
            statusCode: 200,
            errors: [],
            currentUser,
        });
    } catch (e) {
        res.status(500).json({
            data: [],
            message: 'Could not load conversations',
            success: false,
            statusCode: 500,
            errors: [String(e?.message || e)],
            currentUser,
        });
    }

    Functions.addFooter();
}

async function getConversationById(req, res) {
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    Functions.addHeader('Get conversation ' + conversationID);

    try {
        const outcome = await Conversation.getConversationById(conversationID);
        if (!outcome.success || !outcome.conversation) {
            return res.status(404).json({
                data: null,
                message: 'Conversation not found',
                success: false,
                statusCode: 404,
                errors: [],
                currentUser,
            });
        }
        res.json({
            data: outcome.conversation,
            message: 'Conversation',
            success: true,
            statusCode: 200,
            errors: [],
            currentUser,
        });
    } catch (e) {
        res.status(500).json({
            data: null,
            message: 'Could not load conversation',
            success: false,
            statusCode: 500,
            errors: [String(e?.message || e)],
            currentUser,
        });
    }

    //Functions.addFooter();
}

module.exports = {
    createConversation,
    getConversationsByGroup,
    getConversationById,
};
