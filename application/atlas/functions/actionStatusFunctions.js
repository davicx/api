/*
FUNCTIONS A: User-friendly action status (P2B)
    1) Function A1: initialStatusForNewAction
    2) Function A2: statusWhenFieldsComplete
    3) Function A3: isWaitingOnConfirmation
    4) Function A4: isWaitingOnExecutionMode
    5) Function A5: isCollectingFields
    6) Function A6: isTerminalStatus
    7) Function A7: shouldUpdateStatusWhenFieldsComplete
*/


const STATUS = {
    WAITING_ON_FIELDS: 'waiting_on_fields',
    WAITING_ON_EXECUTION_MODE: 'waiting_on_execution_mode',
    WAITING_ON_CONFIRMATION: 'waiting_on_confirmation',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    // Legacy — treat like new values when reading old rows
    PENDING: 'pending',
    READY: 'ready'
};

//Function A1: Status when a new action row is created
function initialStatusForNewAction(requiredFields) {
    const missing = Array.isArray(requiredFields) ? requiredFields : [];

    if (missing.length > 0) {
        return STATUS.WAITING_ON_FIELDS;
    }

    return STATUS.WAITING_ON_CONFIRMATION;
}

//Function A2: Status after all required fields are collected
function statusWhenFieldsComplete(actionSupportsExecutionModes, executionMode) {
    if (actionSupportsExecutionModes && !executionMode) {
        return STATUS.WAITING_ON_EXECUTION_MODE;
    }

    return STATUS.WAITING_ON_CONFIRMATION;
}

//Function A3: User can confirm execution (yes)
function isWaitingOnConfirmation(status) {
    return (
        status === STATUS.WAITING_ON_CONFIRMATION ||
        status === STATUS.READY
    );
}

//Function A4: User must pick execution mode 1–4
function isWaitingOnExecutionMode(status) {
    return (
        status === STATUS.WAITING_ON_EXECUTION_MODE
    );
}

//Function A5: User still owes field values
function isCollectingFields(status) {
    return (
        status === STATUS.WAITING_ON_FIELDS ||
        status === STATUS.PENDING ||
        status == null ||
        status === ''
    );
}

//Function A6: Action row is closed or finished running
function isTerminalStatus(status) {
    return (
        status === STATUS.COMPLETED ||
        status === STATUS.FAILED ||
        status === STATUS.CANCELLED
    );
}

//Function A7: Should we write status now that fields are complete?
function shouldUpdateStatusWhenFieldsComplete(currentStatus, actionSupportsExecutionModes, executionMode) {
    const targetStatus = statusWhenFieldsComplete(actionSupportsExecutionModes, executionMode);

    if (currentStatus === targetStatus) {
        return false;
    }

    if (isCollectingFields(currentStatus) || currentStatus === STATUS.READY) {
        return true;
    }

    if (
        isWaitingOnExecutionMode(currentStatus) &&
        targetStatus === STATUS.WAITING_ON_CONFIRMATION
    ) {
        return true;
    }

    return false;
}

module.exports = {
    STATUS,
    initialStatusForNewAction,
    statusWhenFieldsComplete,
    isWaitingOnConfirmation,
    isWaitingOnExecutionMode,
    isCollectingFields,
    isTerminalStatus,
    shouldUpdateStatusWhenFieldsComplete
};
