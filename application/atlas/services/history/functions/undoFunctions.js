const History = require('../classes/History');
const HistoryFunctions = require('./historyFunctions');
const HistoryActionNameFunctions = require('./historyActionNameFunctions');
const RequestNameFunctions = require('../../requests/functions/requestNameFunctions');
const UndoRegistry = require('../undoRegistry');

/*
FUNCTIONS A: Undo orchestration (H4)
    1) Function A1: executeUndo

FUNCTIONS B: Helpers
    1) Function B1: buildExecutionOutcome
    2) Function B2: resolveUndoActionName
    3) Function B3: saveUndoHistoryRow
*/

const UNDO_ACTION_NAMES = {
    toggle_ec2: 'undo_toggle_ec2',
    create_ec2: 'undo_create_ec2'
};

//Function A1: Lookup latest undoable row → Atlas restore → link history rows
async function executeUndo(decision, context) {
    console.log('STEP 6: UNDO EXECUTION — starting');

    const conversationId = context.conversationID;
    const lookupOutcome = await HistoryFunctions.getLatestUndoable({ conversationId });

    console.log('UNDO EXECUTION: lookup for conversation', conversationId);

    if (!lookupOutcome.success) {
        console.log('UNDO EXECUTION: LOOKUP FAILED');
        console.log(lookupOutcome.errors);
        console.log(' ');

        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage: 'I could not look up undo history for this conversation.',
            atlasResponse: null,
            error: 'undo_lookup_failed'
        });
    }

    if (!lookupOutcome.found) {
        console.log('UNDO EXECUTION: NO UNDOABLE ROW');
        console.log(' ');

        return buildExecutionOutcome({
            success: true,
            cloudPilotMessage: 'I do not see an undoable change for this conversation.',
            atlasResponse: null,
            error: null
        });
    }

    const originalHistory = lookupOutcome.history;
    const undoPayload = originalHistory.undoPayload;

    console.log(
        'UNDO EXECUTION: FOUND history id=' +
            originalHistory.id +
            ' action_name=' +
            originalHistory.actionName +
            ' target_id=' +
            originalHistory.targetId
    );
    console.log('UNDO EXECUTION: undo_payload=' + JSON.stringify(undoPayload));

    if (!undoPayload || typeof undoPayload !== 'object') {
        console.log('UNDO EXECUTION: MISSING undo_payload');
        console.log(' ');

        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage: 'That change does not have an undo recipe stored.',
            atlasResponse: null,
            error: 'missing_undo_payload'
        });
    }

    let executionResult;

    try {
        executionResult = await UndoRegistry.executeUndoPayload(undoPayload);
    } catch (error) {
        console.log('UNDO EXECUTION: EXCEPTION');
        console.log(error);
        console.log(' ');

        return buildExecutionOutcome({
            success: false,
            cloudPilotMessage:
                'Something unexpected went wrong while undoing that change. Please try again in a moment.',
            atlasResponse: null,
            error: error.message || 'undo_exception'
        });
    }

    const undoActionName = resolveUndoActionName(originalHistory.actionName);
    const processContext = context.context || {};

    if (executionResult.success) {
        const saveOutcome = await saveUndoHistoryRow({
            originalHistory: originalHistory,
            undoActionName: undoActionName,
            historyStatus: 'completed',
            executionResult: executionResult,
            conversationId: conversationId,
            processContext: processContext
        });

        if (!saveOutcome.success) {
            console.log('UNDO EXECUTION: SAVE UNDO ROW FAILED');
            console.log(saveOutcome.errors);
            console.log(' ');

            return buildExecutionOutcome({
                success: false,
                cloudPilotMessage:
                    'The undo ran in AWS but I could not save the history record. Please check the instances.',
                atlasResponse: executionResult.atlasResponse || null,
                error: 'undo_history_save_failed'
            });
        }

        const markOutcome = await History.markHistoryReverted({
            historyId: originalHistory.id,
            restoredByHistoryId: saveOutcome.historyId
        });

        if (!markOutcome.success) {
            console.log('UNDO EXECUTION: MARK REVERTED FAILED');
            console.log(markOutcome.errors);
            console.log(' ');
        }

        console.log(
            'UNDO EXECUTION: SUCCESS restored history id=' +
                originalHistory.id +
                ' undo row id=' +
                saveOutcome.historyId
        );
        console.log(' ');

        return buildExecutionOutcome({
            success: true,
            cloudPilotMessage:
                executionResult.cloudPilotMessage ||
                'Undo completed for ' +
                    originalHistory.actionName +
                    ' (history id ' +
                    originalHistory.id +
                    ').',
            atlasResponse: executionResult.atlasResponse || null,
            error: null
        });
    }

    await saveUndoHistoryRow({
        originalHistory: originalHistory,
        undoActionName: undoActionName,
        historyStatus: 'failed',
        executionResult: executionResult,
        conversationId: conversationId,
        processContext: processContext
    });

    console.log('UNDO EXECUTION: FAILED for history id=' + originalHistory.id);
    console.log(' ');

    return buildExecutionOutcome({
        success: false,
        cloudPilotMessage:
            executionResult.cloudPilotMessage ||
            'Undo did not complete. The original change is still undoable.',
        atlasResponse: executionResult.atlasResponse || null,
        error: executionResult.error || 'undo_execution_failed'
    });
}

