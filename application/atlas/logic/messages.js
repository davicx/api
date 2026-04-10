const db = require('../../functions/conn');
const Message = require('../../functions/classes/Message');
const Group = require('../../functions/classes/Group');
const Notification = require('../../functions/classes/Notification');
const MessageFunctions = require('../../functions/messageFunctions');
const Functions = require('../../functions/functions');
const chatFunctions = require('../functions/chatFunctions');

/*
FUNCTIONS A: All Functions Related to Messages
    1) Function A1: Post Message
    2) Function A2: Delete Message
    3) Function A3: Edit Message

FUNCTIONS B: All Functions Related to getting Messages
    1) Function B1: Get all Group Messages
    2) Function B2: Get all Conversation Messages
*/

//FUNCTIONS A: Create / Update / Delete
//Function A1: Post Message
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
    console.log("STEP 1: Make a new message");
    var newMessageOutcome = await Message.createMessageText(req);

    if (newMessageOutcome.outcome == 200) {
        messageOutcome.data = newMessageOutcome.newMessage;
        messageOutcome.message = "You sent a message!";
        messageOutcome.statusCode = 200;
        messageOutcome.success = true;
        var messageID = newMessageOutcome.messageID || 0;

        //STEP 2: Add Notifications (like posts)
        console.log("STEP 2: Add notifications");
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

        console.log("STEP 3: New Message Outcome");
        console.log("YOU SENT A NEW MESSAGE!");

        try {
            const intent = chatFunctions.detectIntent(messageCaption);
            const guardrails = chatFunctions.checkGuardrails(intent);
            const action = chatFunctions.buildAction(intent, guardrails);
            messageOutcome.cloudPilot = {
                intent,
                guardrails,
                action,
            };
        } catch (err) {
            console.error('cloudPilot (post-save):', err);
            messageOutcome.cloudPilot = {
                error: true,
                message: 'CloudPilot metadata could not be attached.',
            };
        }
    } else {
        messageOutcome.message = "There was a problem sending your message!";
        messageOutcome.statusCode = 500;
        messageOutcome.success = false;
        console.log("STEP 3: Something went wrong sending this message!");
    }

    Functions.addFooter();
    res.json(messageOutcome);
}

//Function A2: Delete Message
async function deleteMessage(req, res) {
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

    var deleteOutcome = await Message.deleteMessage(messageID, currentUser);

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

//Function A3: Edit Message
async function editMessage(req, res) {
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

    //STEP 1: Check if Message Exists
    const messageExistsOutcome = await MessageFunctions.checkMessageExists(messageID);

    //STEP 2: Update Caption
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

    res.json(editMessageOutcome);
}

//FUNCTIONS B: Get Messages
//Function B1: Get all Group Messages
async function getGroupMessages(req, res) {
    const groupID = req.params.group_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Group Messages for Group: " + groupID;
    Functions.addHeader(headerMessage);

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

    Functions.addFooter();
    res.json(messagesResponse);
}

//Function B2: Get all Conversation Messages
async function getConversationMessages(req, res) {
    const conversationID = req.params.conversation_id;
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get all Conversation Messages for: " + conversationID;
    Functions.addHeader(headerMessage);

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

    Functions.addFooter();
    res.json(messagesResponse);
}

module.exports = {
    postMessage,
    deleteMessage,
    editMessage,
    getGroupMessages,
    getConversationMessages
};
