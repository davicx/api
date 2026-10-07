const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE — CURRENT QUESTION
Role: What did the user say?

Application owns this. Temporary for this turn.
Build from processMessageContext — do not invent AWS facts.

MVP: userMessage + selectedFinding (from request body).
Open request facts → cloudPilotCurrentStateContext.

Used by: buildAIContext → buildAISystemMessage → AI
*/

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
        'region',
        'action',
        'findingId',
        'bucketName',
        'bucket_name',
        'scanSnapshotId',
        'ruleId'
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

function buildCurrentQuestionData(processMessageContext) {
    const context = processMessageContext || {};
    const data = {};

    const raw = context.currentUserMessage;
    const userMessage = typeof raw === 'string' ? raw.trim() : '';
    const selectedFinding = slimSelectedFinding(context.selectedFinding);

    if (userMessage) {
        data.userMessage = userMessage;
    }

    if (selectedFinding) {
        data.selectedFinding = selectedFinding;
    }

    return data;
}

//Function A1: Return structured Current Question context (data only)
function buildCurrentQuestionContext(processMessageContext) {
    const data = buildCurrentQuestionData(processMessageContext);

    const currentQuestion = {
        loaded: true,
        type: 'current_question',
        data: data
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Current Question Context');
        console.log(JSON.stringify(currentQuestion, null, 2));
    }

    return currentQuestion;
}

module.exports = {
    buildCurrentQuestionContext
};
