const actionMap = require('../masterCloudPilotCapabilities');
const ActionStatusFunctions = require('./functions/requestStatusFunctions');
const { CHAT_TYPE, RESPONSE_TYPE, EXECUTION_MODE_REPLIES } = require('./decisionTypes');
const OpenRequestEffectFunctions = require('./interpretOpenRequestEffect');

/*
What this file answers:

* When is a request ready to run?
* What should happen next?

Examples: ask_for_missing_fields, awaiting_confirmation, execution_started,
immediate_execution (inventory_aws, show_billing), general_chat

This is the Decide layer (STEP 4) — what should happen next?
(Request Workflow subtypes: new request, continue, commands, run work, or General Chat.)

See doc/development/architecture/action_map.md.
*/

/*
FUNCTIONS A: Decision layer — target request state + response type (no DB, no chat, no Atlas)
    1) Function A1: decideNextStep

FUNCTIONS B: Helpers
    1) Function B1: normalizeRequestState
    2) Function B2: buildRequestFromState
    3) Function B3: shouldStartNewRequest
    4) Function B4: hasApplicableValues
    5) Function B5: mergeValuesIntoRequest
    6) Function B6: isReadyForExecutionMode
    7) Function B7: buildNewRequestDecision
    8) Function B8: buildFieldsMergedDecision
    9) Function B9: handleExecutionModeSelection
    10) Function B10: resolveRequestChat
    11) Function B11: resolveImmediateExecutionAction
    12) Function B12: shouldStartExecutionOnConfirm
    13) Function B13: buildExecutionStartedDecision
    14) Function B14: buildGeneralChatDecision
    15) Function B15: resolveQuestionDecision
    16) Function B16: resolveResourceScanOfferReply
    17) Function B17: buildResourceScanAcceptedDecision
*/

//Function A1: Given understanding + loaded request state, return chatType, target request, and response type
function decideNextStep({ understanding, requestState }) {
    const state = normalizeRequestState(requestState);
    const u = understanding || {};
    const openEffect = u.openRequestEffectResult || OpenRequestEffectFunctions.interpretOpenRequestEffect(
        u,
        state,
        u.rawMessage || ''
    );
    const effectBody = openEffect.openRequestEffect || {};
    const affectsOpen = Boolean(openEffect.affectsOpenRequest);
    const effectType = effectBody.type || null;

    if (u.ambiguous) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.AMBIGUOUS_ACTION);
    }

    // Legacy conversation signal (phrases moved to questions/searchForOpenRequests)
    if (u.conversation === 'list_open') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_OPEN_REQUESTS);
    }

    if (u.conversation === 'list_history') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_HISTORY);
    }

    if (u.conversation === 'focus_switch') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.FOCUS_REQUEST);
    }

    if (u.conversation === 'status') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_STATUS);
    }

    if (u.conversation === 'undo') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.UNDO_EXECUTION);
    }

    if (state.pendingAction && state.status === ActionStatusFunctions.STATUS.RUNNING) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.WORKFLOW_RUNNING);
    }

    // Not-found scan offer — before cancel/confirm/mode so "yes" cannot run the mutation
    if (
        state.pendingAction &&
        ActionStatusFunctions.isWaitingOnResourceScan(state.status)
    ) {
        return resolveResourceScanOfferReply(state, u);
    }

    // Step 3: cancel only when interpretation says cancel (not soft text while leave-alone)
    if (effectType === 'cancel' && state.pendingAction) {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.REQUEST_CANCELLED },
            closeRequest: true
        };
    }

    if (
        state.pendingAction &&
        state.status === ActionStatusFunctions.STATUS.FAILED &&
        effectType === 'confirm'
    ) {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.REQUEST_FAILED);
    }

    if (state.pendingAction && EXECUTION_MODE_REPLIES.includes(u.reply) && isReadyForExecutionMode(state)) {
        return handleExecutionModeSelection(state, u.reply);
    }

    // Step 3: confirm only when interpretation says confirm (requires waiting_on_confirmation)
    if (effectType === 'confirm' && shouldStartExecutionOnConfirm(state, 'confirm')) {
        return buildExecutionStartedDecision(state);
    }

    const immediateAction = resolveImmediateExecutionAction(state, u);

    if (immediateAction) {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.IMMEDIATE_EXECUTION },
            execute: { action: immediateAction }
        };
    }

    // Step 3: information for open request (may ALSO continue normal conversation)
    if (state.pendingAction && effectType === 'information' && hasApplicableValues(state, effectBody.values || u.values)) {
        const mergeValues = effectBody.values && Object.keys(effectBody.values).length > 0
            ? effectBody.values
            : u.values;

        if (effectBody.continueNormalConversation || u.question) {
            // Mixed: do not swallow the whole turn into request-only speech.
            // processMessage applies the field merge, then question/general continues.
            if (u.question) {
                return resolveQuestionDecision(state, u.question, u);
            }
            return buildGeneralChatDecision();
        }

        return buildFieldsMergedDecision(state, mergeValues);
    }

    // Questions — after open-request information so mixed "region + ask" can merge first via processMessage
    if (u.question) {
        return resolveQuestionDecision(state, u.question, u);
    }

    if (u.action && u.action !== 'general_chat') {
        if (!shouldStartNewRequest(state, u.action)) {
            // Same open action rematched (e.g. soft-fill text contains "EC2" + "scan").
            if (state.pendingAction && hasApplicableValues(state, u.values)) {
                return buildFieldsMergedDecision(state, u.values);
            }

            // Step 3: leave alone — do NOT re-enter request chat and block normal conversation
            if (!affectsOpen) {
                return buildGeneralChatDecision();
            }

            return resolveRequestChat(state);
        }

        return buildNewRequestDecision(u);
    }

    if (state.pendingAction && hasApplicableValues(state, u.values)) {
        return buildFieldsMergedDecision(state, u.values);
    }

    return buildGeneralChatDecision();
}

