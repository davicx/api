/**
 * Ensure cloudpilot_requests has display_name_internal (+ unique index).
 * Safe to run repeatedly — skips column/index that already exist.
 *
 * Usage (from api/):
 *   node test/scripts/ensure-cloudpilot-requests-display-name-internal.js
 *
 * SQL source: application/atlas/doc/sql/alter_cloudpilot_requests_display_name_internal.sql
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

async function indexExists(connection, tableName, indexName) {
    const rows = await runQuery(
        connection,
        `SELECT COUNT(*) AS cnt
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?`,
        [tableName, indexName]
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
    const tableName = 'cloudpilot_requests';
    const columnName = 'display_name_internal';
    const indexName = 'idx_cloudpilot_requests_display_name_internal';

    const hasTable = await tableExists(connection, tableName);

    if (!hasTable) {
        console.error(
            'Table cloudpilot_requests not found. Run application/atlas/doc/sql/master_sql.sql first.'
        );
        process.exit(1);
    }

    const hasColumn = await columnExists(connection, tableName, columnName);

    if (hasColumn) {
        console.log('OK: ' + tableName + '.' + columnName + ' already exists');
    } else {
        await runQuery(
            connection,
            `ALTER TABLE ${tableName}
             ADD COLUMN ${columnName} VARCHAR(255) NULL
                 AFTER action_name`
        );
        console.log('OK: Added ' + tableName + '.' + columnName);
    }

    const hasIndex = await indexExists(connection, tableName, indexName);

    if (hasIndex) {
        console.log('OK: index ' + indexName + ' already exists');
    } else {
        await runQuery(
            connection,
            `CREATE UNIQUE INDEX ${indexName}
             ON ${tableName} (${columnName})`
        );
        console.log('OK: Added unique index ' + indexName);
    }

    process.exit(0);
}

main().catch(function (err) {
    console.error('Schema ensure failed:', err.message || err);
    process.exit(1);
});
