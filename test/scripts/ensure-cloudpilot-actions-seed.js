/**
 * Upsert cloudpilot_actions rows from the app action registry.
 * Safe to run repeatedly — uses ON DUPLICATE KEY UPDATE.
 *
 * Usage (from api/):
 *   node test/scripts/ensure-cloudpilot-actions-seed.js
 */

require('dotenv').config();

const db = require('../../application/functions/conn');

const ACTIONS = [
    { action_type: 'general_chat', display_name: 'General Chat', requires_execution: 0 },
    { action_type: 'inventory_aws', display_name: 'Inventory AWS Resources', requires_execution: 1 },
    { action_type: 'scan_ec2', display_name: 'Scan EC2', requires_execution: 0 },
    { action_type: 'scan_s3', display_name: 'Scan S3', requires_execution: 0 },
    { action_type: 'toggle_ec2', display_name: 'Toggle EC2', requires_execution: 0 },
    { action_type: 'create_ec2', display_name: 'Create EC2', requires_execution: 0 },
    { action_type: 'delete_ec2', display_name: 'Delete EC2', requires_execution: 0 }
];

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

async function main() {
    const connection = db.getConnection();

    for (const action of ACTIONS) {
        await runQuery(
            connection,
            `INSERT INTO cloudpilot_actions (action_type, display_name, requires_execution)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                display_name = VALUES(display_name),
                requires_execution = VALUES(requires_execution)`,
            [action.action_type, action.display_name, action.requires_execution]
        );
        console.log('OK:', action.action_type);
    }

    const rows = await runQuery(
        connection,
        'SELECT action_type, display_name FROM cloudpilot_actions ORDER BY id'
    );

    console.log('cloudpilot_actions:', rows);
    process.exit(0);
}

main().catch(function (err) {
    console.error('Seed failed:', err.message || err);
    process.exit(1);
});