//Function B1: Normalize loaded request state into a consistent shape
function normalizeRequestState(requestState) {
    const state = requestState || {};

    return {
        pendingAction: state.pendingAction || null,
        status: state.status || null,
        executionMode: state.executionMode || null,
        workflowId: state.workflowId || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

//Function B2: Map loaded state to decision request target
function buildRequestFromState(state) {
    const missing = state.missing || [];

    return {
        action: state.pendingAction,
        collected: { ...(state.collected || {}) },
        missing: missing.slice(),
        ready: missing.length === 0,
        status: state.status,
        executionMode: state.executionMode || null
    };
}

//Function B3: Should we start or replace the active request with a new action?
function shouldStartNewRequest(state, action) {
    const pendingAction = state.pendingAction;

    if (!pendingAction) {
        return true;
    }

    if (pendingAction !== action) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.COMPLETED) {
        return true;
    }

    if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        return true;
    }

    return false;
}

//Function B4: Do extracted values apply to the open request?
function hasApplicableValues(state, values) {
    if (!values || typeof values !== 'object') {
        return false;
    }

    const missing = state.missing || [];
    const actionDefinition = actionMap[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];

    for (const fieldName of Object.keys(values)) {
        const fieldValue = values[fieldName];

        if (fieldValue == null || fieldValue === '') {
            continue;
        }

        if (fieldName === 'request_name') {
            return true;
        }

        if (missing.includes(fieldName) || requiredFields.includes(fieldName)) {
            return true;
        }
    }

    return false;
}

//Function B5: Merge understanding values into collected / missing
function mergeValuesIntoRequest(collected, requiredFields, values, defaults, currentMissing) {
    const newCollected = { ...(defaults || {}), ...(collected || {}) };
    const missingSet = new Set(
        Array.isArray(currentMissing) && currentMissing.length > 0
            ? currentMissing
            : requiredFields.filter((fieldName) => {
                const fieldValue = newCollected[fieldName];
                return fieldValue == null || fieldValue === '';
            })
    );

    if (values) {
        for (const fieldName of Object.keys(values)) {
            const fieldValue = values[fieldName];

            if (fieldValue == null || fieldValue === '') {
                continue;
            }

            if (fieldName === 'request_name') {
                newCollected.request_name = String(fieldValue).trim();
                continue;
            }

            if (requiredFields.includes(fieldName) || missingSet.has(fieldName)) {
                newCollected[fieldName] = fieldValue;
                missingSet.delete(fieldName);
            }
        }
    }

    const missing = requiredFields.filter((fieldName) => {
        const fieldValue = newCollected[fieldName];
        return fieldValue == null || fieldValue === '';
    });

    return { collected: newCollected, missing };
}

//Function B6: Is the user allowed to pick execution mode 1–4 right now?
function isReadyForExecutionMode(state) {
    const actionDefinition = actionMap[state.pendingAction];
    const supportsExecutionModes = actionMap.actionRequiresExecutionModeSelection(actionDefinition);

    if (!supportsExecutionModes) {
        return false;
    }

    if (ActionStatusFunctions.isWaitingOnExecutionMode(state.status)) {
        return true;
    }

    const ready = (state.missing || []).length === 0;

    return ready && !state.executionMode;
}

//Function B7: Target state for a brand-new workflow request
function buildNewRequestDecision(understanding) {
    const action = understanding.action;
    const actionDefinition = actionMap[action];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const defaults = actionDefinition && actionDefinition.defaults ? actionDefinition.defaults : {};
    const supportsExecutionModes = actionMap.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest({}, requiredFields, understanding.values, defaults);
    const ready = merged.missing.length === 0;

    let status = ActionStatusFunctions.STATUS.WAITING_ON_FIELDS;

    if (ready) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(supportsExecutionModes, null);
    }

    const request = {
        action,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        responseType = supportsExecutionModes
            ? RESPONSE_TYPE.AWAITING_EXECUTION_MODE
            : RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        request,
        response: { type: responseType },
        replaceOpenRequest: true
    };
}

