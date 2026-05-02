const db = require('./conn');

/*
TABLE OF CONTENTS

FUNCTIONS A: All Message Helper Functions
    1) Function A1: Check if Message Exists
    2) Function A2: Get Message From
    3) Function A3: Build New Message (from HTTP req)
    4) Function A4: Build CloudPilot Message (from HTTP req + ChatGPT assistant text)
    5) Function A5: Log Current State
*/

//Function A1: Check if Message Exists
async function checkMessageExists(messageID) {
    const connection = db.getConnection();

    const queryString = "SELECT COUNT(message_id) AS message_count FROM messages WHERE message_id = ?";

    var messageOutcome = {
        messageCount: 0,
        messageExists: false,
        success: false,
        message: "",
        errors: []
    };

    return new Promise(async function (resolve, reject) {
        try {
            connection.query(queryString, [messageID], (err, rows) => {
                if (!err) {
                    messageOutcome.success = true;
                    messageOutcome.messageCount = rows[0].message_count;
                    messageOutcome.messageExists = rows[0].message_count > 0;
                    resolve(messageOutcome);
                } else {
                    console.log("Failed to Check Message " + err);
                    reject(messageOutcome);
                }
            });
        } catch (err) {
            reject(messageOutcome);
        }
    });
}

//Function A2: Get Message From
async function getMessageFrom(messageID) {
    const connection = db.getConnection();

    const queryString = "SELECT message_from FROM messages WHERE message_id = ?";
    var messageOutcome = {
        success: false,
        messageFrom: ""
    };

    return new Promise(async function (resolve, reject) {
        try {
            connection.query(queryString, [messageID], (err, rows) => {
                if (!err && rows.length > 0) {
                    messageOutcome.messageFrom = rows[0].message_from;
                    messageOutcome.success = true;
                    resolve(messageOutcome);
                } else {
                    console.log("Failed to Get Message From " + err);
                    reject(messageOutcome);
                }
            });
        } catch (err) {
            reject(messageOutcome);
        }
    });
}

//Function A3: Build New Message (from HTTP req)
function buildNewMessage(req) {
    const newMessage = req.body || {};
    return {
        masterSite: newMessage.masterSite || 'kite',
        messageType: newMessage.messageType || 'text',
        messageFrom: newMessage.messageFrom || newMessage.postFrom || newMessage.username,
        messageTo: newMessage.messageTo || newMessage.postTo || 'chat',
        groupID: Number(newMessage.groupID || 0),
        conversationID: Number(newMessage.conversationID || 0),
        messageCaption: newMessage.messageCaption || newMessage.message || newMessage.postCaption,
        cloudKey: newMessage.cloudKey || 'no_cloud_key',
        cloudBucket: newMessage.cloudBucket || 'no_cloud_bucket',
        storageType: newMessage.storageType || 'local'
    };
}

//Function A4: Build CloudPilot message (from HTTP req + ChatGPT assistant text)
function buildCloudPilotMessage(req, assistantText) {
    const newMessage = req.body || {};
    const text =
        assistantText == null ? '' : typeof assistantText === 'string' ? assistantText : String(assistantText);
    return {
        masterSite: newMessage.masterSite || 'kite',
        messageType: 'text',
        messageFrom: 'CloudPilot',
        messageTo: newMessage.messageFrom || newMessage.postFrom || newMessage.username,
        groupID: Number(newMessage.groupID || 0),
        conversationID: Number(newMessage.conversationID || 0),
        messageCaption: text,
        message: text,
        postCaption: text,
        cloudKey: newMessage.cloudKey || 'no_cloud_key',
        cloudBucket: newMessage.cloudBucket || 'no_cloud_bucket',
        storageType: newMessage.storageType || 'local',
    };
}

//Function A5: Log Current State
function printState(currentState) {
    console.log('______________________________________________________________');
    console.log('STATE:');

    if (currentState.pendingAction) {
        console.log(`STATUS: ${currentState.pendingAction} is pending, waiting on info`);
    } else {
        console.log('STATUS: Nothing going on dude');
    }

    console.log('pendingAction:', currentState.pendingAction);
    console.log('missing:', currentState.missing);

    console.log('______________________________________________________________\n');
}

module.exports = { checkMessageExists, getMessageFrom, buildNewMessage, buildCloudPilotMessage, printState };
