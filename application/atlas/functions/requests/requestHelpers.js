/*
FUNCTIONS A: Shared helpers for requests/ (STEP 5)
    1) Function A1: copyObject
    2) Function A2: copyStringArray
    3) Function A3: buildDbUpdatesFromTargetRequest
*/

//Function A1: Shallow copy of a plain object
function copyObject(source) {
    const copy = {};
    const keys = Object.keys(source || {});

    for (let i = 0; i < keys.length; i++) {
        const fieldName = keys[i];
        copy[fieldName] = source[fieldName];
    }

    return copy;
}

//Function A2: Copy an array of strings
function copyStringArray(source) {
    const copy = [];

    if (!Array.isArray(source)) {
        return copy;
    }

    for (let i = 0; i < source.length; i++) {
        copy.push(source[i]);
    }

    return copy;
}

//Function A3: Map decision.request fields to Actions.updateAction keys
function buildDbUpdatesFromTargetRequest(targetRequest) {
    const updates = {};

    if (targetRequest.collected) {
        updates.collected = copyObject(targetRequest.collected);
    }

    if (targetRequest.missing) {
        updates.missing = copyStringArray(targetRequest.missing);
    }

    if (targetRequest.status) {
        updates.status = targetRequest.status;
    }

    if (targetRequest.executionMode != null && targetRequest.executionMode !== '') {
        updates.execution_mode = targetRequest.executionMode;
    }

    return updates;
}

module.exports = {
    copyObject,
    copyStringArray,
    buildDbUpdatesFromTargetRequest
};