//Function B8: Target state after merging field values into an open request
function buildFieldsMergedDecision(state, values) {
    const actionDefinition = actionMap[state.pendingAction];
    const requiredFields = actionDefinition && Array.isArray(actionDefinition.requiredFields)
        ? actionDefinition.requiredFields
        : [];
    const supportsExecutionModes = actionMap.actionRequiresExecutionModeSelection(actionDefinition);

    const merged = mergeValuesIntoRequest(
        state.collected,
        requiredFields,
        values,
        null,
        state.missing
    );
    const ready = merged.missing.length === 0;

    let status = state.status;

    if (ready && ActionStatusFunctions.isCollectingFields(state.status)) {
        status = ActionStatusFunctions.statusWhenFieldsComplete(
            supportsExecutionModes,
            state.executionMode
        );
    }

    const request = {
        action: state.pendingAction,
        collected: merged.collected,
        missing: merged.missing,
        ready,
        status,
        executionMode: state.executionMode || null
    };

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (ready) {
        if (ActionStatusFunctions.isWaitingOnExecutionMode(status)) {
            responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
        } else if (ActionStatusFunctions.isWaitingOnConfirmation(status)) {
            responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
        }
    }

    return cloudpilotDecision(request, responseType);
}

//Function B9: User picked execution mode (Mode layer — STEP 4)
// Mode 4 (automatic): persist execution_mode → waiting_on_confirmation → user confirms → STEP 6 handler → capability → Atlas.
// Strategies 1–3 (instructions / cli / pr): STEP 7 → change/strategies/ (no STEP 6).
// Request templates: conversation/CloudPilotMessage.js → templates/requestTemplates.js
function handleExecutionModeSelection(state, mode) {
    const request = buildRequestFromState(state);
    request.executionMode = mode;

    if (mode === 'automatic') {
        request.status = ActionStatusFunctions.STATUS.WAITING_ON_CONFIRMATION;

        return cloudpilotDecision(request, RESPONSE_TYPE.AWAITING_CONFIRMATION);
    }

    request.status = ActionStatusFunctions.STATUS.COMPLETED;
    request.ready = true;

    const responseTypeByMode = {
        instructions: RESPONSE_TYPE.EXECUTION_INSTRUCTIONS,
        cli: RESPONSE_TYPE.EXECUTION_CLI,
        pr: RESPONSE_TYPE.EXECUTION_PR
    };

    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        request,
        response: { type: responseTypeByMode[mode] }
    };
}

//Function B10: Open request with no state change — derive chat response from current state
function resolveRequestChat(state) {
    const request = buildRequestFromState(state);
    const actionDefinition = actionMap[state.pendingAction];
    const supportsExecutionModes = actionMap.actionRequiresExecutionModeSelection(actionDefinition);
    const ready = (state.missing || []).length === 0;

    let responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;

    if (state.status === ActionStatusFunctions.STATUS.RUNNING) {
        responseType = RESPONSE_TYPE.WORKFLOW_RUNNING;
    } else if (state.status === ActionStatusFunctions.STATUS.FAILED) {
        responseType = RESPONSE_TYPE.REQUEST_FAILED;
    } else if (ActionStatusFunctions.isWaitingOnResourceScan(state.status)) {
        responseType = RESPONSE_TYPE.RESOURCE_NOT_FOUND;
    } else if (ready && supportsExecutionModes && !state.executionMode) {
        responseType = RESPONSE_TYPE.AWAITING_EXECUTION_MODE;
    } else if (ready && ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    } else if ((state.missing || []).length > 0) {
        responseType = RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS;
    } else if (ready) {
        responseType = RESPONSE_TYPE.AWAITING_CONFIRMATION;
    }

    return cloudpilotDecision(request, responseType);
}

//Function B11: informational actions that run immediately (no request row)
function resolveImmediateExecutionAction(state, understanding) {
    const actionName =
        understanding && understanding.action ? String(understanding.action).trim() : '';

    if (!actionName || actionName === 'general_chat') {
        return null;
    }

    const actionDefinition = actionMap[actionName];

    if (!actionDefinition || actionDefinition.requiresWorkflow || !actionDefinition.requiresExecution) {
        return null;
    }

    if (!state.pendingAction) {
        return actionName;
    }

    if (ActionStatusFunctions.isTerminalStatus(state.status)) {
        return actionName;
    }

    return null;
}

