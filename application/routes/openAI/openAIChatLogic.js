const Message = require('../../functions/classes/Message');
const messageFunctions = require('../../functions/messageFunctions');
const openAIClient = require('../../atlas/providers/openAI/client/openAIClient');
const { getModelConfig, estimateCostUsd } = require('./openAIModelConfig');
const { createLabChatCompletion } = require('./openAILabCompletion');

/**
 * TEMP OpenAI lab — POST /openai/chat
 * Does NOT use CloudPilot pipeline. Sends only optional system + current user text.
 */

/** MySQL message_caption often rejects U+2028/U+2029 (OpenAI sometimes emits these). */
function sanitizeMessageCaption(text) {
    return String(text == null ? '' : text)
        .replace(/\u2028/g, '\n')
        .replace(/\u2029/g, '\n');
}

async function postOpenAIChat(req, res) {
    const messageFrom = req.body.messageFrom || req.body.username || 'anonymous';
    const groupID = Number(req.body.groupID || 726);
    const conversationID = Number(req.body.conversationID || 0);
    const userText = sanitizeMessageCaption(
        String(req.body.message || req.body.messageCaption || '').trim()
    );
    const systemPrompt = String(req.body.systemPrompt || '').trim();
    const modelConfig = getModelConfig(req.body.modelTier);

    const response = {
        data: {},
        message: '',
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: messageFrom
    };

    if (!userText) {
        response.message = 'message is required';
        response.statusCode = 400;
        return res.status(400).json(response);
    }

    if (!conversationID) {
        response.message = 'conversationID is required';
        response.statusCode = 400;
        return res.status(400).json(response);
    }

    const client = openAIClient.getOpenAIClient();
    if (!client) {
        response.message = 'OPENAI_API_KEY is not configured';
        response.statusCode = 500;
        return res.status(500).json(response);
    }

    // Persist user message (same Message helpers as Chat — no CloudPilot)
    const userMessagePayload = messageFunctions.buildNewMessage({
        body: {
            masterSite: 'kite',
            messageType: 'text',
            messageFrom: messageFrom,
            messageTo: 'chat',
            groupID: groupID,
            conversationID: conversationID,
            messageCaption: userText
        }
    });
    const userSave = await Message.createMessageText(userMessagePayload);

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userText });

    // gpt-5.6-* requires max_completion_tokens (not max_tokens) — lab-local helper
    const completion = await createLabChatCompletion(client, {
        model: modelConfig.model,
        messages: messages,
        max_completion_tokens: modelConfig.max_completion_tokens,
        conversationId: conversationID,
        feature: 'openai_test'
    });

    if (!completion.success) {
        response.message = completion.message || 'OpenAI request failed';
        response.errors.push(completion.error || '');
        response.data = {
            userMessage: userSave && userSave.newMessage ? userSave.newMessage : null,
            model: modelConfig.displayName,
            apiModel: modelConfig.model,
            modelTier: modelConfig.tier
        };
        return res.status(500).json(response);
    }

    const replyText = sanitizeMessageCaption(
        completion.data != null ? String(completion.data) : ''
    );
    const usage = completion.usage || {};
    const inputTokens = Number(usage.prompt_tokens) || 0;
    const outputTokens = Number(usage.completion_tokens) || 0;
    const totalTokens = Number(usage.total_tokens) || inputTokens + outputTokens;
    const currentRequestCost = estimateCostUsd(modelConfig, usage);

    let assistantMessage = null;
    if (replyText) {
        const assistantPayload = messageFunctions.buildCloudPilotMessage(
            {
                body: {
                    masterSite: 'kite',
                    messageFrom: messageFrom,
                    groupID: groupID,
                    conversationID: conversationID
                }
            },
            replyText
        );
        // Label as OpenAI on this lab page (still stored via same Message path)
        assistantPayload.messageFrom = 'OpenAI';
        const assistantSave = await Message.createMessageText(assistantPayload);
        assistantMessage = assistantSave && assistantSave.newMessage
            ? assistantSave.newMessage
            : null;
        if (assistantMessage) {
            assistantMessage.messageFrom = 'OpenAI';
        }
    }

    response.success = true;
    response.statusCode = 200;
    response.message = 'OpenAI chat ok';
    response.data = {
        reply: replyText,
        model: modelConfig.displayName,
        apiModel: modelConfig.model,
        modelTier: modelConfig.tier,
        currentRequestCost: currentRequestCost,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
        userMessage: userSave && userSave.newMessage ? userSave.newMessage : null,
        assistantMessage: assistantMessage
    };

    return res.json(response);
}

module.exports = { postOpenAIChat };
