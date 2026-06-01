const actionState = require('../state/ActionState');
const Actions = require('./classes/Actions');

/*
FUNCTIONS A: Workflow hydration (P1C — restart survives workflow)
    1) Function A1: hydrateWorkflowFromDatabase
    2) Function A2: isMysqlWorkflowBackendEnabled

FUNCTIONS B: Pure helpers (testable without DB)
    1) Function B1: shouldHydrateFromDatabase
    2) Function B2: mapDbActionToMemoryPatch
*/

//FUNCTIONS A: Workflow hydration
//Function A1: Load open workflow from MySQL into ActionState when memory is empty
async function hydrateWorkflowFromDatabase(conversationID) {
    if (!isMysqlWorkflowBackendEnabled()) {
        return { hydrated: false, reason: 'memory_backend' };
    }

    const memoryState = actionState.getActionStatus(conversationID);

    if (!shouldHydrateFromDatabase(memoryState)) {
        return { hydrated: false, reason: 'memory_has_state' };
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success) {
        console.log('P1C: Failed to read open workflow from database');
        console.log(openResult.errors);
        return { hydrated: false, reason: 'db_read_failed' };
    }

    if (!openResult.action) {
        return { hydrated: false, reason: 'no_open_workflow' };
    }

    actionState.restoreFromDatabase(conversationID, openResult.action);

    console.log(
        'P1C: Hydrated workflow from database — workflowId:',
        openResult.action.workflowId,
        'actionType:',
        openResult.action.actionType
    );

    return {
        hydrated: true,
        reason: 'hydrated',
        workflowId: openResult.action.workflowId
    };
}

//Function A2: Feature flag — skip DB read when e2e forces in-memory backend
function isMysqlWorkflowBackendEnabled() {
    const backend = String(process.env.CLOUDPILOT_STATE_BACKEND || 'mysql')
        .trim()
        .toLowerCase();

    return backend !== 'memory';
}

//FUNCTIONS B: Pure helpers
//Function B1: Only hydrate when memory has no active workflow
function shouldHydrateFromDatabase(memoryState) {
    if (!memoryState) {
        return true;
    }

    return !memoryState.pendingAction;
}

//Function B2: Map DB action row to ActionState patch (for tests / docs)
function mapDbActionToMemoryPatch(dbAction) {
    if (!dbAction) {
        return null;
    }

    return {
        pendingAction: dbAction.actionType,
        status: dbAction.status,
        executionMode: dbAction.executionMode || null,
        collected: { ...(dbAction.collected || {}) },
        missing: [...(dbAction.missing || [])],
        asked: { ...(dbAction.asked || {}) },
        workflowId: dbAction.workflowId
    };
}

module.exports = {
    hydrateWorkflowFromDatabase,
    isMysqlWorkflowBackendEnabled,
    shouldHydrateFromDatabase,
    mapDbActionToMemoryPatch
};
