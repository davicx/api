const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const messageFunctions = require('../../functions/messageFunctions');
const cloudPilotMessageFunctions = require('../functions/cloudPilotMessageFunctions');
const Functions = require('../../functions/functions');
const chatFunctions = require('../functions/chatFunctions');
const state = require('../functions/state/state');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../functions/config/chatGPTconfig');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function A1: Post Message 
    2) Function A2: Delete Message
    3) Function A3: Edit Message
    4) Function A4: Say Hello

FUNCTIONS B: All Functions Related to getting Messages
    1) Function B1: Get all Group Messages
    2) Function B2: Get all Conversation Messages
*/


//FUNCTIONS A: Messages + external API (ChatGPT)
//Function B1: Post Message
async function postMessage(req, res) {
    const masterSite = req.body.masterSite || 'kite';
    const messageType = req.body.messageType || 'text';
    const messageFrom = req.body.messageFrom || req.body.postFrom || req.body.username;
    const messageTo = req.body.messageTo || req.body.postTo || 'chat';
    const groupID = Number(req.body.groupID || 0);
    const conversationID = Number(req.body.conversationID || 0);
    const messageCaption = req.body.messageCaption || req.body.message || req.body.postCaption;
    const cloudKey = req.body.cloudKey || 'no_cloud_key';
    const cloudBucket = req.body.cloudBucket || 'no_cloud_bucket';
    const storageType = req.body.storageType || 'local';
    
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

    //STEP 1: Check if there is an open Action (user is trying to make a change and we are gathering info)
    if (state.pendingAction) {
        console.log('STEP 1: continuing pendingAction');

        // For now just return something simple so you can test
        return {
            success: true,
            data: "Continuing previous request",
        };
    }

    //STEP 1: Build Message 
    var currentUserMessage = messageFunctions.buildNewMessage(req);

    //STEP 2: Send new message to the database
    console.log('STEP 1: Make a new message');
    var newMessageOutcome = await Message.createMessageText(currentUserMessage);

    if (newMessageOutcome.outcome != 200) {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log('STEP 1 FAILED: Could not create message');
        Functions.addFooter();
        return res.json(messageOutcome);
    }

    messageOutcome.data = newMessageOutcome.newMessage;
    messageOutcome.message = "You sent a message!";
    messageOutcome.statusCode = 200;
    messageOutcome.success = true;

    //STEP 3: CloudPilot (intent → decide → handler → ChatGPT)
    console.log('STEP 2: Have Cloud Pilot decide if the user is requesting something');

    var cloudPilotResult = null;

    try {
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption);
        console.log('STEP 2A: CloudPilot result:', JSON.stringify(cloudPilotResult, null, 2));
        messageOutcome.cloudPilot = cloudPilotResult;
    } catch (err) {
        console.error('STEP 2A: cloudPilot error:', err);
        messageOutcome.cloudPilot = {
            error: true,
            message: 'CloudPilot process pipeline could not run.',
        };
    }

    //STEP 4: Save CloudPilot message
    console.log('STEP 4: Save CloudPilot message');

    if (cloudPilotResult && cloudPilotResult.success == true) {

        //STEP 5: Build CloudPilot message
        var cloudPilotMessage = {
            masterSite: masterSite,
            messageType: 'text',
            messageFrom: 'CloudPilot',
            messageTo: messageFrom,
            groupID: groupID,
            conversationID: conversationID,
            messageCaption: cloudPilotResult.data,
            message: cloudPilotResult.data,
            postCaption: cloudPilotResult.data,
            cloudKey: cloudKey,
            cloudBucket: cloudBucket,
            storageType: storageType
        };

        var cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotMessage);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log('STEP 5 SUCCESS: CloudPilot message saved');
        } else {
            console.log('STEP 5 FAILED: Could not save CloudPilot message');
        }
    }

    Functions.addFooter();
    res.json(messageOutcome);
}


