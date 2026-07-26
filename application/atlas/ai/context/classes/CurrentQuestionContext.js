/*
CurrentQuestionContext — Situation for this turn.

Application owns this. Temporary: user message, selected finding, later
open request / conversation / execution mode.

Assembles Situation from processMessageContext. Does not persist sources.

METHODS A: Read pieces from this turn
    1) Method A1: getUserMessage
    2) Method A2: getSelectedFinding

METHODS B: Build Situation data
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

    //METHODS B: Build Situation data
    //Method B1: Situation object for AI context (JSON for CloudPilot)
    toData() {
        const data = {};
        const userMessage = this.getUserMessage();
        const selectedFinding = this.getSelectedFinding();

        if (userMessage) {
            data.userMessage = userMessage;
        }

        if (selectedFinding) {
            data.selectedFinding = selectedFinding;
        }

        return data;
    }
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
