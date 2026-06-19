const actionState = require('../../../state/ActionState');
const Request = require('../classes/Request');

/*
FUNCTIONS A: Request load — database is source of truth (Phase 1D / STEP 2)
    1) Function A1: getUsersActionState
    2) Function A2: loadUsersOpenAction
    3) Function A3: startNewUsersAction
    4) Function A4: setUsersActionField
    5) Function A5: setUsersActionStatus
    6) Function A6: setUsersActionExecutionMode
    7) Function A7: useDatabaseActionState

FUNCTIONS B: Helpers
    1) Function B1: actionStateIsEmpty
    2) Function B2: mapActionToState
    3) Function B3: emptyActionState
    4) Function B4: closeOpenActionBeforeStartingNew
*/

//FUNCTIONS B: Helpers
//Function B3: Empty action state (no open row)
function emptyActionState() {
    return {
        pendingAction: null,
        status: null,
        executionMode: null,
        workflowId: null,
        missing: [],
        collected: {},
        asked: {}
    };
}

//Function B2: Turn a database action row into orchestration shape
function mapActionToState(dbAction) {
    if (!dbAction) {
        return null;
    }

    return {
        pendingAction: dbAction.actionType,
        status: dbAction.status,
        executionMode: dbAction.executionMode || null,
        workflowId: dbAction.workflowId,
        collected: { ...(dbAction.collected || {}) },
        missing: [...(dbAction.missing || [])],
        asked: { ...(dbAction.asked || {}) }
    };
}

//Function B1: Does state have no active action?
function actionStateIsEmpty(state) {
    if (!state) {
        return true;
    }

    return !state.pendingAction;
}

//Function A7: Are we saving and loading actions from the database?
function useDatabaseActionState() {
    const backend = String(process.env.CLOUDPILOT_STATE_BACKEND || 'mysql')
        .trim()
        .toLowerCase();

    return backend !== 'memory';
}

//FUNCTIONS A: Action state — database is source of truth
//Function A1: Read this user's open action from the database (or memory in tests)
async function getUsersActionState(conversationID) {
    if (!useDatabaseActionState()) {
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success) {
        console.log('Failed to read open action from database');
        console.log(openResult.errors);
        return emptyActionState();
    }

    if (!openResult.action) {
        return emptyActionState();
    }

    return mapActionToState(openResult.action);
}

//Function A2: Load open action at start of message (database mode — use getUsersActionState in processMessage)
async function loadUsersOpenAction(conversationID) {
    if (!useDatabaseActionState()) {
        return { loaded: false, reason: 'memory_only_mode' };
    }

    const state = await getUsersActionState(conversationID);

    if (!state.pendingAction) {
        return { loaded: false, reason: 'no_open_action' };
    }

    return {
        loaded: true,
        actionId: state.workflowId
    };
}

//Function B4: Close any open row before starting a different action (Phase 1 — one open per conversation)
async function closeOpenActionBeforeStartingNew(conversationID) {
    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return;
    }

    await Request.cancelAction(openResult.action.workflowId);

    console.log(
        'Closed open action before starting new — actionId:',
        openResult.action.workflowId,
        'actionType:',
        openResult.action.actionType
    );
}

//Function A3: Start a new action row in the database
async function startNewUsersAction(conversationID, processMessageContext, actionDefinition) {
    if (!useDatabaseActionState()) {
        actionState.setPendingAction(
            conversationID,
            actionDefinition.type,
            actionDefinition.requiredFields || []
        );

        const createActionOutcome = await Request.createAction({
            organization: processMessageContext.masterSite,
            conversationId: conversationID,
            requestedByUserName: processMessageContext.requestedByUserName,
            actionType: actionDefinition.type,
            requiredFields: actionDefinition.requiredFields || [],
            actionName: actionDefinition.actionLabel || null,
            displayName: actionDefinition.actionLabel || null
        });

        if (createActionOutcome.success) {
            actionState.setWorkflowId(conversationID, createActionOutcome.workflowId);
        }

        return {
            success: createActionOutcome.success,
            state: actionState.getActionStatus(conversationID),
            errors: createActionOutcome.errors
        };
    }

    await closeOpenActionBeforeStartingNew(conversationID);

    const createActionOutcome = await Request.createAction({
        organization: processMessageContext.masterSite,
        conversationId: conversationID,
        requestedByUserName: processMessageContext.requestedByUserName,
        actionType: actionDefinition.type,
        requiredFields: actionDefinition.requiredFields || [],
        actionName: actionDefinition.actionLabel || null,
        displayName: actionDefinition.actionLabel || null
    });

    if (!createActionOutcome.success) {
        console.log('Failed to create action in database');
        console.log(createActionOutcome.errors);

        return {
            success: false,
            state: await getUsersActionState(conversationID),
            errors: createActionOutcome.errors
        };
    }

    console.log('New action in database — actionId:', createActionOutcome.workflowId);

    return {
        success: true,
        state: mapActionToState(createActionOutcome.action),
        errors: []
    };
}

//Function A4: Save one collected field on the open action
async function setUsersActionField(conversationID, fieldName, fieldValue) {
    if (!useDatabaseActionState()) {
        actionState.setField(conversationID, fieldName, fieldValue);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Request.setField(
        openResult.action.workflowId,
        fieldName,
        fieldValue
    );

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A5: Save status on the open action
async function setUsersActionStatus(conversationID, status) {
    if (!useDatabaseActionState()) {
        actionState.setStatus(conversationID, status);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Request.setStatus(openResult.action.workflowId, status);

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A6: Save execution mode on the open action
async function setUsersActionExecutionMode(conversationID, executionMode) {
    if (!useDatabaseActionState()) {
        actionState.setExecutionMode(conversationID, executionMode);
        return actionState.getActionStatus(conversationID);
    }

    const openResult = await Request.getOpenActionForConversation(conversationID);

    if (!openResult.success || !openResult.action) {
        return emptyActionState();
    }

    const updateResult = await Request.setExecutionMode(
        openResult.action.workflowId,
        executionMode
    );

    if (!updateResult.success || !updateResult.action) {
        return await getUsersActionState(conversationID);
    }

    return mapActionToState(updateResult.action);
}

//Function A8: Debug — print current action state
async function printUsersActionState(conversationID, messageVar) {
    console.log(' ');
    console.log('_____________________________________');
    console.log(messageVar);

    const state = await getUsersActionState(conversationID);

    console.log('ACTION STATE:', JSON.stringify(state, null, 2));
    console.log('_____________________________________');
    console.log(' ');
}

module.exports = {
    getUsersActionState,
    loadUsersOpenAction,
    startNewUsersAction,
    setUsersActionField,
    setUsersActionStatus,
    setUsersActionExecutionMode,
    useDatabaseActionState,
    actionStateIsEmpty,
    mapActionToState,
    emptyActionState,
    closeOpenActionBeforeStartingNew,
    printUsersActionState
};
