const db = require('../../../../../functions/conn');

class ScanSnapshot {
    static async create(data) {
        const connection = db.getConnection();
        const row = data || {};

        try {
            const result = await runQuery(
                connection,
                `INSERT INTO cloudpilot_scan_snapshots (
                    organization,
                    group_id,
                    conversation_id,
                    request_id,
                    executed_by_user,
                    scan_name,
                    action_type,
                    service,
                    region,
                    status,
                    resources_scanned,
                    finding_count,
                    schema_version,
                    payload,
                    completed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                [
                    String(row.organization || 'Cloud Pilot'),
                    Number(row.groupId),
                    Number(row.conversationId),
                    row.requestId != null ? Number(row.requestId) : null,
                    String(row.executedByUser || ''),
                    String(row.scanName || 'CloudPilot scan'),
                    String(row.actionType || ''),
                    String(row.service || ''),
                    row.region || null,
                    Number(row.resourcesScanned) || 0,
                    Number(row.findingCount) || 0,
                    Number(row.schemaVersion) || 1,
                    JSON.stringify(row.payload || {})
                ]
            );

            return {
                success: true,
                scanSnapshotId: Number(result.insertId),
                errors: []
            };
        } catch (error) {
            console.error('ScanSnapshot.create failed', error);
            return { success: false, scanSnapshotId: null, errors: [error] };
        }
    }

    static async attachMessageID({ scanSnapshotId, messageId }) {
        const connection = db.getConnection();

        try {
            await runQuery(
                connection,
                `UPDATE cloudpilot_scan_snapshots
                 SET cloudpilot_message_id = ?
                 WHERE id = ?`,
                [Number(messageId), Number(scanSnapshotId)]
            );
            return { success: true, errors: [] };
        } catch (error) {
            console.error('ScanSnapshot.attachMessageID failed', error);
            return { success: false, errors: [error] };
        }
    }

    static async getLatestByConversation({ conversationId }) {
        const rows = await selectRows(
            `SELECT *
             FROM cloudpilot_scan_snapshots
             WHERE conversation_id = ? AND status = 'completed'
             ORDER BY completed_at DESC, id DESC
             LIMIT 1`,
            [Number(conversationId)]
        );

        return {
            success: rows.success,
            scan: rows.rows.length > 0 ? mapRow(rows.rows[0]) : null,
            errors: rows.errors
        };
    }

    static async listRecentByConversation({ conversationId, limit = 3 }) {
        const safeLimit = Math.min(Math.max(Number(limit) || 3, 1), 100);
        const rows = await selectRows(
            `SELECT id, organization, group_id, conversation_id, request_id,
                    cloudpilot_message_id, executed_by_user, scan_name, action_type,
                    service, region, status, resources_scanned, finding_count,
                    schema_version, completed_at, created_at
             FROM cloudpilot_scan_snapshots
             WHERE conversation_id = ? AND status = 'completed'
             ORDER BY completed_at DESC, id DESC
             LIMIT ?`,
            [Number(conversationId), safeLimit]
        );

        return {
            success: rows.success,
            scans: rows.rows.map(mapRow),
            errors: rows.errors
        };
    }

    static async findByID({ scanSnapshotId }) {
        const rows = await selectRows(
            `SELECT *
             FROM cloudpilot_scan_snapshots
             WHERE id = ?
             LIMIT 1`,
            [Number(scanSnapshotId)]
        );

        return {
            success: rows.success,
            scan: rows.rows.length > 0 ? mapRow(rows.rows[0]) : null,
            errors: rows.errors
        };
    }

    static async userCanAccessConversation({ conversationId, userName }) {
        const rows = await selectRows(
            `SELECT c.conversation_id
             FROM conversations c
             INNER JOIN group_users gu
                ON gu.group_id = c.group_id
             WHERE c.conversation_id = ?
               AND gu.user_name = ?
               AND gu.active_member = 1
             LIMIT 1`,
            [Number(conversationId), String(userName || '')]
        );

        return {
            success: rows.success,
            allowed: rows.success && rows.rows.length > 0,
            errors: rows.errors
        };
    }
}

async function selectRows(sql, values) {
    const connection = db.getConnection();
    try {
        const rows = await runQuery(connection, sql, values);
        return { success: true, rows: rows || [], errors: [] };
    } catch (error) {
        console.error('ScanSnapshot lookup failed', error);
        return { success: false, rows: [], errors: [error] };
    }
}

function mapRow(row) {
    return {
        id: Number(row.id),
        organization: row.organization,
        groupId: Number(row.group_id),
        conversationId: Number(row.conversation_id),
        requestId: row.request_id != null ? Number(row.request_id) : null,
        cloudPilotMessageId:
            row.cloudpilot_message_id != null
                ? Number(row.cloudpilot_message_id)
                : null,
        executedByUser: row.executed_by_user,
        scanName: row.scan_name,
        actionType: row.action_type,
        service: row.service,
        region: row.region,
        status: row.status,
        resourcesScanned: Number(row.resources_scanned) || 0,
        findingCount: Number(row.finding_count) || 0,
        schemaVersion: Number(row.schema_version) || 1,
        payload: parseJson(row.payload),
        completedAt: row.completed_at,
        createdAt: row.created_at
    };
}

function parseJson(value) {
    if (value == null) {
        return null;
    }
    if (typeof value === 'object') {
        return value;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function runQuery(connection, sql, values) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
}

module.exports = ScanSnapshot;
