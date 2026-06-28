/**
 * Ensure cloudpilot_history has action_display_name and action_record_key.
 * Safe to run repeatedly — skips columns that already exist.
 *
 * Usage (from api/):
 *   node test/scripts/ensure-cloudpilot-history-action-names.js
 */

require('dotenv').config();

const db = require('../../application/functions/conn');

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

async function ensureColumn(connection, tableName, columnName, afterColumn, definitionSql) {
    const exists = await columnExists(connection, tableName, columnName);

    if (exists) {
        console.log('OK: ' + tableName + '.' + columnName + ' already exists');
        return;
    }

    await runQuery(
        connection,
        'ALTER TABLE ' +
            tableName +
            ' ADD COLUMN ' +
            columnName +
            ' ' +
            definitionSql +
            ' AFTER ' +
            afterColumn
    );

    console.log('OK: Added ' + tableName + '.' + columnName);
}

async function main() {
    const connection = db.getConnection();
    const tableName = 'cloudpilot_history';

    const hasTable = await tableExists(connection, tableName);

    if (!hasTable) {
        console.error(
            'Table cloudpilot_history not found. Run application/atlas/doc/sql/master_sql.sql first.'
        );
        process.exit(1);
    }

    await ensureColumn(
        connection,
        tableName,
        'action_display_name',
        'action_name',
        'VARCHAR(255) NULL'
    );

    await ensureColumn(
        connection,
        tableName,
        'action_record_key',
        'action_display_name',
        'VARCHAR(255) NULL'
    );

    process.exit(0);
}

main().catch(function (err) {
    console.error('Schema ensure failed:', err.message || err);
    process.exit(1);
});
