const actionState = require('../state/ActionState');
const Actions = require('./classes/Actions');

/*
FUNCTIONS A: Action state — load from database (restart survives open action)
    1) Function A1: loadUsersOpenAction
    2) Function A2: useDatabaseActionState

FUNCTIONS B: Helpers
    1) Function B1: actionStateIsEmpty
    2) Function B2: mapActionToState
*/

//FUNCTIONS A: Action state — load from database
//Function A1: Load this user's open action from the database into memory
async function loadUsersOpenAction(conversationID) {
    if (!useDatabaseActionState()) {
        return { loaded: false, reason: 'memory_only_mode' };
    }

    const memoryState = actionState.getActionStatus(conversationID);

    if (!actionStateIsEmpty(memoryState)) {
        return { loaded: false, reason: 'memory_has_action' };
    }

    const openResult = await Actions.getOpenActionForConversation(conversationID);

    if (!openResult.success) {
        console.log('Failed to read open action from database');
        console.log(openResult.errors);
        return { loaded: false, reason: 'database_read_failed' };
    }

    if (!openResult.action) {
        return { loaded: false, reason: 'no_open_action' };
    }

    actionState.loadActionFromDatabase(conversationID, openResult.action);

    console.log(
        'Loaded open action from database — actionId:',
        openResult.action.workflowId,
        'actionType:',
        openResult.action.actionType
    );

    return {
        loaded: true,
        actionId: openResult.action.workflowId
    };
}

//Function A2: Are we saving and loading actions from the database?
function useDatabaseActionState() {
    const backend = String(process.env.CLOUDPILOT_STATE_BACKEND || 'mysql')
        .trim()
        .toLowerCase();

    return backend !== 'memory';
}

//FUNCTIONS B: Helpers
//Function B1: Does memory have no active action yet?
function actionStateIsEmpty(memoryState) {
    if (!memoryState) {
        return true;
    }

    return !memoryState.pendingAction;
}

//Function B2: Turn a database action row into ActionState shape
function mapActionToState(dbAction) {
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
    loadUsersOpenAction,
    useDatabaseActionState,
    actionStateIsEmpty,
    mapActionToState
};
