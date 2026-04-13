const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const MessageFunctions = require('../../functions/messageFunctions');
const Functions = require('../../functions/functions');
const chatFunctions = require('../functions/chatFunctions');
// Atlas: intent + guardrails + buildAction (not ../../functions/messageFunctions — that is DB helpers only)
const intentPipeline = require('../functions/messageFunctions');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../functions/config/chatGPTconfig');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function A1: Say Hello
    2) Function A2: Scan path — intent → guardrails → action → ChatGPT

FUNCTIONS B: All Functions Related to Messages
    1) Function B1: Post Message
    2) Function B2: Delete Message
    3) Function B3: Edit Message

FUNCTIONS C: All Functions Related to getting Messages
    1) Function C1: Get all Group Messages
    2) Function C2: Get all Conversation Messages
*/

//FUNCTIONS A: Messages + external API (ChatGPT)
//Helper for A1: OpenAI completion (short, cost-controlled; no history)
async function sayHello(userMessage) {
    //STEP 1: Validate user message
    console.log('STEP 1: Validate user message');
    const text = typeof userMessage === 'string' ? userMessage.trim() : '';
    if (!text) {
        return { success: false, message: 'message is required', data: null };
    }

    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    //STEP 2: Get OpenAI client and config
    console.log('STEP 2: Get OpenAI client and config');
    const client = chatFunctions.getOpenAIClient();
    if (!client) {
        console.warn('[sayHello] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[sayHello] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    //STEP 3: Call ChatGPT
    console.log('STEP 3: Call ChatGPT');
    try {
        const response = await client.chat.completions.create({
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are CloudPilot. Respond in under 5 words. Be concise.'
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            max_tokens: config.max_tokens,
            temperature: config.temperature
        });

        const usage = response.usage;
        if (usage) {
            console.log('[sayHello] usage prompt=%s completion=%s total=%s', usage.prompt_tokens, usage.completion_tokens, usage.total_tokens);
        }

        //STEP 4: New hello outcome
        console.log('STEP 4: New hello outcome');
        return {
            success: true,
            data: response.choices[0].message.content
        };
    } catch (error) {
        console.error('[sayHello] ChatGPT error:', error.message || error);
        console.log('STEP 4: Something went wrong with hello ChatGPT');
        return {
            success: false,
            message: 'ChatGPT request failed',
            data: null,
            error: error.message || String(error)
        };
    }
}

//Function A1: Say Hello
async function postMessageTest(req, res) {
    //STEP 1: Read incoming message
    console.log('STEP 1: Read incoming message');
    const { message } = req.body;

    console.log('message API test — incoming:', message);

    //STEP 2: Call sayHello (ChatGPT)
    console.log('STEP 2: Call sayHello (ChatGPT)');
    const result = await sayHello(message);

    console.log('message API test — result:', result);

    //STEP 3: Hello test outcome
    console.log('STEP 3: Hello test outcome');
    if (result.success) {
        return res.json({
            success: true,
            data: result.data
        });
    }

    return res.status(502).json({
        success: false,
        data: null,
        message: result.message || 'ChatGPT request failed'
    });
}

//Function A2: Scan — intent → guardrails → action → ChatGPT (no Atlas execution)
async function processScanMessage(userMessage) {
    console.log('\n--- message/scan ---');
    console.log('User:', userMessage);

    //STEP 1: Normalize and validate the user message
    console.log('STEP 1: Normalize and validate the user message');
    const norm = chatFunctions.normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;

    //STEP 2: Detect intent from message
    console.log('STEP 2: Detect intent from message');
    const intent = intentPipeline.detectIntent(text);

    //STEP 3: Check guardrails (intent policy)
    console.log('STEP 3: Check guardrails (intent policy)');
    const policy = intentPipeline.checkIntentPolicy(intent);

    if (!policy.allowed) {
        console.log('STEP 4: Guardrail blocked — no ChatGPT call');
        return {
            success: true,
            data: policy.message,
            action: { type: 'none', allowed: false, message: policy.message },
            intent,
            policy
        };
    }

    //STEP 4: Build action object
    console.log('STEP 4: Build action object');
    const action = intentPipeline.buildAction(intent, policy);
    console.log('Action:', action);

    //STEP 5: Call ChatGPT with action context
    console.log('STEP 5: Call ChatGPT with action context');
    const chatResult = await chatFunctions.sendChatWithAction(text, action);

    if (!chatResult.success) {
        console.log('STEP 6: Something went wrong with scan ChatGPT');
        return {
            success: false,
            message: chatResult.message || 'ChatGPT request failed',
            data: null,
            action,
            intent,
            policy,
            error: chatResult.error
        };
    }

    //STEP 6: New scan outcome
    console.log('STEP 6: New scan outcome');
    return {
        success: true,
        data: chatResult.data,
        action,
        intent,
        policy
    };
}

//Route handler: POST /message/scan
async function postMessageScan(req, res) {
    //STEP 1: Read incoming message
    console.log('STEP 1: Read incoming message');
    const { message } = req.body;

    //STEP 2: Run scan pipeline (intent → guardrails → action → ChatGPT)
    console.log('STEP 2: Run scan pipeline (intent → guardrails → action → ChatGPT)');
    const result = await processScanMessage(message);

    //STEP 3: Scan route outcome
    console.log('STEP 3: Scan route outcome');
    if (result.success) {
        return res.json(result);
    }

    return res.status(502).json({
        success: false,
        data: null,
        message: result.message || 'ChatGPT request failed',
        error: result.error
    });
}

//FUNCTIONS B: Create / Update / Delete
//Function B1: Post Message
async function postMessage(req, res) {
    //STEP 1: Gather post fields from request
    console.log('STEP 1: Gather post fields from request');
    const masterSite = req.body.masterSite || 'kite';
    const messageFrom = req.body.messageFrom || req.body.postFrom || req.body.username;
    const messageTo = req.body.messageTo || req.body.postTo || 'chat';
    const groupID = Number(req.body.groupID || 0);
    const conversationID = Number(req.body.conversationID || 0);
    const messageCaption = req.body.messageCaption || req.body.message || req.body.postCaption;

    var headerMessage = "NEW MESSAGE: Post Message";
    Functions.addHeader(headerMessage);

    var messageOutcome = {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: messageFrom
    };

    //STEP 2: Make a new message
    console.log('STEP 2: Make a new message');
    var newMessageOutcome = await Message.createMessageText(req);

    if (newMessageOutcome.outcome == 200) {
        messageOutcome.data = newMessageOutcome.newMessage;
        messageOutcome.message = "You sent a message!";
        messageOutcome.statusCode = 200;
        messageOutcome.success = true;
        var messageID = newMessageOutcome.messageID || 0;

        //STEP 3: Add notifications (like posts)
        console.log('STEP 3: Add notifications (like posts)');
        if (groupID > 0) {
            const groupUsersOutcome = await Group.getGroupUsers(groupID);
            const groupUsers = groupUsersOutcome.groupUsers || [];

            if (groupUsers.length > 0) {
                var notification = {
                    masterSite: masterSite,
                    notificationFrom: messageFrom,
                    notificationMessage: messageCaption || "New message",
                    notificationTo: groupUsers,
                    notificationLink: "http://localhost:3003/chat",
                    notificationType: "new_message",
                    groupID: groupID,
                    postID: 0
                };
                Notification.createGroupNotification(notification);
            }
        } else if (messageTo && messageTo !== 'chat' && messageTo !== messageFrom) {
            var notification = {
                masterSite: masterSite,
                notificationFrom: messageFrom,
                notificationMessage: messageCaption || "New message",
                notificationTo: messageTo,
                notificationLink: "http://localhost:3003/chat",
                notificationType: "new_message",
                groupID: 0,
                postID: 0
            };
            Notification.createSingleNotification(notification);
        }

        console.log('STEP 4: New message outcome');
        console.log('YOU SENT A NEW MESSAGE!');

        try {
            //STEP 5: Attach CloudPilot metadata (intent, policy, action)
            console.log('STEP 5: Attach CloudPilot metadata (intent, policy, action)');
            const intent = intentPipeline.detectIntent(messageCaption);
            const intentPolicy = intentPipeline.checkIntentPolicy(intent);
            const action = intentPipeline.buildAction(intent, intentPolicy);
            messageOutcome.cloudPilot = {
                intent,
                intentPolicy,
                action,
            };
        } catch (err) {
            console.error('cloudPilot (post-save):', err);
            console.log('STEP 5: Something went wrong attaching CloudPilot metadata');
            messageOutcome.cloudPilot = {
                error: true,
                message: 'CloudPilot metadata could not be attached.',
            };
        }
    } else {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log('STEP 4: Something went wrong sending this message!');
    }

    Functions.addFooter();
    res.json(messageOutcome);
}

//Function B2: Delete Message
async function deleteMessage(req, res) {
    //STEP 1: Read delete request fields
    console.log('STEP 1: Read delete request fields');
    const messageID = req.body.messageID;
    const currentUser = req.body.currentUser || req.body.messageFrom;

    var deleteMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Delete the message
    console.log('STEP 2: Delete the message');
    var deleteOutcome = await Message.deleteMessage(messageID, currentUser);

    //STEP 3: Delete message outcome
    console.log('STEP 3: Delete message outcome');
    if (deleteOutcome.success) {
        deleteMessageOutcome.data.push({ messageID: messageID, currentUser: currentUser });
        deleteMessageOutcome.success = true;
        deleteMessageOutcome.message = "Successfully deleted message " + messageID;
    } else {
        deleteMessageOutcome.message = deleteOutcome.message || "Could not delete message " + messageID;
        deleteMessageOutcome.statusCode = 400;
    }

    res.json(deleteMessageOutcome);
}

//Function B3: Edit Message
async function editMessage(req, res) {
    //STEP 1: Read edit request fields
    console.log('STEP 1: Read edit request fields');
    const currentUser = req.body.currentUser || req.body.messageFrom;
    const messageID = req.body.messageID;
    const newMessageCaption = req.body.newMessageCaption || req.body.messageCaption;

    var editMessageOutcome = {
        data: [],
        success: false,
        message: "",
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 2: Check if message exists
    console.log('STEP 2: Check if message exists');
    const messageExistsOutcome = await MessageFunctions.checkMessageExists(messageID);

    //STEP 3: Update caption
    console.log('STEP 3: Update caption');
    if (messageExistsOutcome.messageExists) {
        const updateOutcome = await Message.updateMessageCaption(messageID, newMessageCaption, currentUser);
        if (updateOutcome.success) {
            editMessageOutcome.data.push({ messageID: messageID, newMessageCaption: newMessageCaption });
            editMessageOutcome.success = true;
            editMessageOutcome.message = "Message updated!";
        } else {
            editMessageOutcome.message = updateOutcome.message;
            editMessageOutcome.statusCode = 400;
        }
    } else {
        editMessageOutcome.message = "Message not found";
        editMessageOutcome.statusCode = 404;
    }

    //STEP 4: Edit message outcome
    console.log('STEP 4: Edit message outcome');
    res.json(editMessageOutcome);
}

//FUNCTIONS C: Get Messages
//Function C1: Get all Group Messages
async function getGroupMessages(req, res) {
    //STEP 1: Read group id and current user
    console.log('STEP 1: Read group id and current user');
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Group Messages for Group: " + groupID;
    Functions.addHeader(headerMessage);

    //STEP 2: Get all group messages
    console.log('STEP 2: Get all group messages');
    var messagesOutcome = await Message.getGroupMessages(groupID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Group messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Group messages outcome
    console.log('STEP 3: Group messages outcome');
    Functions.addFooter();
    res.json(messagesResponse);
}

//Function C2: Get all Conversation Messages
async function getConversationMessages(req, res) {
    //STEP 1: Read conversation id and current user
    console.log('STEP 1: Read conversation id and current user');
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Conversation Messages for: " + conversationID;
    Functions.addHeader(headerMessage);

    //STEP 2: Get all conversation messages
    console.log('STEP 2: Get all conversation messages');
    var messagesOutcome = await Message.getConversationMessages(conversationID);
    var messages = messagesOutcome.messages || [];

    var messagesResponse = {
        data: messages,
        message: "Conversation messages",
        success: messagesOutcome.success,
        statusCode: 200,
        errors: [],
        currentUser: currentUser
    };

    //STEP 3: Conversation messages outcome
    console.log('STEP 3: Conversation messages outcome');
    Functions.addFooter();
    res.json(messagesResponse);
}

module.exports = {
    sayHello,
    postMessageTest,
    processScanMessage,
    postMessageScan,
    postMessage,
    deleteMessage,
    editMessage,
    getGroupMessages,
    getConversationMessages
};
