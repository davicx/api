const db = require('../../../functions/conn');

/*
METHODS A: CREATE WORKFLOW RELATED
    1) Method A1: createAction

METHODS B: GET WORKFLOW RELATED
    1) Method B1: getAction
    2) Method B2: getOpenActionForConversation
    3) Method B3: getAllOpenActions
    4) Method B4: getActionsByConversation
    5) Method B5: getActionsByOrganization
    6) Method B6: getActionsByUser
    7) Method B7: getMissingActionInfo

METHODS C: UPDATE WORKFLOW RELATED
    1) Method C1: updateAction
    2) Method C2: setStatus
    3) Method C3: setExecutionMode
    4) Method C4: setField
    5) Method C5: markAsked

METHODS D: CLOSE WORKFLOW RELATED (no DELETE)
    1) Method D1: finishAction
    2) Method D2: cancelAction

Doc: application/atlas/doc/Master_Database.md
Phase 1: one is_open = 1 row per conversation_id (enforced in createAction).
*/

class Actions {

    constructor(workflowId) {
        this.workflowId = workflowId;
    }

    //METHODS A: CREATE WORKFLOW RELATED
    //Method A1: Insert a new workflow row
    static async createAction({
        organization,
        conversationId,
        requestedByUserName,
        actionType,
        requiredFields,
        actionName,
        actionNotes,
        priority
    }) {
        const connection = db.getConnection();

        var outcome = {
            success: false,
            workflowId: null,
            action: null,
            errors: []
        };

        try {
            const openCheck = await runQuery(
                connection,
                'SELECT id FROM cloudpilot_workflows WHERE conversation_id = ? AND is_open = 1 LIMIT 1',
                [Number(conversationId)]
            );

            if (openCheck && openCheck.length > 0) {
                outcome.errors.push({
                    code: 'open_workflow_exists',
                    message: 'This conversation already has an open workflow.',
                    existingWorkflowId: openCheck[0].id
                });
                return outcome;
            }

            const missingFields = Array.isArray(requiredFields) ? requiredFields.slice() : [];
            const collected = {};
            const asked = {};

            const insertResults = await runQuery(
                connection,
                `INSERT INTO cloudpilot_workflows (
                    organization,
                    conversation_id,
                    requested_by_user_name,
                    action_type,
                    action_name,
                    action_notes,
                    status,
                    priority,
                    is_open,
                    collected,
                    missing,
                    asked
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, 1, ?, ?, ?)`,
                [
                    String(organization || 'Cloud Pilot').trim(),
                    Number(conversationId),
                    String(requestedByUserName || '').trim(),
                    String(actionType || '').trim(),
                    actionName || null,
                    actionNotes || null,
                    priority || 'normal',
                    stringifyJsonColumn(collected),
                    stringifyJsonColumn(missingFields),
                    stringifyJsonColumn(asked)
                ]
            );

            const workflowId = insertResults.insertId;
            const loaded = await Actions.getAction(workflowId);

            outcome.success = loaded.success;
            outcome.workflowId = workflowId;
            outcome.action = loaded.action || null;

            return outcome;

        } catch (err) {
            console.log('Actions.createAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //METHODS B: GET WORKFLOW RELATED
    //Method B1: Get single workflow by id
    static async getAction(workflowId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                'SELECT * FROM cloudpilot_workflows WHERE id = ? LIMIT 1',
                [Number(workflowId)]
            );

            if (!rows || rows.length === 0) {
                return { success: false, action: null, errors: [] };
            }

            return {
                success: true,
                action: mapRowToAction(rows[0]),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getAction failed', err);
            return { success: false, action: null, errors: [err] };
        }
    }

    //Method B2: Get open workflow for a conversation (Phase 1: 0 or 1 row)
    static async getOpenActionForConversation(conversationId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                'SELECT * FROM cloudpilot_workflows WHERE conversation_id = ? AND is_open = 1 LIMIT 1',
                [Number(conversationId)]
            );

            if (!rows || rows.length === 0) {
                return { success: true, action: null, errors: [] };
            }

            return {
                success: true,
                action: mapRowToAction(rows[0]),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getOpenActionForConversation failed', err);
            return { success: false, action: null, errors: [err] };
        }
    }

    //Method B3: Get all open workflows for a conversation
    static async getAllOpenActions(conversationId) {
        const connection = db.getConnection();

        try {
            const rows = await runQuery(
                connection,
                'SELECT * FROM cloudpilot_workflows WHERE conversation_id = ? AND is_open = 1 ORDER BY id DESC',
                [Number(conversationId)]
            );

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getAllOpenActions failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B4: Get workflows for a conversation (open and/or history)
    static async getActionsByConversation(conversationId, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['conversation_id = ?'];
        const params = [Number(conversationId)];

        if (opts.isOpen === true) {
            conditions.push('is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('is_open = 0');
        }

        if (opts.status) {
            conditions.push('status = ?');
            params.push(String(opts.status));
        }

        if (opts.actionType) {
            conditions.push('action_type = ?');
            params.push(String(opts.actionType));
        }

        let queryString =
            'SELECT * FROM cloudpilot_workflows WHERE ' +
            conditions.join(' AND ') +
            ' ORDER BY id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByConversation failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B5: Get workflows for an organization
    static async getActionsByOrganization(organization, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['organization = ?'];
        const params = [String(organization || '').trim()];

        if (opts.isOpen === true) {
            conditions.push('is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('is_open = 0');
        }

        if (opts.status) {
            conditions.push('status = ?');
            params.push(String(opts.status));
        }

        if (opts.requestedByUserName) {
            conditions.push('requested_by_user_name = ?');
            params.push(String(opts.requestedByUserName));
        }

        let queryString =
            'SELECT * FROM cloudpilot_workflows WHERE ' +
            conditions.join(' AND ') +
            ' ORDER BY id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByOrganization failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B6: Get workflows by user (requested_by_user_name)
    static async getActionsByUser(requestedByUserName, options) {
        const connection = db.getConnection();
        const opts = options || {};

        const conditions = ['requested_by_user_name = ?'];
        const params = [String(requestedByUserName || '').trim()];

        if (opts.organization != null) {
            conditions.push('organization = ?');
            params.push(String(opts.organization).trim());
        }

        if (opts.isOpen === true) {
            conditions.push('is_open = 1');
        } else if (opts.isOpen === false) {
            conditions.push('is_open = 0');
        }

        if (opts.status) {
            conditions.push('status = ?');
            params.push(String(opts.status));
        }

        let queryString =
            'SELECT * FROM cloudpilot_workflows WHERE ' +
            conditions.join(' AND ') +
            ' ORDER BY id DESC';

        const limit = Number(opts.limit);
        if (limit > 0) {
            queryString += ' LIMIT ?';
            params.push(limit);
        }

        try {
            const rows = await runQuery(connection, queryString, params);

            return {
                success: true,
                actions: (rows || []).map(mapRowToAction),
                errors: []
            };

        } catch (err) {
            console.log('Actions.getActionsByUser failed', err);
            return { success: false, actions: [], errors: [err] };
        }
    }

    //Method B7: Get missing action info (human-readable summary)
    static async getMissingActionInfo(conversationId) {
        const openResult = await Actions.getAllOpenActions(conversationId);

        if (!openResult.success) {
            return {
                success: false,
                message: '',
                actions: [],
                errors: openResult.errors
            };
        }

        if (!openResult.actions || openResult.actions.length === 0) {
            return {
                success: true,
                message: 'You have no open actions waiting.',
                actions: [],
                errors: []
            };
        }

        const lines = ['Open Actions', ''];

        openResult.actions.forEach((action, index) => {
            const label = action.actionName || action.actionType || 'Action';
            const missingList =
                action.missing && action.missing.length > 0
                    ? action.missing.join(', ')
                    : 'confirmation or execution';

            lines.push((index + 1) + '. ' + label);
            lines.push('   Missing: ' + missingList);
            lines.push('');
        });

        return {
            success: true,
            message: lines.join('\n').trim(),
            actions: openResult.actions,
            errors: []
        };
    }

    //METHODS C: UPDATE WORKFLOW RELATED
    //Method C1: Update workflow (allowed columns only)
    static async updateAction(workflowId, updates) {
        const connection = db.getConnection();
        const patch = updates || {};

        const setParts = [];
        const params = [];

        for (const key of Object.keys(patch)) {
            const column = ALLOWED_UPDATE_COLUMNS[key];
            if (!column) {
                continue;
            }

            let value = patch[key];

            if (column === 'collected' || column === 'missing' || column === 'asked') {
                value = stringifyJsonColumn(value);
            }

            setParts.push(column + ' = ?');
            params.push(value);
        }

        var outcome = {
            success: false,
            action: null,
            errors: []
        };

        if (setParts.length === 0) {
            outcome.errors.push({
                code: 'no_updates',
                message: 'No valid fields to update.'
            });
            return outcome;
        }

        params.push(Number(workflowId));

        try {
            await runQuery(
                connection,
                'UPDATE cloudpilot_workflows SET ' + setParts.join(', ') + ' WHERE id = ?',
                params
            );

            const loaded = await Actions.getAction(workflowId);
            outcome.success = loaded.success;
            outcome.action = loaded.action;

            return outcome;

        } catch (err) {
            console.log('Actions.updateAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method C2: Set workflow status
    static async setStatus(workflowId, status) {
        return Actions.updateAction(workflowId, { status: status });
    }

    //Method C3: Set execution mode (instructions, cli, pr, automatic)
    static async setExecutionMode(workflowId, executionMode) {
        return Actions.updateAction(workflowId, { execution_mode: executionMode });
    }

    //Method C4: Set collected field (updates collected + missing)
    static async setField(workflowId, fieldName, fieldValue) {
        const current = await Actions.getAction(workflowId);

        if (!current.success || !current.action) {
            return {
                success: false,
                action: null,
                errors: [{ code: 'workflow_not_found', message: 'Workflow not found.' }]
            };
        }

        const collected = { ...(current.action.collected || {}) };
        collected[fieldName] = fieldValue;

        const missing = (current.action.missing || []).filter(
            (name) => name !== fieldName
        );

        return Actions.updateAction(workflowId, {
            collected: collected,
            missing: missing
        });
    }

    //Method C5: Mark field as already asked
    static async markAsked(workflowId, fieldName) {
        const current = await Actions.getAction(workflowId);

        if (!current.success || !current.action) {
            return {
                success: false,
                action: null,
                errors: [{ code: 'workflow_not_found', message: 'Workflow not found.' }]
            };
        }

        const asked = { ...(current.action.asked || {}) };
        asked[fieldName] = true;

        return Actions.updateAction(workflowId, { asked: asked });
    }

    //METHODS D: CLOSE WORKFLOW RELATED (no DELETE)
    //Method D1: Finish workflow (keep row, is_open = 0)
    static async finishAction(workflowId, status, outcomeCode) {
        const connection = db.getConnection();

        var outcome = {
            success: false,
            action: null,
            errors: []
        };

        try {
            await runQuery(
                connection,
                `UPDATE cloudpilot_workflows
                 SET is_open = 0,
                     status = ?,
                     outcome_code = ?,
                     completed_at = NOW()
                 WHERE id = ?`,
                [
                    String(status || 'completed'),
                    outcomeCode || null,
                    Number(workflowId)
                ]
            );

            const loaded = await Actions.getAction(workflowId);
            outcome.success = loaded.success;
            outcome.action = loaded.action;

            return outcome;

        } catch (err) {
            console.log('Actions.finishAction failed', err);
            outcome.errors.push(err);
            return outcome;
        }
    }

    //Method D2: Cancel workflow
    static async cancelAction(workflowId) {
        return Actions.finishAction(workflowId, 'cancelled', 'cancelled_by_user');
    }
}

//FUNCTIONS B: Workflow DB helpers (file-local — not atlas/functions.js AWS extractors)
const ALLOWED_UPDATE_COLUMNS = {
    status: 'status',
    execution_mode: 'execution_mode',
    collected: 'collected',
    missing: 'missing',
    asked: 'asked',
    priority: 'priority',
    action_name: 'action_name',
    action_notes: 'action_notes',
    outcome_code: 'outcome_code'
};

//Function B1: Parse JSON column from MySQL
function parseJsonColumn(value, defaultValue) {
    if (value == null) {
        return defaultValue;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (err) {
        return defaultValue;
    }
}

//Function B2: Stringify value for JSON column insert/update
function stringifyJsonColumn(value) {
    if (value == null) {
        return null;
    }
    return JSON.stringify(value);
}

//Function B3: Map database row to action object
function mapRowToAction(row) {
    if (!row) {
        return null;
    }

    return {
        workflowId: row.id,
        organization: row.organization,
        conversationId: row.conversation_id,
        requestedByUserName: row.requested_by_user_name,
        actionType: row.action_type,
        actionName: row.action_name,
        actionNotes: row.action_notes,
        status: row.status,
        outcomeCode: row.outcome_code,
        priority: row.priority,
        executionMode: row.execution_mode,
        isOpen: row.is_open === 1,
        collected: parseJsonColumn(row.collected, {}),
        missing: parseJsonColumn(row.missing, []),
        asked: parseJsonColumn(row.asked, {}),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        completedAt: row.completed_at
    };
}

//Function B4: Promise wrapper for connection.query
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

module.exports = Actions;
