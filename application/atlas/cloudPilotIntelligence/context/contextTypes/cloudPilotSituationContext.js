const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE — SITUATION (what CloudPilot wants AI to look for / do right now)

Selectable building blocks. Data only — no prompt strings assembled here.
Rendering: buildSystemMessage.js → writeSituation

Callers select any combination via getCloudPilotSituationContext(types).
Situation pieces describe WHAT to identify and identification rules only.
Output format / JSON schema belongs to the calling AI operation
(e.g. searchMessageForRegionOpenAI), not to individual pieces.

For now ONLY the region building block exists.
*/

const situationPieces = {
    region: {
        purpose:
            'Determine whether the current user message provides or clearly identifies an AWS region.',

        rules: [
            'Return a region only when the user provided or clearly identified one',
            'Do not choose a default region',
            'Do not invent a region',
            'Normalize AWS region codes to lowercase',
            'Natural language region references may be interpreted when clear'
        ]
    },

    ai_spend: {
        purpose:
            'Determine whether the current user message is asking about CloudPilot AI / OpenAI usage or spend.',

        rules: [
            'Return a hit only when the user is clearly asking about AI or OpenAI spend, cost, or usage',
            'Do not treat AWS billing or cloud infrastructure cost questions as AI spend',
            'Do not invent dollar amounts or usage totals',
            'Classify only — CloudPilot will load real usage data'
        ]
    },

    open_requests: {
        purpose:
            'Determine whether the current user message is asking about open CloudPilot requests or actions in progress.',

        rules: [
            'Return a hit only when the user is clearly asking what requests or actions are open, pending, or waiting',
            'Do not treat new action requests (scan, toggle, create) as open-requests questions',
            'Do not invent a list of requests',
            'Classify only — CloudPilot will load real request state'
        ]
    }
};

/*
FUNCTIONS A: Situation context
    1) Function A1: getCloudPilotSituationContext
*/

//Function A1: Return structured Situation context for the selected building blocks
function getCloudPilotSituationContext(types) {
    const selected = {};
    const requested = Array.isArray(types) ? types : [];

    for (let i = 0; i < requested.length; i++) {
        const type = requested[i];

        if (situationPieces[type]) {
            selected[type] = situationPieces[type];
        }
    }

    const situation = {
        loaded: true,
        type: 'situation',
        data: selected
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Situation Context');
        console.log(JSON.stringify(situation, null, 2));
    }

    return situation;
}

module.exports = {
    getCloudPilotSituationContext
};
