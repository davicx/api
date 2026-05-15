const db = require('./../conn');
const timeFunctions = require('../timeFunctions');
const dayjs = require('dayjs');
var relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);
dayjs().format();

class Message {
    constructor(messageID) {
        this.messageID = messageID;
        this.messageFrom = "";
        this.messageTo = "";
        this.messageCaption = "";
    }

    //METHODS A: CREATE MESSAGE
    //Method A1: Make a Text Message
    static async createMessageText(newMessage) {
        const connection = db.getConnection();
        const masterSite = newMessage.masterSite || 'kite';
        const messageType = newMessage.messageType || 'text';
        const messageFrom = newMessage.messageFrom || newMessage.postFrom;
        const messageTo = newMessage.messageTo || newMessage.postTo || 'chat';
        const groupID = Number(newMessage.groupID || 0);
        const conversationID = Number(newMessage.conversationID || 0);
        const messageCaption = newMessage.messageCaption || newMessage.message || newMessage.postCaption;
        const cloudKey = newMessage.cloudKey || 'no_cloud_key';
        const cloudBucket = newMessage.cloudBucket || 'no_cloud_bucket';
        const storageType = newMessage.storageType || 'local';

        //console.log("CLASS Message: A: Create a new message from Message Class");

        var createdMessage = {
            messageID: 0,
            messageType: messageType,
            groupID: groupID,
            conversationID: conversationID,
            messageFrom: messageFrom,
            messageTo: messageTo,
            messageCaption: messageCaption,
            messageDate: timeFunctions.getCurrentTime().postDate,
            messageTime: timeFunctions.getCurrentTime().postTime,
            timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: ""
        };

        var messageOutcome = {
            newMessage: createdMessage,
            outcome: 0,
            messageID: 0,
            errors: []
        };

        return new Promise(async function (resolve, reject) {
            try {
                const queryString = "INSERT INTO messages (master_site, message_type, group_id, conversation_id, message_from, message_to, message_caption, cloud_key, cloud_bucket, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                connection.query(queryString, [masterSite, messageType, groupID, conversationID, messageFrom, messageTo, messageCaption, cloudKey, cloudBucket, storageType], (err, results, fields) => {
                    if (!err) {
                        //console.log("Step B: You created a new Message with ID " + results.insertId);
                        messageOutcome.outcome = 200;
                        messageOutcome.messageID = results.insertId;
                        messageOutcome.newMessage.messageID = results.insertId;
                        messageOutcome.newMessage.created = new Date();
                    } else {
                        console.log("Step B: Error putting in database ");
                        console.log(err)
                        messageOutcome.outcome = "no worky";
                        messageOutcome.errors.push(err);
                    }
                    resolve(messageOutcome);
                });
            } catch (err) {
                messageOutcome.outcome = "rejected";
                console.log("Message Class: error in promise " + err);
                reject(messageOutcome);
            }
        });
    }

    //METHODS B: GET MESSAGES
    //Method B1: Get all Group Messages
    static async getGroupMessages(groupID) {
        const connection = db.getConnection();

        const queryString = "SELECT * FROM messages WHERE group_id = ? ORDER BY message_id ASC";

        var messagesOutcome = {
            success: false,
            messages: []
        };

        return new Promise(async function (resolve, reject) {
            try {
                connection.query(queryString, [groupID], (err, rows) => {
                    if (!err) {
                        const messages = rows.map((row) => {
                            let messageTimeData = {};
                            let date = dayjs(row.created_at).format('MM/DD/YYYY');
                            let minutes = dayjs(row.created_at).minute();
                            let hour = dayjs(row.created_at).hour();
                            if (hour > 12) hour = hour - 12;
                            let time = (minutes < 10) ? hour + ":0" + minutes + " pm" : hour + ":" + minutes + " pm";
                            let timeMessage = dayjs(row.created_at).fromNow();
                            messageTimeData.date = date;
                            messageTimeData.time = time;
                            messageTimeData.timeMessage = timeMessage;

                            return {
                                messageID: row.message_id,
                                messageType: row.message_type,
                                groupID: row.group_id,
                                conversationID: row.conversation_id,
                                messageFrom: row.message_from,
                                messageTo: row.message_to,
                                messageCaption: row.message_caption,
                                messageSeen: row.message_seen,
                                readAt: row.read_at,
                                messageDate: messageTimeData.date,
                                messageTime: messageTimeData.time,
                                timeMessage: messageTimeData.timeMessage,
                                created: row.created_at
                            };
                        });
                        messagesOutcome.messages = messages;
                        messagesOutcome.success = true;
                        resolve(messagesOutcome);
                    } else {
                        console.log("Failed to Select Messages " + err);
                        reject(messagesOutcome);
                    }
                });
            } catch (err) {
                reject(messagesOutcome);
            }
        });
    }

    //Method B2: Get all Conversation Messages
    static async getConversationMessages(conversationID) {
        const connection = db.getConnection();

        const queryString = "SELECT * FROM messages WHERE conversation_id = ? ORDER BY message_id ASC";

        var messagesOutcome = {
            success: false,
            messages: []
        };

        return new Promise(async function (resolve, reject) {
            try {
                connection.query(queryString, [conversationID], (err, rows) => {
                    if (!err) {
                        const messages = rows.map((row) => {
                            let messageTimeData = {};
                            let date = dayjs(row.created_at).format('MM/DD/YYYY');
                            let minutes = dayjs(row.created_at).minute();
                            let hour = dayjs(row.created_at).hour();
                            if (hour > 12) hour = hour - 12;
                            let time = (minutes < 10) ? hour + ":0" + minutes + " pm" : hour + ":" + minutes + " pm";
                            let timeMessage = dayjs(row.created_at).fromNow();
                            messageTimeData.date = date;
                            messageTimeData.time = time;
                            messageTimeData.timeMessage = timeMessage;

                            return {
                                messageID: row.message_id,
                                messageType: row.message_type,
                                groupID: row.group_id,
                                conversationID: row.conversation_id,
                                messageFrom: row.message_from,
                                messageTo: row.message_to,
                                messageCaption: row.message_caption,
                                messageSeen: row.message_seen,
                                readAt: row.read_at,
                                messageDate: messageTimeData.date,
                                messageTime: messageTimeData.time,
                                timeMessage: messageTimeData.timeMessage,
                                created: row.created_at
                            };
                        });
                        messagesOutcome.messages = messages;
                        messagesOutcome.success = true;
                        resolve(messagesOutcome);
                    } else {
                        console.log("Failed to Select Messages " + err);
                        reject(messagesOutcome);
                    }
                });
            } catch (err) {
                reject(messagesOutcome);
            }
        });
    }

    //METHODS C: UPDATE / DELETE MESSAGE
    //Method C1: Delete Message
    static async deleteMessage(messageID, currentUser) {
        const connection = db.getConnection();

        var deleteMessageOutcome = {
            messageID: messageID,
            success: false,
            message: "",
            errors: []
        };

        return new Promise(async function (resolve, reject) {
            try {
                const queryString = "DELETE FROM messages WHERE message_id = ? AND message_from = ?";

                connection.query(queryString, [messageID, currentUser], (err, rows) => {
                    if (!err) {
                        if (rows.affectedRows > 0) {
                            deleteMessageOutcome.success = true;
                            deleteMessageOutcome.message = "Message deleted";
                        } else {
                            deleteMessageOutcome.message = "Message not found or not yours to delete";
                        }
                    } else {
                        deleteMessageOutcome.message = "no worky";
                        deleteMessageOutcome.errors.push(err);
                    }
                    resolve(deleteMessageOutcome);
                });
            } catch (err) {
                deleteMessageOutcome.message = "rejected";
                deleteMessageOutcome.errors.push(err);
                reject(deleteMessageOutcome);
            }
        });
    }

    //Method C2: Edit Message
    static async updateMessageCaption(messageID, newMessageCaption, currentUser) {
        const connection = db.getConnection();

        var updateMessageOutcome = {
            messageID: messageID,
            success: false,
            message: "",
            errors: []
        };

        return new Promise(async function (resolve, reject) {
            try {
                const queryString = "UPDATE messages SET message_caption = ? WHERE message_id = ? AND message_from = ?";

                connection.query(queryString, [newMessageCaption, messageID, currentUser], (err, rows) => {
                    if (!err) {
                        if (rows.affectedRows > 0) {
                            updateMessageOutcome.success = true;
                            updateMessageOutcome.message = "You updated the message!";
                        } else {
                            updateMessageOutcome.message = "Message not found or not yours to edit";
                        }
                    } else {
                        updateMessageOutcome.message = "no worky";
                        updateMessageOutcome.errors.push(err);
                    }
                    resolve(updateMessageOutcome);
                });
            } catch (err) {
                updateMessageOutcome.message = "rejected";
                updateMessageOutcome.errors.push(err);
                reject(updateMessageOutcome);
            }
        });
    }
}

module.exports = Message;
