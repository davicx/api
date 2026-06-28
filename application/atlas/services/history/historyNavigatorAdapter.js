const navigatorResponseFunctions = require('../navigator/functions/navigatorFunctions');
const AtlasTimeFunctions = require('../../functions/atlasTimeFunctions');

/*
FUNCTIONS A: Change history Navigator data
    1) Function A1: buildHistoryNavigatorResponse

FUNCTIONS B: Display helpers (DB values unchanged)
    1) Function B1: formatActionDisplayName
    2) Function B2: formatResourceDisplay
    3) Function B3: formatHistoryStatus
*/

const ACTION_LABELS = {
    toggle_ec2: 'Toggle EC2',
    create_ec2: 'Create EC2',
    delete_ec2: 'Delete EC2',
    undo_toggle_ec2: 'Undo Toggle EC2',
    undo_create_ec2: 'Undo Create EC2',
    undo_delete_ec2: 'Undo Delete EC2',
    scan_ec2: 'Scan EC2',
    scan_s3: 'Scan S3',
    inventory_aws: 'Inventory AWS'
};

//Function A1: Navigator table for recent change history rows
function buildHistoryNavigatorResponse(historyRows, options = {}) {
    const rows = Array.isArray(historyRows) ? historyRows : [];

    const navigatorData = navigatorResponseFunctions.createEmptyNavigatorData();

    navigatorData.meta = {
        rowCount: rows.length,
        limit: options.limit || 5
    };

    navigatorData.tables = [buildHistoryTable(rows)];

    return navigatorResponseFunctions.createNavigatorResponse({
        success: options.success !== false,
        message: options.message || '',
        statusCode: options.statusCode || 200,
        errors: Array.isArray(options.errors) ? options.errors : [],
        currentUser: options.currentUser || null,
        data: navigatorData
    });
}

function buildHistoryTable(historyRows) {
    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: 'recent_change_history',
        title: 'Recent changes',
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'action_name',
                label: 'Action Name',
                type: 'text'
            }),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'resource',
                label: 'Resource',
                type: 'text'
            }),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'status',
                label: 'Status',
                type: 'status'
            }),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'undo',
                label: 'Undo',
                type: 'text'
            }),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'when',
                label: 'When',
                type: 'text'
            })
        ],
        rows: historyRows.map(buildHistoryTableRow)
    });
}

function buildHistoryTableRow(historyRow) {
    const row = historyRow || {};

    return {
        action_name: formatActionDisplayName(row.actionDisplayName, row.actionName),
        resource: formatResourceDisplay(row.targetId),
        status: formatHistoryStatus(row.historyStatus),
        undo: row.undoAvailable ? 'Yes' : 'No',
        when: AtlasTimeFunctions.formatRelativeTime(row.createdAt),
        when_exact: AtlasTimeFunctions.formatExactTimestamp(row.createdAt),
        action_record_key: row.actionRecordKey || null
    };
}

function formatActionDisplayName(actionDisplayName, actionName) {
    const displayName = String(actionDisplayName || '').trim();

    if (displayName) {
        return displayName;
    }

    const key = String(actionName || '').trim();

    if (Object.prototype.hasOwnProperty.call(ACTION_LABELS, key)) {
        return ACTION_LABELS[key];
    }

    return key
        .split('_')
        .filter(Boolean)
        .map(function capitalizeWord(word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}

function formatResourceDisplay(targetId) {
    const raw = String(targetId || '').trim();

    if (!raw) {
        return '';
    }

    if (raw.indexOf(':') !== -1) {
        return raw
            .split(':')
            .map(function truncatePart(part) {
                return truncateResourceId(part.trim());
            })
            .join(' : ');
    }

    return truncateResourceId(raw);
}

function truncateResourceId(value, headLength, tailLength) {
    const head = headLength != null ? headLength : 6;
    const tail = tailLength != null ? tailLength : 4;
    const text = String(value || '').trim();

    if (text.length <= head + tail + 3) {
        return text;
    }

    return text.slice(0, head) + '...' + text.slice(-tail);
}

function formatHistoryStatus(historyStatus) {
    const status = String(historyStatus || '').trim().toLowerCase();

    if (status === 'completed') {
        return 'Completed';
    }

    if (status === 'failed') {
        return 'Failed';
    }

    if (status === 'reverted') {
        return 'Reverted';
    }

    if (!status) {
        return '';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
}

module.exports = {
    buildHistoryNavigatorResponse
};
