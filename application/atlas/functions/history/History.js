const db = require('../../../functions/conn');

/*
METHODS A: cloudpilot_history CRUD
    1) Method A1: insertHistoryRow
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    String(data.organization || 'Cloud Pilot').trim(),
                    Number(data.conversationId),
                    data.requestId != null ? Number(data.requestId) : null,
                    String(data.executedByUser || '').trim(),
                    String(data.actionName || '').trim(),
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
}

function stringifyJsonColumn(value) {
    if (value == null) {
        return null;
    }

    return JSON.stringify(value);
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
