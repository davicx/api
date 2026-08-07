/*
CurrentQuestionContext — What did the user say this turn?

Application owns this. Temporary: user message, selected finding, later
open request / conversation / execution mode.

Assembles Current Question data from processMessageContext. Does not persist sources.
(Situation / what AI should look for lives in cloudPilotSituationContext.)

METHODS A: Read pieces from this turn
    1) Method A1: getUserMessage
    2) Method A2: getSelectedFinding
    3) Method A3: getOpenRequest

METHODS B: Build Current Question data
    1) Method B1: toData
*/

class CurrentQuestionContext {
    constructor(processMessageContext) {
        this.processMessageContext = processMessageContext || {};
    }

    //METHODS A: Read pieces from this turn
    //Method A1: User message for this turn
    getUserMessage() {
        const raw = this.processMessageContext.currentUserMessage;

        if (typeof raw !== 'string') {
            return '';
        }

        return raw.trim();
    }

    //Method A2: Slim finding the user is looking at (from request body — not DB)
    getSelectedFinding() {
        return slimSelectedFinding(this.processMessageContext.selectedFinding);
    }

    //Method A3: Small current request summary (already loaded by CloudPilot)
    getOpenRequest() {
        return slimOpenRequest(this.processMessageContext.requestState);
    }

    //METHODS B: Build Current Question data
    //Method B1: Current Question object for AI context (JSON for CloudPilot)
    toData() {
        const data = {};
        const userMessage = this.getUserMessage();
        const selectedFinding = this.getSelectedFinding();
        const openRequest = this.getOpenRequest();

        if (userMessage) {
            data.userMessage = userMessage;
        }

        if (selectedFinding) {
            data.selectedFinding = selectedFinding;
        }

        if (openRequest) {
            data.openRequest = openRequest;
        }

        return data;
    }
}

// Keep only context useful for explaining the current request
function slimOpenRequest(requestState) {
    if (!requestState || typeof requestState !== 'object' || Array.isArray(requestState)) {
        return null;
    }

    const action = requestState.pendingAction || requestState.action || null;

    if (!action) {
        return null;
    }

    const slim = {
        action: String(action)
    };

    if (requestState.status) {
        slim.status = String(requestState.status);
    }

    if (Array.isArray(requestState.missing) && requestState.missing.length > 0) {
        slim.missing = requestState.missing.map(function (field) {
            return String(field);
        });
    }

    const collected = requestState.collected;
    if (collected && typeof collected === 'object' && collected.region) {
        slim.region = String(collected.region);
    }

    return slim;
}

// Keep only small scalar fields — never dump Navigator / Atlas payloads
function slimSelectedFinding(selectedFinding) {
    if (!selectedFinding || typeof selectedFinding !== 'object' || Array.isArray(selectedFinding)) {
        return null;
    }

    const allowedKeys = [
        'ruleId',
        'instanceId',
        'name',
        'resourceName',
        'service',
        'title',
        'cpuAverage',
        'cpu',
        'lookbackDays',
        'estimatedSavings',
        'currentType',
        'recommendedType',
        'region'
    ];

    const slim = {};

    for (let i = 0; i < allowedKeys.length; i++) {
        const key = allowedKeys[i];
        const value = selectedFinding[key];

        if (value === undefined || value === null || value === '') {
            continue;
        }

        if (typeof value === 'object') {
            continue;
        }

        slim[key] = value;
    }

    if (Object.keys(slim).length === 0) {
        return null;
    }

    return slim;
}

module.exports = CurrentQuestionContext;
