const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');
const CreateEC2Context = require('../../../cloudPilot/actions/createEC2/createEC2Context');

/*
TYPE — CURRENT STATE (General Chat only)

Factual CloudPilot truth for this turn — not instructions, not personality.
Step D: open-request block when one request is open (existence + key DB facts).
Friendly Create Step 4: when open request is create_ec2, attach createEC2Context facts.

Doc: feature_cloud_pilot_context.md · feature_friendly_create_instance.md
     doc/development/current/feature_conversation.md (context rebuild)

Used by: buildAIContext → buildAISystemMessage → General Chat
*/

//Function A1: Return structured Current State (data only)
function buildCurrentStateContext(processMessageContext) {
    const context = processMessageContext || {};
    const requestState = context.requestState;
    const openRequest = slimOpenRequestState(requestState);
    const hasOpenRequest = openRequest != null;

    const data = {
        hasOpenRequest: hasOpenRequest,
        openRequest: openRequest
    };

    const createEc2Knowledge = slimCreateEc2Knowledge(requestState);

    if (createEc2Knowledge) {
        data.createEc2 = createEc2Knowledge;
    }

    const currentState = {
        loaded: true,
        type: 'current_state',
        data: data
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Current State Context');
        console.log(JSON.stringify(currentState, null, 2));
    }

    return currentState;
}

// Keep request-row facts CloudPilot already loaded — no OpenAI, no interpretation
function slimOpenRequestState(requestState) {
    if (!requestState || typeof requestState !== 'object' || Array.isArray(requestState)) {
        return null;
    }

    const action = requestState.pendingAction || requestState.action || null;

    if (!action) {
        return null;
    }

    const actionKey = String(action);
    const actionDefinition = actionMap[actionKey] || null;
    const label =
        actionDefinition && actionDefinition.actionLabel
            ? String(actionDefinition.actionLabel)
            : actionKey;

    const collected =
        requestState.collected && typeof requestState.collected === 'object'
            ? { ...requestState.collected }
            : {};
    const missing = Array.isArray(requestState.missing)
        ? requestState.missing.map(function (field) {
              return String(field);
          })
        : [];

    const slim = {
        action: actionKey,
        label: label,
        status: requestState.status ? String(requestState.status) : null,
        collected: collected,
        missing: missing
    };

    if (requestState.workflowId != null && String(requestState.workflowId).trim() !== '') {
        slim.id = requestState.workflowId;
    }

    if (requestState.executionMode != null && String(requestState.executionMode).trim() !== '') {
        slim.executionMode = String(requestState.executionMode);
    }

    // Backward-compatible alias used by older writeCurrentState callers
    if (missing.length > 0) {
        slim.waitingFor = missing.slice();
    }

    return slim;
}

// create_ec2 only — facts/rules from createEC2Context (not guidance copy)
function slimCreateEc2Knowledge(requestState) {
    if (!requestState || typeof requestState !== 'object' || Array.isArray(requestState)) {
        return null;
    }

    const action = requestState.pendingAction || requestState.action || null;

    if (String(action || '') !== 'create_ec2') {
        return null;
    }

    const createContext = CreateEC2Context.getCreateEc2Context();
    const choiceFields = CreateEC2Context.getCreateEc2ChoiceFields();
    const demoDefaults = createContext.demoDefaults || {};
    const pricingRules = createContext.pricingRules || {};
    const securityRules = createContext.securityRules || {};

    return {
        meaning: createContext.meaning || null,
        choiceFields: choiceFields.map(function (choice) {
            return {
                field: choice.field,
                label: choice.label,
                summary: choice.summary
            };
        }),
        demoDefaultInstanceType: demoDefaults.instance_type || null,
        instanceTypeIsDemoDefault: Boolean(demoDefaults.instanceTypeIsDemoDefault),
        neverInventPrices: Boolean(pricingRules.neverInventPrices),
        showEstimateOnlyWhenKnown: Boolean(pricingRules.showEstimateOnlyWhenKnown),
        neverClaimSecureUnlessKnown: Boolean(securityRules.neverClaimSecureUnlessKnown)
    };
}

module.exports = {
    buildCurrentStateContext
};
