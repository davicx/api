const db = require('./../conn');

class Conversation {
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
