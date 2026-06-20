const History = require('../classes/History');
const ToggleEc2HistoryBuilder = require('../historyBuilders/toggleEc2History');

/*
FUNCTIONS A: CloudPilot change history orchestration
    1) Function A1: saveHistory
    2) Function A2: getLatestUndoable

FUNCTIONS B: Helpers
    1) Function B1: resolveHistoryBuilderFields
    2) Function B2: shouldRecordHistoryForExecution
    3) Function B3: buildSkippedOutcome
    4) Function B4: buildNotFoundOutcome
    5) Function B5: logLatestUndoableLookup
*/

const HISTORY_BUILDERS = {
    toggle_ec2: ToggleEc2HistoryBuilder.buildToggleEc2HistoryFields
};

//Function A1: Build history fields and insert row when execution changed cloud resources (STEP 6B)
async function saveHistory(options) {
    const actionName = options.actionName;
    const historyStatus = options.historyStatus || 'completed';
    const executionResult = options.executionResult || {};
    const executionContext = options.executionContext || {};
    const orchestrationContext = options.orchestrationContext || {};

    if (!shouldRecordHistoryForExecution(actionName, executionContext)) {
        return buildSkippedOutcome('not_mutating_or_not_automatic');
    }

    const builderFields = resolveHistoryBuilderFields({
        actionName: actionName,
        historyStatus: historyStatus,
        executionResult: executionResult,
        executionContext: executionContext
    });

    if (!builderFields) {
        console.log('STEP 6B: HISTORY SKIPPED — could not build history fields');
        return buildSkippedOutcome('builder_returned_null');
    }

    const processContext = orchestrationContext.context || {};
    const requestState = orchestrationContext.requestState || {};

    const insertOutcome = await History.insertHistoryRow({
        organization: processContext.masterSite || 'Cloud Pilot',
        conversationId: orchestrationContext.conversationID,
        requestId: requestState.workflowId || null,
        executedByUser: processContext.requestedByUserName || '',
        actionName: actionName,
        historyStatus: historyStatus,
        targetType: builderFields.target_type,
        targetId: builderFields.target_id,
        targetRegion: builderFields.target_region,
        resourceStateBefore: builderFields.resource_state_before,
        resourceStateAfter: builderFields.resource_state_after,
        undoPayload: builderFields.undo_payload,
        undoAvailable: builderFields.undo_available
    });

    if (!insertOutcome.success) {
        console.log('STEP 6B: HISTORY SAVE FAILED');
        console.log(insertOutcome.errors);

        return {
            success: false,
            skipped: false,
            historyId: null,
            error: insertOutcome.errors
        };
    }

    console.log('STEP 6B: HISTORY SAVED:', insertOutcome.historyId);
    console.log(JSON.stringify(insertOutcome.history, null, 2));
    console.log(' ');

    await logLatestUndoableLookup(orchestrationContext.conversationID);

    return {
        success: true,
        skipped: false,
        historyId: insertOutcome.historyId,
        history: insertOutcome.history,
        error: null
    };
}

//Function A2: Find latest completed undoable row for a conversation (H2)
async function getLatestUndoable({ conversationId }) {
    const lookupOutcome = await History.getLatestUndoableRow({ conversationId });

    if (!lookupOutcome.success) {
        return {
            success: false,
            found: false,
            history: null,
            errors: lookupOutcome.errors
        };
    }

    if (!lookupOutcome.history) {
        return buildNotFoundOutcome();
    }

    return {
        success: true,
        found: true,
        history: lookupOutcome.history,
        errors: []
    };
}

//Function B1: Dispatch action_name → history builder
function resolveHistoryBuilderFields(options) {
    const builder = HISTORY_BUILDERS[options.actionName];

    if (typeof builder !== 'function') {
        return null;
    }

    return builder({
        executionResult: options.executionResult,
        executionContext: options.executionContext,
        historyStatus: options.historyStatus
    });
}

//Function B2: Only record automatic mutations that hit Atlas/AWS
function shouldRecordHistoryForExecution(actionName, executionContext) {
    if (!Object.prototype.hasOwnProperty.call(HISTORY_BUILDERS, actionName)) {
        return false;
    }

    const executionMode = executionContext.state && executionContext.state.executionMode;

    if (actionName === 'toggle_ec2' && executionMode !== 'automatic') {
        return false;
    }

    return true;
}

function buildSkippedOutcome(reason) {
    return {
        success: true,
        skipped: true,
        reason: reason,
        historyId: null,
        history: null,
        error: null
    };
}

function buildNotFoundOutcome() {
    return {
        success: true,
        found: false,
        history: null,
        errors: []
    };
}

//Function B5: Log latest undoable row after save (H2 — lookup only, no undo)
async function logLatestUndoableLookup(conversationId) {
    console.log('STEP 6C: LATEST UNDOABLE LOOKUP');

    const lookupOutcome = await getLatestUndoable({ conversationId });

    if (!lookupOutcome.success) {
        console.log('STEP 6C: LOOKUP FAILED');
        console.log(lookupOutcome.errors);
        console.log(' ');
        return;
    }

    if (!lookupOutcome.found) {
        console.log('STEP 6C: NO UNDOABLE ROW');
        console.log(' ');
        return;
    }

    const history = lookupOutcome.history;

    console.log(
        'STEP 6C: FOUND history id=' +
            history.id +
            ' action_name=' +
            history.actionName +
            ' target_id=' +
            history.targetId
    );
    console.log('STEP 6C: undo_payload=' + JSON.stringify(history.undoPayload));
    console.log(' ');
}

module.exports = {
    saveHistory,
    getLatestUndoable
};