/*
async function postMessage(req, res) {
    const masterSite = req.body.masterSite || 'kite';
    const messageType = req.body.messageType || 'text';
    const messageFrom = req.body.messageFrom || req.body.postFrom || req.body.username;
    const messageTo = req.body.messageTo || req.body.postTo || 'chat';
    const groupID = Number(req.body.groupID || 0);
    const conversationID = Number(req.body.conversationID || 0);
    const messageCaption = req.body.messageCaption || req.body.message || req.body.postCaption;
    const cloudKey = req.body.cloudKey || 'no_cloud_key';
    const cloudBucket = req.body.cloudBucket || 'no_cloud_bucket';
    const storageType = req.body.storageType || 'local';

    //STEP 1: Build message
    const newMessage = messageFunctions.buildNewMessage(req);

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

    //STEP 2: Create message
    var newMessageOutcome = await Message.createMessageText(newMessage);

    if (newMessageOutcome.outcome != 200) {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log('STEP 1 FAILED: Could not create message');
        Functions.addFooter();
        return res.json(messageOutcome);
    }

    messageOutcome.data = newMessageOutcome.newMessage;
    messageOutcome.message = "You sent a message!";
    messageOutcome.statusCode = 200;
    messageOutcome.success = true;

    //STEP 2: CloudPilot (intent → decide → handler → ChatGPT)
    console.log('STEP 2: Have Cloud Pilot decide if the user is requesting something');

    var cloudPilotResult = null;

    try {
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption);
        console.log('STEP 2A: CloudPilot result:', JSON.stringify(cloudPilotResult, null, 2));
        messageOutcome.cloudPilot = cloudPilotResult;
    } catch (err) {
        console.error('STEP 2A: cloudPilot error:', err);
        messageOutcome.cloudPilot = {
            error: true,
            message: 'CloudPilot process pipeline could not run.',
        };
    }

    //STEP 3: Save CloudPilot message
    console.log('STEP 3: Save CloudPilot message');

    if (cloudPilotResult && cloudPilotResult.success == true) {

        var cloudPilotReq = {
            body: {
                masterSite: masterSite,
                messageType: 'text',
                messageFrom: 'CloudPilot',
                messageTo: messageFrom,
                groupID: groupID,
                conversationID: conversationID,
                messageCaption: cloudPilotResult.data,
                message: cloudPilotResult.data,
                postCaption: cloudPilotResult.data
            }
        };

        var cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotReq);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log('STEP 3 SUCCESS: CloudPilot message saved');
        } else {
            console.log('STEP 3 FAILED: Could not save CloudPilot message');
        }
    }

    Functions.addFooter();
    res.json(messageOutcome);
}
*/


/*
async function postMessage(req, res) {
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


    //STEP 1: Make a new message
    console.log('STEP 1: Make a new message');
    var newMessageOutcome = await Message.createMessageText(req);

    if (newMessageOutcome.outcome == 200) {
        messageOutcome.data = newMessageOutcome.newMessage;
        messageOutcome.message = "You sent a message!";
        messageOutcome.statusCode = 200;
        messageOutcome.success = true;
        var messageID = newMessageOutcome.messageID || 0;


        try {
            //STEP 2: Have Cloud Pilot decide if the user is requesting something (intent) 
            console.log('STEP 2: Have Cloud Pilot decide if the user is requesting something (intent → decide → handler → ChatGPT)');
            const cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption);
            console.log('Step 2A: postMessage: CloudPilot result:', JSON.stringify(cloudPilotResult, null, 2));
            messageOutcome.cloudPilot = cloudPilotResult;

            //STEP 3: Second Message from Cloud Pilot put in the database
            console.log('STEP 3: Save CloudPilot message');

            if (cloudPilotResult.success == true) {

                var cloudPilotReq = {
                    body: {
                        masterSite: masterSite,
                        messageType: 'text',
                        messageFrom: 'CloudPilot',
                        messageTo: messageFrom,
                        groupID: groupID,
                        conversationID: conversationID,
                        messageCaption: cloudPilotResult.data,
                        message: cloudPilotResult.data,
                        postCaption: cloudPilotResult.data
                    }
                };

                var cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotReq);

                if (cloudPilotMessageOutcome.outcome == 200) {
                    console.log('STEP 3 SUCCESS: CloudPilot message saved');
                } else {
                    console.log('STEP 3 FAILED: Could not save CloudPilot message');
                }

            }


        } catch (err) {
            console.error('cloudPilot (post-save process pipeline):', err);
            messageOutcome.cloudPilot = {
                error: true,
                message: 'CloudPilot process pipeline could not run.',
            };
        }

    } else {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log('STEP 2: Something went wrong sending this message!');
    }


    Functions.addFooter();
    res.json(messageOutcome);
}
*/

