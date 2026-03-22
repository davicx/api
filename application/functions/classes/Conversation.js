const db = require('./../conn');

class Conversation {
    static async createConversation({ masterSite, groupID, conversationTitle, createdBy }) {
        const connection = db.getConnection();
        const site = masterSite || 'kite';
        const title = (conversationTitle && String(conversationTitle).trim()) || 'New conversation';
        const by = createdBy || '';

        const queryString =
            'INSERT INTO conversations (master_site, group_id, conversation_title, created_by) VALUES (?, ?, ?, ?)';

        return new Promise((resolve, reject) => {
            connection.query(queryString, [site, groupID, title, by], (err, results) => {
                if (err) {
                    console.log('Conversation.createConversation failed', err);
                    return reject(err);
                }
                resolve({ success: true, conversationID: results.insertId });
            });
        });
    }

    static async getConversationsByGroup(groupID) {
        const connection = db.getConnection();
        const queryString =
            'SELECT * FROM conversations WHERE group_id = ? ORDER BY conversation_id ASC';

        return new Promise((resolve, reject) => {
            connection.query(queryString, [groupID], (err, rows) => {
                if (err) {
                    console.log('Conversation.getConversationsByGroup failed', err);
                    return reject(err);
                }
                const conversations = rows.map((row) => ({
                    conversationID: row.conversation_id,
                    masterSite: row.master_site,
                    groupID: row.group_id,
                    conversationTitle: row.conversation_title,
                    createdBy: row.created_by,
                    updatedAt: row.updated_at,
                    createdAt: row.created_at,
                }));
                resolve({ success: true, conversations });
            });
        });
    }

    static async getConversationById(conversationID) {
        const connection = db.getConnection();
        const queryString = 'SELECT * FROM conversations WHERE conversation_id = ? LIMIT 1';

        return new Promise((resolve, reject) => {
            connection.query(queryString, [conversationID], (err, rows) => {
                if (err) {
                    console.log('Conversation.getConversationById failed', err);
                    return reject(err);
                }
                if (!rows || rows.length === 0) {
                    return resolve({ success: false, conversation: null });
                }
                const row = rows[0];
                resolve({
                    success: true,
                    conversation: {
                        conversationID: row.conversation_id,
                        masterSite: row.master_site,
                        groupID: row.group_id,
                        conversationTitle: row.conversation_title,
                        createdBy: row.created_by,
                        updatedAt: row.updated_at,
                        createdAt: row.created_at,
                    },
                });
            });
        });
    }
}

module.exports = Conversation;
