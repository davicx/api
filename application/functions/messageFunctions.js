const db = require('./conn');

/*
FUNCTIONS A: All Message Helper Functions
    1) Function A1: Check if Message Exists
    2) Function A2: Get Message From
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

module.exports = { checkMessageExists, getMessageFrom };