// TODO: Replace synthetic `req` shaping for assistant inserts.
// Today we reuse `Message.createMessageText(req)` by building a request-like object so the DB insert path stays identical to user messages.
// Long-term: extract a shared `createMessage({...fields})` (or pass a plain message DTO) so controllers do not mimic HTTP request shapes for internal writes.
/*
async function postMessage(req, res) {
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

    //STEP 1: Make a new message
    console.log('STEP 1: Make a new message');
    var newMessageOutcome = await Message.createMessageText(req);

    if (newMessageOutcome.outcome == 200) {
        messageOutcome.message = "You sent a message!";
        messageOutcome.statusCode = 200;
        messageOutcome.success = true;

        const userMessage = newMessageOutcome.newMessage;
        const messages = [userMessage];

        let cloudPilotMeta = null;

        try {
            //STEP 2: CloudPilot process pipeline (intent → decide → handler → ChatGPT)
            console.log('STEP 2: CloudPilot process pipeline (intent → decide → handler → ChatGPT)');
            const cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption, conversationID);
            console.log('postMessage: CloudPilot result:', JSON.stringify(cloudPilotResult, null, 2));

            cloudPilotMeta = {
                intent: cloudPilotResult && cloudPilotResult.intent != null ? cloudPilotResult.intent : null,
                action: cloudPilotResult && cloudPilotResult.action ? cloudPilotResult.action : null,
                policy: cloudPilotResult && cloudPilotResult.policy ? cloudPilotResult.policy : null,
                conversationID: cloudPilotResult && cloudPilotResult.conversationID != null ? cloudPilotResult.conversationID : null,
                conversationState: cloudPilotResult && cloudPilotResult.conversationState ? cloudPilotResult.conversationState : null
            };

            const policyAllowed = !(cloudPilotResult && cloudPilotResult.policy && cloudPilotResult.policy.allowed === false);
            const actionMessage =
                cloudPilotResult &&
                cloudPilotResult.action &&
                typeof cloudPilotResult.action.message === 'string'
                    ? cloudPilotResult.action.message.trim()
                    : '';

            const dataText =
                cloudPilotResult && cloudPilotResult.success && typeof cloudPilotResult.data === 'string'
                    ? cloudPilotResult.data.trim()
                    : '';

            const failureText =
                cloudPilotResult && !cloudPilotResult.success && typeof cloudPilotResult.message === 'string'
                    ? cloudPilotResult.message.trim()
                    : '';

            let assistantCaption = '';
            if (dataText) {
                assistantCaption = dataText;
            } else if (!policyAllowed && actionMessage) {
                assistantCaption = actionMessage;
            } else if (failureText) {
                assistantCaption = failureText;
            }

            if (assistantCaption) {
                const assistantReq = {
                    ...req,
                    body: {
                        ...req.body,
                        masterSite: masterSite,
                        messageType: req.body.messageType || 'text',
                        messageFrom: 'CloudPilot',
                        messageTo: messageFrom,
                        groupID: groupID,
                        conversationID: conversationID,
                        messageCaption: assistantCaption,
                        message: assistantCaption,
                        postCaption: assistantCaption
                    }
                };

                const assistantOutcome = await Message.createMessageText(assistantReq);
                if (assistantOutcome.outcome == 200) {
                    messages.push(assistantOutcome.newMessage);
                } else {
                    console.error('postMessage: CloudPilot assistant message could not be saved', assistantOutcome);
                    messageOutcome.errors.push({
                        code: 'assistant_message_not_saved',
                        message: 'User message saved, but CloudPilot reply could not be saved.'
                    });
                }
            }
        } catch (err) {
            console.error('cloudPilot (post-save process pipeline):', err);
            cloudPilotMeta = {
                error: true,
                message: 'CloudPilot process pipeline could not run.'
            };
        }

        messageOutcome.data = {
            messages: messages,
            cloudPilot: cloudPilotMeta
        };
    } else {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log('STEP 2: Something went wrong sending this message!');
    }

    Functions.addFooter();
    res.json(messageOutcome);
}
*/

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
    const messageExistsOutcome = await messageFunctions.checkMessageExists(messageID);

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

