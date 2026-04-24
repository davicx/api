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
    const b = req.body || {};
    return {
        masterSite: b.masterSite || 'kite',
        messageType: b.messageType || 'text',
        messageFrom: b.messageFrom || b.postFrom || b.username,
        messageTo: b.messageTo || b.postTo || 'chat',
        groupID: Number(b.groupID || 0),
        conversationID: Number(b.conversationID || 0),
        messageCaption: b.messageCaption || b.message || b.postCaption,
        cloudKey: b.cloudKey || 'no_cloud_key',
        cloudBucket: b.cloudBucket || 'no_cloud_bucket',
        storageType: b.storageType || 'local'
    };
}

//Function A4: Build CloudPilot message (from HTTP req + ChatGPT assistant text)
function buildCloudPilotMessage(req, assistantText) {
    const b = req.body || {};
    const text =
        assistantText == null ? '' : typeof assistantText === 'string' ? assistantText : String(assistantText);
    return {
        masterSite: b.masterSite || 'kite',
        messageType: 'text',
        messageFrom: 'CloudPilot',
        messageTo: b.messageFrom || b.postFrom || b.username,
        groupID: Number(b.groupID || 0),
        conversationID: Number(b.conversationID || 0),
        messageCaption: text,
        message: text,
        postCaption: text,
        cloudKey: b.cloudKey || 'no_cloud_key',
        cloudBucket: b.cloudBucket || 'no_cloud_bucket',
        storageType: b.storageType || 'local',
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