function buildExecutionOutcome(options) {
    return {
        ran: true,
        success: Boolean(options.success),
        cloudPilotMessage: options.cloudPilotMessage || '',
        atlasResponse: options.atlasResponse || null,
        request: null,
        error: options.error || null
    };
}

function resolveUndoActionName(originalActionName) {
    if (Object.prototype.hasOwnProperty.call(UNDO_ACTION_NAMES, originalActionName)) {
        return UNDO_ACTION_NAMES[originalActionName];
    }

    return 'undo_' + String(originalActionName || 'change');
}

async function saveUndoHistoryRow(options) {
    const originalHistory = options.originalHistory || {};
    const executionResult = options.executionResult || {};

    const resourceStateBefore = originalHistory.resourceStateAfter || null;
    const resourceStateAfter = originalHistory.resourceStateBefore || null;
    const undoNames = buildUndoHistoryNames({
        undoActionName: options.undoActionName,
        originalHistory: originalHistory
    });

    return History.insertHistoryRow({
        organization: originalHistory.organization || processContextOrganization(options.processContext),
        conversationId: options.conversationId,
        requestId: originalHistory.requestId,
        executedByUser: String(options.processContext.requestedByUserName || '').trim(),
        actionName: options.undoActionName,
        actionDisplayName: undoNames.actionDisplayName,
        actionRecordKey: undoNames.actionRecordKey,
        historyStatus: options.historyStatus,
        targetType: originalHistory.targetType,
        targetId: originalHistory.targetId,
        targetRegion: originalHistory.targetRegion,
        resourceStateBefore: resourceStateBefore,
        resourceStateAfter: resourceStateAfter,
        undoPayload: null,
        undoAvailable: false,
        restoresHistoryId: originalHistory.id
    });
}

function processContextOrganization(processContext) {
    if (processContext && processContext.masterSite) {
        return processContext.masterSite;
    }

    return 'Cloud Pilot';
}

function buildUndoHistoryNames(options) {
    const originalHistory = options.originalHistory || {};
    const undoActionName = String(options.undoActionName || '').trim();
    const originalDisplayName = String(originalHistory.actionDisplayName || '').trim();

    let actionDisplayName = '';

    if (originalDisplayName) {
        actionDisplayName = 'Undo ' + originalDisplayName;
    } else {
        const fallback = HistoryActionNameFunctions.buildHistoryActionNames({
            actionName: undoActionName,
            originalHistory: originalHistory
        });
        actionDisplayName = fallback.actionDisplayName;
    }

    const collected = {
        region: originalHistory.targetRegion || 'global'
    };

    const actionRecordKey = RequestNameFunctions.buildDisplayNameInternal({
        actionType: undoActionName,
        collected: collected,
        requestId: originalHistory.requestId || originalHistory.id,
        createdAt: new Date()
    });

    return {
        actionDisplayName: actionDisplayName,
        actionRecordKey: actionRecordKey
    };
}

module.exports = {
    executeUndo
};