//Function A4: Say Hello
async function postMessageHello(req, res) {
    console.log('postMessageHello: incoming body keys', req.body && Object.keys(req.body));
    const raw = req.body && (req.body.message ?? req.body.messageCaption);
    const userText = raw == null ? '' : typeof raw === 'string' ? raw : String(raw);

    //STEP 1: Validate user message
    console.log('STEP 1: Validate user message');
    const text = typeof userText === 'string' ? userText.trim() : '';
    if (!text) {
        return res.status(400).json({
            success: false,
            data: null,
            message: 'message is required'
        });
    }

    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return res.status(502).json({
            success: false,
            data: null,
            message: 'message too long (max ' + maxIn + ' characters)'
        });
    }

    //STEP 2: Get OpenAI client and config
    console.log('STEP 2: Get OpenAI client and config');
    const client = chatFunctions.getOpenAIClient();
    if (!client) {
        console.warn('[postMessageHello] OPENAI_API_KEY is not set');
        return res.status(502).json({
            success: false,
            data: null,
            message: 'OPENAI_API_KEY is not configured'
        });
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[postMessageHello] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    //STEP 3: Call ChatGPT
    console.log('STEP 3: Call ChatGPT');
    const completion = await chatFunctions.createOpenAiChatCompletion(client, {
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

    if (completion.success) {
        if (completion.usage) {
            console.log(
                '[postMessageHello] usage prompt=%s completion=%s total=%s',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens,
                completion.usage.total_tokens
            );
        }
        console.log('STEP 4: New hello outcome');
        console.log('postMessageHello: result success=true');
        return res.json({
            success: true,
            data: completion.data
        });
    }

    console.log('STEP 4: Something went wrong with hello ChatGPT');
    console.log('postMessageHello: result success=false');
    return res.status(502).json({
        success: false,
        data: null,
        message: completion.message || 'ChatGPT request failed',
        error: completion.error
    });
}


//FUNCTIONS B: Get Messages
//Function B1: Get all Group Messages
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

//Function B2: Get all Conversation Messages
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
    postMessageHello,
    postMessage,
    deleteMessage,
    editMessage,
    getGroupMessages,
    getConversationMessages
};


//APPENDIX

/*
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
    const completion = await chatFunctions.createOpenAiChatCompletion(client, {
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

    if (completion.success) {
        if (completion.usage) {
            console.log(
                '[sayHello] usage prompt=%s completion=%s total=%s',
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens,
                completion.usage.total_tokens
            );
        }
        console.log('STEP 4: New hello outcome');
        return { success: true, data: completion.data };
    }

    console.log('STEP 4: Something went wrong with hello ChatGPT');
    return {
        success: false,
        message: completion.message || 'ChatGPT request failed',
        data: null,
        error: completion.error
    };
}
*/

/*
// OLD: dedicated POST /message/scan — pipeline now runs inside POST /message (postMessage)
async function postMessageScanPROBABLYOLD(req, res) {
    const { message } = req.body;
    const result = await cloudPilotMessageFunctions.processMessage(message);
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
*/


/*
// OLD: duplicate of POST /message/hello — remove when ready
async function postMessageTestPROBABLYOLD(req, res) {
    const { message } = req.body;
    const result = await sayHello(message);
    if (result.success) {
        return res.json({ success: true, data: result.data });
    }
    return res.status(502).json({
        success: false,
        data: null,
        message: result.message || 'ChatGPT request failed'
    });
}
*/


        //STEP 3: Add notifications (like posts)
        /*
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
        */

