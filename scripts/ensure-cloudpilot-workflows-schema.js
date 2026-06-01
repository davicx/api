/**
 * P0: Ensure cloudpilot_workflows has display_name column.
 * Safe to run repeatedly — skips if column already exists.
 *
 * Usage (from api/):
 *   node scripts/ensure-cloudpilot-workflows-schema.js
 */

require('dotenv').config();

const db = require('../application/functions/conn');

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

async function columnExists(connection, tableName, columnName) {
    const rows = await runQuery(
        connection,
        `SELECT COUNT(*) AS cnt
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );

    return rows[0].cnt > 0;
}

async function tableExists(connection, tableName) {
    const rows = await runQuery(
        connection,
        `SELECT COUNT(*) AS cnt
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [tableName]
    );

    return rows[0].cnt > 0;
}

async function main() {
    const connection = db.getConnection();
    const tableName = 'cloudpilot_workflows';

    const hasTable = await tableExists(connection, tableName);

    if (!hasTable) {
        console.error(
            'Table cloudpilot_workflows not found. Run application/atlas/doc/sql/cloudpilot_workflows_phase1.sql first.'
        );
        process.exit(1);
    }

    const hasDisplayName = await columnExists(connection, tableName, 'display_name');

    if (hasDisplayName) {
        console.log('OK: cloudpilot_workflows.display_name already exists');
        process.exit(0);
    }

    await runQuery(
        connection,
        `ALTER TABLE cloudpilot_workflows
         ADD COLUMN display_name VARCHAR(255) NULL
             AFTER action_name`
    );

    console.log('OK: Added cloudpilot_workflows.display_name');
    process.exit(0);
}

main().catch(function (err) {
    console.error('Schema ensure failed:', err.message || err);
    process.exit(1);
});
