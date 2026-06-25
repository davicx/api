const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const messageFunctions = require('../../functions/messageFunctions');
const cloudPilotMessageFunctions = require('../services/cloudPilotMessageFunctions');
const Functions = require('../../functions/functions');
const openAIFunctions = require('../services/engines/llm/openai/openAIFunctions');
const { CHAT_CONFIG, OPENAI_SAFE_DEFAULTS } = require('../services/config/chatGPTconfig');

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
    
    var headerMessage = "New Message";
    Functions.addHeader(headerMessage);

    var messageOutcome = {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: messageFrom
    };

    //STEP 1: Build Message this is basically the JSON for a message
    var currentUserMessage = messageFunctions.buildNewMessage(req);
    console.log("STEP 1: Build Message ")
    console.log(currentUserMessage)

    //STEP 2: Send user message to be stored in the database
    //console.log("STEP 2: Send user message to be stored in the database");
    var currentUserMessageOutcome = await Message.createMessageText(currentUserMessage);

    //Step 2A: Add current user message to JSON output
    messageOutcome.data.currentUserMessage = currentUserMessageOutcome.newMessage;
    
    if (currentUserMessageOutcome.outcome != 200) {
        messageOutcome.message = "Failed to save user message";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
    }


    //STEP 3: CloudPilot processing
    let cloudPilotResult = null;
    //console.log(" ");
    //console.log("STEP 4: CloudPilot checking user message and sending to OPENAI API");

    try {
        cloudPilotResult = await cloudPilotMessageFunctions.processMessage(messageCaption, conversationID, {
            masterSite: masterSite,
            requestedByUserName: messageFrom
        });
        //console.log("CloudPilot Result:");
        //console.log("___________________");
        //console.log(cloudPilotResult);
        //console.log("___________________");
    } catch (err) {
        console.error("CloudPilot error:", err);
    }

    //STEP 6: Save CloudPilot message to database
    console.log("STEP 6: Save CloudPilot message to database");

    var cloudPilotMessageOutcome = null;
    const cloudPilotReplyText = cloudPilotResult && cloudPilotResult.cloudPilotMessage ? String(cloudPilotResult.cloudPilotMessage).trim() : '';

    if (cloudPilotReplyText) {
        var cloudPilotMessage = messageFunctions.buildCloudPilotMessage(req, cloudPilotReplyText);
        cloudPilotMessageOutcome = await Message.createMessageText(cloudPilotMessage);

        if (cloudPilotMessageOutcome.outcome == 200) {
            console.log("STEP 6 SUCCESS: CloudPilot message saved");
        } else {
            console.log("STEP 6 FAILED: Could not save CloudPilot message");
        }
    }
    
    //Step 6A: Add CloudPilot message to JSON output when saved
    if (cloudPilotMessageOutcome && cloudPilotMessageOutcome.newMessage) {
        messageOutcome.data.CloudPilotResponseMessage = cloudPilotMessageOutcome.newMessage;
    }

    //Step 6B: Add Cloud Pilot action status to response
    if (cloudPilotResult && cloudPilotResult.cloudPilot) {
        messageOutcome.data.CloudPilotActionStatus = cloudPilotResult.cloudPilot;
    }

    //Step 6C: Add formatted Atlas data to response
    messageOutcome.data.atlasResponse = null;
    if (cloudPilotResult && cloudPilotResult.atlasResponse) {
        messageOutcome.data.atlasResponse = cloudPilotResult.atlasResponse;
    }

    //Step 6D: HTTP success when user message saved and CloudPilot chat turn completed
    const userMessageSaved = currentUserMessageOutcome.outcome == 200;
    const cloudPilotTurnCompleted = Boolean(cloudPilotResult && cloudPilotReplyText);

    if (userMessageSaved && cloudPilotTurnCompleted) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];

        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    } else if (userMessageSaved && cloudPilotResult && cloudPilotResult.success == true) {
        messageOutcome.success = true;
        messageOutcome.statusCode = 200;
        messageOutcome.errors = [];
    } else {
        messageOutcome.errors = [];

        if (cloudPilotResult && cloudPilotResult.error) {
            messageOutcome.errors = [cloudPilotResult.error];
        }
    }

    //STEP 7: Return Response
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

//Function A4: Say Hello (Just to test if Open AI is up and running)
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
    const client = openAIFunctions.getOpenAIClient();
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
    const completion = await openAIFunctions.createOpenAiChatCompletion(client, {
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
   //console.log('STEP 1: Read group id and current user');
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "Get all Group Messages for Group: " + groupID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all group messages
    //console.log('STEP 2: Get all group messages');
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
    //console.log('STEP 3: Group messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

//Function B2: Get all Conversation Messages
async function getConversationMessages(req, res) {
    //STEP 1: Read conversation id and current user
    //console.log('STEP 1: Read conversation id and current user');
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Conversation Messages for: " + conversationID;
    //Functions.addHeader(headerMessage);

    //STEP 2: Get all conversation messages
    //console.log('STEP 2: Get all conversation messages');
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
    //console.log('STEP 3: Conversation messages outcome');
    //Functions.addFooter();
    res.json(messagesResponse);
}

module.exports = { postMessageHello, postMessage, deleteMessage, editMessage, getGroupMessages, getConversationMessages };

