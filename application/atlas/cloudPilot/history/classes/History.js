const db = require('../../../../functions/conn');

/*
METHODS A: cloudpilot_history CRUD
    1) Method A1: insertHistoryRow
    2) Method A2: getLatestUndoableRow
    3) Method A3: markHistoryReverted
    4) Method A4: listRecentHistoryByConversation
*/

class History {

    //Method A1: Insert one change-history row
    static async insertHistoryRow(row) {
        const connection = db.getConnection();
        const data = row || {};

        const outcome = {
            success: false,
            historyId: null,
            history: null,
            errors: []
        };

        try {
            const insertResults = await runQuery(
                connection,
                `INSERT INTO cloudpilot_history (
                    organization,
                    conversation_id,
                    request_id,
                    executed_by_user,
                    action_name,
                    action_display_name,
                    action_record_key,
                    history_status,
                    target_type,
                    target_id,
                    target_region,
                    resource_state_before,
                    resource_state_after,
                    undo_payload,
                    undo_available,
                    restores_history_id,
                    restored_by_history_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(data.organization || 'Cloud Pilot').trim(),
                    Number(data.conversationId),
                    data.requestId != null ? Number(data.requestId) : null,
                    String(data.executedByUser || '').trim(),
                    String(data.actionName || '').trim(),
                    data.actionDisplayName != null ? String(data.actionDisplayName).trim() : null,
                    data.actionRecordKey != null ? String(data.actionRecordKey).trim() : null,
                    String(data.historyStatus || '').trim(),
                    data.targetType || null,
                    data.targetId || null,
                    data.targetRegion || null,
                    stringifyJsonColumn(data.resourceStateBefore),
                    stringifyJsonColumn(data.resourceStateAfter),
                    stringifyJsonColumn(data.undoPayload),
                    data.undoAvailable ? 1 : 0,
                    data.restoresHistoryId != null ? Number(data.restoresHistoryId) : null,
                    data.restoredByHistoryId != null ? Number(data.restoredByHistoryId) : null
                ]
            );

            const historyId = insertResults.insertId;

            outcome.success = true;
            outcome.historyId = historyId;
            outcome.history = {
                id: historyId,
                actionName: data.actionName,
                actionDisplayName: data.actionDisplayName,
                actionRecordKey: data.actionRecordKey,
                historyStatus: data.historyStatus,
                targetType: data.targetType,
                targetId: data.targetId,
                undoAvailable: Boolean(data.undoAvailable)
            };

            return outcome;

        } catch (err) {
            console.log('History.insertHistoryRow failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method A2: Latest completed undoable row for a conversation
    static async getLatestUndoableRow({ conversationId }) {
        const connection = db.getConnection();

        const outcome = {
            success: false,
            history: null,
            errors: []
        };

        const conversationIdNumber = Number(conversationId);

        if (!conversationIdNumber) {
            outcome.errors.push({
                code: 'invalid_conversation_id',
                message: 'conversationId is required for history lookup'
            });
            return outcome;
        }

        try {
            const rows = await runQuery(
                connection,
                `SELECT *
                 FROM cloudpilot_history
                 WHERE conversation_id = ?
                   AND undo_available = 1
                   AND history_status = 'completed'
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [conversationIdNumber]
            );

            outcome.success = true;

            if (!rows || rows.length === 0) {
                return outcome;
            }

            outcome.history = mapHistoryRowFromDb(rows[0]);
            return outcome;

        } catch (err) {
            console.log('History.getLatestUndoableRow failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method A3: Close out original row after successful undo (H4)
    static async markHistoryReverted({ historyId, restoredByHistoryId }) {
        const connection = db.getConnection();

        const outcome = {
            success: false,
            errors: []
        };

        const historyIdNumber = Number(historyId);
        const restoredByIdNumber = Number(restoredByHistoryId);

        if (!historyIdNumber || !restoredByIdNumber) {
            outcome.errors.push({
                code: 'invalid_history_ids',
                message: 'historyId and restoredByHistoryId are required'
            });
            return outcome;
        }

        try {
            await runQuery(
                connection,
                `UPDATE cloudpilot_history
                 SET restored_by_history_id = ?,
                     undo_available = 0,
                     history_status = 'reverted'
                 WHERE id = ?`,
                [restoredByIdNumber, historyIdNumber]
            );

            outcome.success = true;
            return outcome;
        } catch (err) {
            console.log('History.markHistoryReverted failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method A4: List change history for a conversation (newest first)
    static async listRecentHistoryByConversation({ conversationId, limit = 5 }) {
        const connection = db.getConnection();

        const outcome = {
            success: false,
            history: [],
            errors: []
        };

        const conversationIdNumber = Number(conversationId);
        const limitNumber = Number(limit) > 0 ? Number(limit) : 5;

        if (!conversationIdNumber) {
            outcome.errors.push({
                code: 'invalid_conversation_id',
                message: 'conversationId is required for history list'
            });
            return outcome;
        }

        try {
            const rows = await runQuery(
                connection,
                `SELECT *
                 FROM cloudpilot_history
                 WHERE conversation_id = ?
                 ORDER BY created_at DESC
                 LIMIT ?`,
                [conversationIdNumber, limitNumber]
            );

            outcome.success = true;
            outcome.history = (rows || []).map(mapHistoryRowFromDb);
            return outcome;

        } catch (err) {
            console.log('History.listRecentHistoryByConversation failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method A5: Revert Specific History Item
}

function stringifyJsonColumn(value) {
    if (value == null) {
        return null;
    }

    return JSON.stringify(value);
}

function parseJsonColumn(value) {
    if (value == null) {
        return null;
    }

    if (typeof value === 'object') {
        return value;
    }

    try {
        return JSON.parse(String(value));
    } catch (err) {
        return null;
    }
}

function mapHistoryRowFromDb(row) {
    return {
        id: row.id,
        organization: row.organization,
        conversationId: row.conversation_id,
        requestId: row.request_id,
        executedByUser: row.executed_by_user,
        actionName: row.action_name,
        actionDisplayName: row.action_display_name,
        actionRecordKey: row.action_record_key,
        historyStatus: row.history_status,
        targetType: row.target_type,
        targetId: row.target_id,
        targetRegion: row.target_region,
        resourceStateBefore: parseJsonColumn(row.resource_state_before),
        resourceStateAfter: parseJsonColumn(row.resource_state_after),
        undoPayload: parseJsonColumn(row.undo_payload),
        undoAvailable: row.undo_available === 1,
        restoresHistoryId: row.restores_history_id,
        restoredByHistoryId: row.restored_by_history_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function runQuery(connection, queryString, params) {
    return new Promise(function (resolve, reject) {
        connection.query(queryString, params, function (err, results) {
            if (err) {
                return reject(err);
            }

            resolve(results);
        });
    });
}

module.exports = History;