//Function B12: User said yes — start execution when confirmation rules are met
function shouldStartExecutionOnConfirm(state, reply) {
    if (!state.pendingAction) {
        return false;
    }

    if (reply !== 'confirm') {
        return false;
    }

    if (!ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        return false;
    }

    const actionDefinition = actionMap[state.pendingAction];
    const needsExecutionMode = actionMap.actionRequiresExecutionModeSelection(actionDefinition);

    if (needsExecutionMode) {
        if (state.executionMode === 'automatic') {
            return true;
        }

        return false;
    }

    return true;
}

//Function B13: Target state when user confirmed — run the open request
function buildExecutionStartedDecision(state) {
    const request = buildRequestFromState(state);
    request.status = ActionStatusFunctions.STATUS.RUNNING;

    return cloudpilotDecision(request, RESPONSE_TYPE.EXECUTION_STARTED);
}

//Function B14: Not about the open request — OpenAI only, row untouched
function buildGeneralChatDecision() {
    return {
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        request: null,
        response: { type: RESPONSE_TYPE.GENERAL_CHAT }
    };
}

//Function B15: Route a classified Question to CloudPilot fulfillment (never general chat)
// MESSAGE_RESPONSE=openai must not invent open-request / AI-spend / inventory facts.
// understanding (optional): values for ec2_inventory → scan_ec2 / s3_inventory → scan_s3 field merge
function resolveQuestionDecision(requestState, question, understanding) {
    const state = normalizeRequestState(requestState);
    const u = understanding || {};

    if (question === 'open_requests') {
        return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_OPEN_REQUESTS);
    }

    if (question === 'ai_spend') {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.IMMEDIATE_EXECUTION },
            execute: { action: 'show_ai_usage' }
        };
    }

    if (question === 'ec2_compute_cost') {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: buildRequestFromState(state),
            response: {
                type: RESPONSE_TYPE.EC2_COMPUTE_COST,
                values: u.values && typeof u.values === 'object' ? u.values : {}
            }
        };
    }

    // Question conceptually — reuse scan_ec2 / Atlas for truth (not General Chat)
    if (question === 'ec2_inventory') {
        return buildNewRequestDecision({
            action: 'scan_ec2',
            values: u.values && typeof u.values === 'object' ? u.values : {}
        });
    }

    // Question conceptually — reuse scan_s3 / Atlas for truth (not General Chat)
    if (question === 's3_inventory') {
        return buildNewRequestDecision({
            action: 'scan_s3',
            values: u.values && typeof u.values === 'object' ? u.values : {}
        });
    }

    console.warn(
        '[CLOUDPILOT_QUESTION_GUARDRAIL] Unhandled question="' +
            String(question) +
            '" — refusing general chat'
    );

    return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.LIST_OPEN_REQUESTS);
}

//Function B16: yes → existing scan_ec2; no/cancel → close; else re-ask scan offer
function resolveResourceScanOfferReply(state, understanding) {
    const u = understanding || {};

    if (u.reply === 'confirm') {
        return buildResourceScanAcceptedDecision(state);
    }

    if (u.reply === 'decline' || u.reply === 'cancel') {
        return {
            chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
            request: null,
            response: { type: RESPONSE_TYPE.RESOURCE_SCAN_DECLINED },
            closeRequest: true
        };
    }

    return cloudpilotDecision(buildRequestFromState(state), RESPONSE_TYPE.RESOURCE_NOT_FOUND);
}

//Function B17: Replace blocked mutation with configured scanAction + run it now
function buildResourceScanAcceptedDecision(state) {
    const blockedAction = actionMap[state.pendingAction] || {};
    const verifyMeta = blockedAction.verifyResource || {};
    const scanAction = verifyMeta.scanAction
        ? String(verifyMeta.scanAction).trim()
        : 'scan_ec2';
    const regionField = verifyMeta.regionField
        ? String(verifyMeta.regionField).trim()
        : 'region';
    const region = String((state.collected || {})[regionField] || '').trim();

    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        replaceOpenRequest: true,
        request: {
            action: scanAction,
            collected: region ? { region: region } : {},
            missing: region ? [] : ['region'],
            status: region
                ? ActionStatusFunctions.STATUS.RUNNING
                : ActionStatusFunctions.STATUS.WAITING_ON_FIELDS,
            executionMode: null,
            ready: Boolean(region)
        },
        response: {
            type: region
                ? RESPONSE_TYPE.EXECUTION_STARTED
                : RESPONSE_TYPE.ASK_FOR_MISSING_FIELDS
        }
    };
}

function cloudpilotDecision(request, responseType) {
    return {
        chatType: CHAT_TYPE.CLOUD_PILOT_RESPONDING,
        request,
        response: { type: responseType }
    };
}

module.exports = {
    decideNextStep,
    resolveQuestionDecision,
    buildFieldsMergedDecision
};
