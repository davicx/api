const navigatorResponseFunctions = require('../navigator/functions/navigatorFunctions');
const AtlasTimeFunctions = require('../../functions/atlasTimeFunctions');

/*
FUNCTIONS A: Change history Navigator data
    1) Function A1: buildHistoryNavigatorResponse

FUNCTIONS B: Display helpers (DB values unchanged)
    1) Function B1: formatActionDisplayName
    2) Function B2: formatChange
    3) Function B3: formatResourceDisplay
    4) Function B4: formatResourceFull
    5) Function B5: formatHistoryStatus
    6) Function B6: findNewestUndoableHistoryId
    7) Function B7: buildUndoConfirmMessage
*/

const ACTION_LABELS = {
    toggle_ec2: 'Toggle EC2',
    create_ec2: 'Create EC2',
    delete_ec2: 'Delete EC2',
    update_ec2_tag: 'Update EC2 Tag',
    undo_toggle_ec2: 'Undo Toggle EC2',
    undo_create_ec2: 'Undo Create EC2',
    undo_delete_ec2: 'Undo Delete EC2',
    undo_update_ec2_tag: 'Undo Update EC2 Tag',
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
    const rows = Array.isArray(historyRows) ? historyRows : [];
    const newestUndoableId = findNewestUndoableHistoryId(rows);

    return navigatorResponseFunctions.createEmptyNavigatorTable({
        id: 'change_history',
        title: 'History',
        columns: [
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'change',
                label: 'Change',
                type: 'text'
            }),
            Object.assign(
                navigatorResponseFunctions.createNavigatorTableColumn({
                    key: 'resource',
                    label: 'Resource',
                    type: 'text'
                }),
                { title_key: 'resource_full' }
            ),
            navigatorResponseFunctions.createNavigatorTableColumn({
                key: 'status',
                label: 'Status',
                type: 'status'
            }),
            Object.assign(
                navigatorResponseFunctions.createNavigatorTableColumn({
                    key: 'undo',
                    label: 'Undo',
                    type: 'action'
                }),
                { action: 'undo_latest' }
            ),
            Object.assign(
                navigatorResponseFunctions.createNavigatorTableColumn({
                    key: 'when',
                    label: 'When',
                    type: 'text'
                }),
                { title_key: 'when_exact' }
            )
        ],
        rows: rows.map(function mapHistoryRow(historyRow) {
            return buildHistoryTableRow(historyRow, newestUndoableId);
        })
    });
}

function buildHistoryTableRow(historyRow, newestUndoableId) {
    const row = historyRow || {};
    const resourceDisplay = formatResourceDisplay(row.targetId);
    const resourceFull = formatResourceFull(row.targetId);
    const change = formatChange(row);
    const undoEnabled =
        newestUndoableId != null && Number(row.id) === Number(newestUndoableId);

    return {
        change: change,
        resource: resourceDisplay,
        resource_display: resourceDisplay,
        resource_full: resourceFull,
        status: formatHistoryStatus(row.historyStatus),
        undo: undoEnabled ? 'Undo' : '—',
        undo_enabled: undoEnabled,
        undo_confirm: undoEnabled ? buildUndoConfirmMessage(change) : '',
        when: AtlasTimeFunctions.formatRelativeTime(row.createdAt),
        when_exact: AtlasTimeFunctions.formatExactTimestamp(row.createdAt),
        action_record_key: row.actionRecordKey || null,
        history_id: row.id != null ? row.id : null
    };
}

//Function B6: Newest completed row with undo_available (list is newest-first)
function findNewestUndoableHistoryId(historyRows) {
    const rows = Array.isArray(historyRows) ? historyRows : [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || {};

        if (!row.undoAvailable) {
            continue;
        }

        if (String(row.historyStatus || '').trim().toLowerCase() !== 'completed') {
            continue;
        }

        return row.id;
    }

    return null;
}

//Function B7: Confirm copy for dashboard Undo button
function buildUndoConfirmMessage(changeText) {
    const change = String(changeText || '').trim();

    if (change) {
        return 'Undo this change?\n\n' + change;
    }

    return 'Undo the most recent change?';
}

//Function B2: Timeline sentence — what changed?
function formatChange(row) {
    const actionName = String(row.actionName || '').trim();

    if (actionName.indexOf('undo_') === 0) {
        return formatUndoChange(actionName);
    }

    if (actionName === 'update_ec2_tag') {
        return formatTagChange(row.resourceStateBefore, row.resourceStateAfter);
    }

    if (actionName === 'toggle_ec2') {
        return 'Toggled EC2';
    }

    if (actionName === 'create_ec2') {
        return 'Created EC2 instance';
    }

    if (actionName === 'delete_ec2') {
        return 'Deleted EC2 instance';
    }

    return formatActionDisplayName(row.actionDisplayName, row.actionName);
}

function formatUndoChange(actionName) {
    if (actionName === 'undo_toggle_ec2') {
        return 'Undid EC2 toggle';
    }

    if (actionName === 'undo_create_ec2') {
        return 'Undid EC2 create';
    }

    if (actionName === 'undo_delete_ec2') {
        return 'Undid EC2 delete';
    }

    if (actionName === 'undo_update_ec2_tag') {
        return 'Undid tag change';
    }

    return 'Undid change';
}

function formatTagChange(resourceStateBefore, resourceStateAfter) {
    const beforeTags =
        resourceStateBefore && resourceStateBefore.tags ? resourceStateBefore.tags : {};
    const afterTags =
        resourceStateAfter && resourceStateAfter.tags ? resourceStateAfter.tags : {};
    const keys =
        Object.keys(afterTags).length > 0
            ? Object.keys(afterTags)
            : Object.keys(beforeTags);
    const tagKey = keys.length > 0 ? keys[0] : 'tag';
    const beforeValue = beforeTags[tagKey];
    const afterValue = afterTags[tagKey];
    const beforeText =
        beforeValue != null && String(beforeValue).trim() !== ''
            ? String(beforeValue)
            : null;
    const afterText =
        afterValue != null && String(afterValue).trim() !== ''
            ? String(afterValue)
            : null;

    if (beforeText && afterText) {
        return 'Changed tag ' + tagKey + ' from ' + beforeText + ' to ' + afterText;
    }

    if (afterText) {
        return 'Set tag ' + tagKey + ' to ' + afterText;
    }

    if (beforeText) {
        return 'Removed tag ' + tagKey;
    }

    return 'Changed tag ' + tagKey;
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

//Function B4: Full resource string for tooltip / debug (untouched target_id)
function formatResourceFull(targetId) {
    return String(targetId || '').trim();
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
