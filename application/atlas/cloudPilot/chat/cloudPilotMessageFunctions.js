const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const RequestStateFunctions = require('../requests/functions/requestLoadFunctions');
const ResourceVerificationFunctions = require('../requests/functions/resourceVerificationFunctions');
const CloudPilotIntelligence = require('../../cloudPilotIntelligence/CloudPilotIntelligence');
const MasterDecision = require('../decide/masterDecision');
const OpenRequestEffectFunctions = require('../requests/interpretOpenRequestEffect');
const RequestWorkflow = require('../requests/workflow');
const GeneralConversation = require('./general/GeneralConversation');
const RequestConversation = require('./request/RequestConversation');
const HistoryFunctions = require('../history/functions/historyFunctions');
const {
    buildCurrentStateContext
} = require('../../cloudPilotIntelligence/context/contextTypes/cloudPilotCurrentStateContext');
const MasterLogging = require('../logging/masterLogging');
const actionMap = require('../masterCloudPilotCapabilities');

/*
CloudPilot Message Pipeline (processMessage)

ONE TURN = User Message → Understand Message → Handle Request → Prepare Message Reply → Reply Message
processMessage() is the whole Turn, not one of those stages.
See: doc/development/how_to/cloud_pilot_turn.md

Design principle: Every user message is exactly one conversation.

Glossary
  Request              — user wants CloudPilot to do something (cloudpilot_requests)
  Action               — thing CloudPilot knows how to do (actionMap)
  General Conversation — user is just talking
  Request Conversation — help user accomplish work (orchestrates STEPS 5–7)

First gate (after STEP 4)
  General Conversation  → conversation/general/GeneralConversation.js → return (skip 5–6)
  Request Conversation  → STEPS 5–7 (maintain state → perform work → speak)

STEP 1  Normalize message (HTTP: Build Message is STEP 1 in messages.js)
STEP 2  Initial State
STEP 3  Region Search (compact log inside understand)
STEP 4  Message Understanding
STEP 5  Decision
STEP 6  Execute (or Skipped — General Conversation)
STEP 7  Save CloudPilot Message (messages.js)
STEP 8  Final Response (messages.js)

OpenAI capability blocks are buffered and flushed after STEP 8 (Story 2).

HOW  = capabilities/
WHERE = capabilities/atlas/atlasPost.js

*/

/*
FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
    1) Function A1: Process Message

FUNCTIONS B: Helpers
    1) Function B1: Apply conversation outcome to processMessage shape
    2) Function B2: Clone Action Status
    3) Function B3: Get Current User Message
    4) Function B4: Normalize processMessage context
    5) Function B5: Build short response outcome (STEP 7 debug log)
    6) Function B6: Attach undoAvailable hint after history is recorded
*/

//FUNCTIONS A: CloudPilot (Atlas) — STEPS 1–7 pipeline
//Function A1: Process Message (pipeline)
async function processMessage(rawUserMessage, conversationID, context) {
    openAIFunctions.resetOpenAIRequestCounter();

    const processMessageContext = normalizeProcessMessageContext(context);
    var currentUserMessage = null;
    var currentRequestState = null;
    var activeRequestAction = null;

    var processMessageOutcome = {
        success: false, 
        cloudPilotMessage: "",
        cloudPilot: { 
            userRequest: null, // e.g. "scan_ec2", "toggle_ec2", "general_chat"
            //Later Add Policy

            actionStatus: {
                type: null, // What action the user asked for ("scan_ec2", "toggle_ec2") null if it is just general_chat
                ready: false,

                missingFields: [],
                collectedFields: {},
                askedForFields: {},
                executionMode: null
            },
            atlasExecution: {
                status: "idle", // "idle" | "running" | "completed" | "failed"
                actionId: null, // Atlas execution ID
                startedAt: null,
                completedAt: null,
                error: null
            },
            undoAvailable: false
        },
        atlasResponse: null, //This is the response we get from Atlas after an AWS interaction
        error: null 
    };

    try {
        //STEP 1: Normalize user message
        const currentUserMessageOutcome = getCurrentUserMessage(rawUserMessage);

        if (!currentUserMessageOutcome.success) {
            processMessageOutcome.success = false;
            processMessageOutcome.error = currentUserMessageOutcome.error;
            return processMessageOutcome;         
        }

        currentUserMessage = currentUserMessageOutcome.currentUserMessage;

        // MASTER STEP 1: OPEN REQUEST
        currentRequestState = await RequestStateFunctions.getUsersActionState(conversationID);
        activeRequestAction = currentRequestState.pendingAction;

        const hasOpenRequest = Boolean(
            currentRequestState && currentRequestState.pendingAction
        );

        MasterLogging.logOpenRequest(hasOpenRequest, currentRequestState);

        // MASTER STEP 2: UNDERSTAND — one Intelligence call; searches stay inside understandMessage
        MasterLogging.logUnderstandStart();
        const messageUnderstanding = await CloudPilotIntelligence.understandMessage(
            currentUserMessage,
            currentRequestState
        );

        MasterLogging.logUnderstandingResult(messageUnderstanding);

        // MASTER STEP 3: DECIDE — pure decision only (no apply / fulfill / respond)
        // rawMessage lets Master Decision interpret open-request effects internally when needed.
        messageUnderstanding.rawMessage = currentUserMessage;
        let decision = MasterDecision.decideNextStep({
            understanding: messageUnderstanding,
            requestState: currentRequestState
        });

        MasterLogging.logDecision(decision, buildDecisionLogMeta(decision));

        // Decide early-return checkpoint removed (Checkpoint 4).
        // Pipeline continues: open-request effect → Decide (with effect) → Fulfill → Respond.

        MasterLogging.logExecutionDetail('STEP 2: Initial State');
        await RequestStateFunctions.printUsersActionState(conversationID, 'INITIAL STATE:');

        // TEMPORARY: CLOUDPILOT_CURRENT_STATE_TEST
        // Read-only early return: prove open-request existence + Current State facts after STEP 2.
        // When unset / not "1", processMessage continues unchanged below.
        if (String(process.env.CLOUDPILOT_CURRENT_STATE_TEST || '').trim() === '1') {
            const currentState = buildCurrentStateContext({
                requestState: currentRequestState
            });
            const stateData = currentState && currentState.data ? currentState.data : {};
            const hasOpenRequest = stateData.hasOpenRequest === true;
            const openRequest = stateData.openRequest || null;

            console.log('[CLOUDPILOT CURRENT STATE TEST]');
            console.log('hasOpenRequest: ' + hasOpenRequest);

            if (hasOpenRequest && openRequest) {
                console.log('pendingAction: ' + String(openRequest.action || ''));
                console.log('status: ' + String(openRequest.status || ''));
                console.log(
                    'collected: ' + JSON.stringify(openRequest.collected || {})
                );
                console.log('missing: ' + JSON.stringify(openRequest.missing || []));
            }

            const cloudPilotMessage = formatCurrentStateTestMessage(stateData);

            processMessageOutcome.success = true;
            processMessageOutcome.cloudPilotMessage = cloudPilotMessage;
            processMessageOutcome.logFinalResponse = buildShortResponseOutcome({
                success: true,
                cloudPilotMessage: cloudPilotMessage,
                error: null
            });

            return await attachUndoAvailable(
                applyConversationToProcessMessageOutcome(
                    processMessageOutcome,
                    {
                        success: true,
                        cloudPilotMessage: cloudPilotMessage,
                        atlasResponse: null,
                        error: null
                    },
                    currentRequestState,
                    activeRequestAction
                ),
                conversationID
            );
        }
        // TEMPORARY: CLOUDPILOT_CURRENT_STATE_TEST (end)

        // Decision already computed in MASTER STEP 3 above (rebuild checkpoint).
        // When Fulfill is re-enabled, continue from decision / messageUnderstanding.

        // Step 3: does any part of this message affect the open request? (interpretation only)
        const openRequestEffectResult = OpenRequestEffectFunctions.interpretOpenRequestEffect(
            messageUnderstanding,
            currentRequestState,
            currentUserMessage
        );
        messageUnderstanding.openRequestEffectResult = openRequestEffectResult;
        messageUnderstanding.affectsOpenRequest = openRequestEffectResult.affectsOpenRequest;
        messageUnderstanding.openRequestEffect = openRequestEffectResult.openRequestEffect;
        OpenRequestEffectFunctions.logOpenRequestEffect(openRequestEffectResult);

        MasterLogging.logDecisionDetail('STEP 4: Message Understanding');
        MasterLogging.logDecisionDetail(JSON.stringify(messageUnderstanding, null, 2));
        MasterLogging.logDecisionDetail(' ');


        //STEP 5: Decide — which conversation is this?
        decision = MasterDecision.decideNextStep({
            understanding: messageUnderstanding,
            requestState: currentRequestState
        });

    MasterLogging.logDecisionDetail('STEP 5: Decision');
    MasterLogging.logDecisionDetail(JSON.stringify(decision, null, 2));
    MasterLogging.logDecisionDetail(' ');

    // General Conversation — skip execute
    // Guardrail: Questions never answer via MESSAGE_RESPONSE / OpenAI general chat
    if (GeneralConversation.isGeneralConversation(decision)) {
        if (messageUnderstanding.question) {
            console.warn(
                '[CLOUDPILOT_QUESTION_GUARDRAIL] question=' +
                    messageUnderstanding.question +
                    ' was routed to general chat; correcting to CloudPilot Question path'
            );
            decision = MasterDecision.resolveQuestionDecision(
                currentRequestState,
                messageUnderstanding.question,
                messageUnderstanding
            );
        }
    }

    // Step 3 mixed / leave-alone with information: apply open-request field updates
    // without forcing the whole turn into RequestConversation speech.
    const effectBody = messageUnderstanding.openRequestEffect || {};

    // Apply information merge when continuing normal conversation (mixed message)
    // or when decide routed to general/question while values were extracted.
    if (
        messageUnderstanding.affectsOpenRequest === true &&
        effectBody.type === 'information' &&
        effectBody.values &&
        Object.keys(effectBody.values).length > 0 &&
        (effectBody.continueNormalConversation || messageUnderstanding.question) &&
        (GeneralConversation.isGeneralConversation(decision) || messageUnderstanding.question)
    ) {
        MasterLogging.logDecisionDetail(
            'STEP 5b: Apply open-request information (continue normal conversation)'
        );
        const mergeDecision = MasterDecision.buildFieldsMergedDecision(
            currentRequestState,
            effectBody.values
        );
        const mergeOutcome = await RequestWorkflow.store(mergeDecision, {
            conversationID: conversationID,
            context: processMessageContext,
            requestState: currentRequestState
        });
        if (mergeOutcome && mergeOutcome.request) {
            currentRequestState = mergeOutcome.request;
            activeRequestAction = currentRequestState.pendingAction;
        }
        MasterLogging.logDecisionDetail(JSON.stringify(mergeOutcome, null, 2));
        MasterLogging.logDecisionDetail(' ');
    }

    if (GeneralConversation.isGeneralConversation(decision)) {
        MasterLogging.logExecutionDetail('STEP 6: Execute');
        MasterLogging.logExecutionDetail('Skipped (General Conversation)');
        MasterLogging.logExecutionDetail(' ');

        MasterLogging.logFulfill({
            decision: decision,
            skippedGeneral: true
        });

        const conversationOutcome = await GeneralConversation.conversation({
            ...processMessageContext,
            currentUserMessage: currentUserMessage,
            conversationID: conversationID,
            requestState: currentRequestState
        });

        MasterLogging.logRespond(conversationOutcome, decision);

        const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
        processMessageOutcome.logFinalResponse = shortResponseOutcome;

        return await attachUndoAvailable(
            applyConversationToProcessMessageOutcome(
                processMessageOutcome,
                conversationOutcome,
                currentRequestState,
                activeRequestAction
            ),
            conversationID
        );
    }

    //STEP 6: Request Conversation — maintain state + perform work
    MasterLogging.logExecutionDetail('STEP 6: Execute');

    const requestOutcome = await RequestWorkflow.store(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        requestState: currentRequestState
    });

    MasterLogging.logExecutionDetail(JSON.stringify(requestOutcome, null, 2));
    MasterLogging.logExecutionDetail(' ');

    if (requestOutcome.request) {
        currentRequestState = requestOutcome.request;
        activeRequestAction = currentRequestState.pendingAction;
    }

    if (requestOutcome.success) {
        processMessageOutcome.success = true;
    }

    // Existing-resource preflight (pause/resume): Atlas verify after persist, before mode speech
    // Doc: feature_verify_request.md Step 2 — decideNextStep stays sync; no Intelligence verify
    const preflightOutcome = await ResourceVerificationFunctions.runVerifyResourcePreflight(
        decision,
        currentRequestState
    );

    if (preflightOutcome.requestState) {
        currentRequestState = preflightOutcome.requestState;
        activeRequestAction = currentRequestState.pendingAction;
    }

    if (preflightOutcome.blocked) {
        MasterLogging.logExecutionDetail('STEP 6b: verifyResource preflight blocked progression');
        MasterLogging.logExecutionDetail(JSON.stringify(preflightOutcome.verification, null, 2));
        MasterLogging.logExecutionDetail(' ');
    }

    //RUN: executeRequest → runAction() → handler → capability → atlasPost → Atlas
    const executionOutcome = await RequestWorkflow.execute(decision, {
        conversationID: conversationID,
        context: processMessageContext,
        currentUserMessage: currentUserMessage,
        requestState: currentRequestState
    });

    if (executionOutcome && executionOutcome.ran) {
        currentRequestState = await RequestStateFunctions.getUsersActionState(conversationID);
        activeRequestAction = currentRequestState.pendingAction;

        if (executionOutcome.success) {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'completed';
        } else {
            processMessageOutcome.cloudPilot.atlasExecution.status = 'failed';
            processMessageOutcome.error = executionOutcome.error;
        }
    }

    MasterLogging.logFulfill({
        decision: decision,
        requestOutcome: requestOutcome,
        executionOutcome: executionOutcome,
        requestStateAfter: currentRequestState
    });

    await RequestStateFunctions.printUsersActionState(conversationID, "FINAL STATE:");


    // Speak (reply text) — logged as STEP 8 Final Response after save in messages.js
    const conversationOutcome = await RequestConversation.conversation(decision, {
        conversationID: conversationID,
        currentUserMessage: currentUserMessage,
        requestOutcome: requestOutcome,
        requestState: currentRequestState,
        executionOutcome: executionOutcome,
        context: processMessageContext
    });

    MasterLogging.logRespond(conversationOutcome, decision);

    const shortResponseOutcome = buildShortResponseOutcome(conversationOutcome);
    processMessageOutcome.logFinalResponse = shortResponseOutcome;

    return await attachUndoAvailable(
        applyConversationToProcessMessageOutcome(
            processMessageOutcome,
            conversationOutcome,
            currentRequestState,
            activeRequestAction
        ),
        conversationID
    );

    } finally {
        // One footer owner for the whole processMessage turn (runs after early returns).
        if (MasterLogging.logOpenAIDetailOn) {
            openAIFunctions.flushOpenAILogs();
        } else {
            openAIFunctions.discardOpenAILogs();
        }

        if (MasterLogging.logOpenAICostTotalOn) {
            openAIFunctions.logOpenAIMessageFooter();
        }

        MasterLogging.logFooter();
    }
}


//FUNCTIONS B: Helpers
//Function B1: Merge conversation outcome into processMessage API shape
function applyConversationToProcessMessageOutcome(
    processMessageOutcome,
    conversationOutcome,
    currentRequestState,
    activeRequestAction
) {
    if (conversationOutcome.cloudPilotMessage) {
        processMessageOutcome.cloudPilotMessage = conversationOutcome.cloudPilotMessage;
        processMessageOutcome.success = true;
    }

    if (conversationOutcome.atlasResponse) {
        processMessageOutcome.atlasResponse = conversationOutcome.atlasResponse;
    }

    if (conversationOutcome.error) {
        processMessageOutcome.error = conversationOutcome.error;
    }

    if (activeRequestAction) {
        processMessageOutcome.cloudPilot.userRequest = activeRequestAction;
    }

    const actionReady = !currentRequestState.missing || currentRequestState.missing.length === 0;
    processMessageOutcome.cloudPilot.actionStatus = cloneActionStatus(
        currentRequestState,
        activeRequestAction,
        actionReady
    );

    return processMessageOutcome;
}

// Debug-only Decide log metadata from capability catalog (caller owns actionMap lookup)
function buildDecisionLogMeta(decision) {
    const result = decision || {};
    let capabilityName = null;

    if (result.execute && result.execute.action) {
        capabilityName = String(result.execute.action).trim() || null;
    } else if (result.request && typeof result.request === 'object') {
        const name = result.request.action || result.request.pendingAction;
        capabilityName = name ? String(name).trim() || null : null;
    }

    const definition = capabilityName ? actionMap[capabilityName] : null;
    let requestType = null;
    let userRequest = null;

    if (result.request && result.request.requestType != null) {
        requestType = result.request.requestType;
    } else if (result.requestType != null) {
        requestType = result.requestType;
    } else if (definition && definition.requestType != null) {
        requestType = definition.requestType;
    }

    if (definition && definition.capability && definition.capability.description) {
        userRequest = String(definition.capability.description).trim() || null;
    } else if (definition && definition.actionLabel) {
        userRequest = String(definition.actionLabel).trim() || null;
    }

    return {
        requestType: requestType,
        userRequest: userRequest
    };
}

//Function B6: After execute + record history, expose whether undo is available (H6)
async function attachUndoAvailable(processMessageOutcome, conversationID) {
    processMessageOutcome.cloudPilot.undoAvailable = await HistoryFunctions.hasUndoAvailable({
        conversationId: conversationID
    });

    return processMessageOutcome;
}

//Function B2: Clone Action Status
function cloneActionStatus(state, activeRequestAction, ready) {
    return {
        type: activeRequestAction,
        ready: Boolean(ready),
        executionMode: state.executionMode || null,
        missingFields: [...(state.missing || [])],
        collectedFields: { ...(state.collected || {}) },
        askedForFields: { ...(state.asked || {}) }
    };
}

//Function B3: Get Current User Message
function getCurrentUserMessage(rawUserMessage) {
    const normalizedMessageOutcome = openAIFunctions.normalizeUserMessageForModel(rawUserMessage);

    if (!normalizedMessageOutcome.ok) {
        // console.log("STEP 1: Normalize message outcome failed");

        return {
            success: false,
            currentUserMessage: null,
            error: normalizedMessageOutcome.message
        };
    }

    const currentUserMessage = normalizedMessageOutcome.text;

    // console.log("STEP 1: Normalize message outcome OK");
    // console.log("Current user message (text): " + currentUserMessage);

    return {
        success: true,
        currentUserMessage: currentUserMessage,
        error: null
    };
}

//Function B4: Normalize processMessage context (masterSite, user, selectedFinding)
function normalizeProcessMessageContext(context) {
    const raw = context || {};

    return {
        masterSite: raw.masterSite || 'Cloud Pilot',
        requestedByUserName: String(raw.requestedByUserName || raw.messageFrom || '').trim(),
        selectedFinding: raw.selectedFinding || null
    };
}

// TEMPORARY: CLOUDPILOT_CURRENT_STATE_TEST — readable reply for Current State proof
function formatCurrentStateTestMessage(stateData) {
    const data = stateData || {};
    const hasOpenRequest = data.hasOpenRequest === true;
    const openRequest = data.openRequest;

    if (!hasOpenRequest || !openRequest) {
        return 'Open request: NO';
    }

    const lines = [
        'Open request: YES',
        '',
        'Action: ' + String(openRequest.label || openRequest.action || ''),
        'Status: ' + String(openRequest.status || ''),
    ];

    if (openRequest.action) {
        lines.splice(2, 0, 'Type: ' + String(openRequest.action));
    }

    const collected =
        openRequest.collected && typeof openRequest.collected === 'object'
            ? openRequest.collected
            : {};
    const collectedNames = Object.keys(collected);

    if (collectedNames.length > 0) {
        lines.push('Collected:');
        for (let i = 0; i < collectedNames.length; i++) {
            const fieldName = collectedNames[i];
            const value = collected[fieldName];

            if (value == null || typeof value === 'object') {
                continue;
            }

            lines.push('- ' + fieldName + ': ' + String(value));
        }
    } else {
        lines.push('Collected: (none)');
    }

    const missing = Array.isArray(openRequest.missing) ? openRequest.missing : [];

    if (missing.length > 0) {
        lines.push('Missing: ' + missing.join(', '));
    } else {
        lines.push('Missing: none');
    }

    return lines.join('\n');
}

// Helper: Short deterministic checkpoint reply after Decide (no conversational wording)
function buildDecideCheckpointMessage(decision) {
    const result = decision || {};
    const request = result.request;
    const requestAction =
        request && typeof request === 'object'
            ? request.action || request.pendingAction || null
            : result.execute && result.execute.action
              ? result.execute.action
              : null;
    const responseType =
        result.response && result.response.type ? result.response.type : null;
    const requestType =
        request && request.requestType != null
            ? request.requestType
            : result.requestType != null
              ? result.requestType
              : null;
    const permission =
        request && request.permission != null
            ? request.permission
            : result.permission != null
              ? result.permission
              : null;
    const status = request && request.status ? request.status : null;
    const parts = ['Checkpoint: Decide complete.'];

    if (requestAction) {
        parts.push('Request action: ' + String(requestAction) + '.');
    }

    if (requestType != null) {
        parts.push('requestType: ' + String(requestType) + '.');
    }

    if (permission != null) {
        parts.push('permission: ' + String(permission) + '.');
    }

    if (status) {
        parts.push('status: ' + String(status) + '.');
    }

    if (responseType) {
        parts.push('Response type: ' + String(responseType) + '.');
    }

    return parts.join(' ');
}

//Function B5: Short STEP 7 log — top-level fields + atlasResponse.summary only
function buildShortResponseOutcome(responseOutcome) {
    const source = responseOutcome || {};

    const shortResponseOutcome = {
        success: source.success,
        cloudPilotMessage: source.cloudPilotMessage,
        chatType: source.chatType,
        error: source.error ?? null
    };

    const atlasResponse = source.atlasResponse;

    if (!atlasResponse) {
        shortResponseOutcome.atlasResponse = null;
        return shortResponseOutcome;
    }

    if (atlasResponse.summary) {
        shortResponseOutcome.atlasResponse = {
            summary: atlasResponse.summary
        };
        return shortResponseOutcome;
    }

    const navigatorMeta =
        atlasResponse.navigatorResponse &&
        atlasResponse.navigatorResponse.data &&
        atlasResponse.navigatorResponse.data.meta;

    if (navigatorMeta) {
        shortResponseOutcome.atlasResponse = {
            summary: navigatorMeta
        };
        return shortResponseOutcome;
    }

    const {
        navigatorResponse,
        instances,
        findings,
        ...atlasResponseWithoutBulk
    } = atlasResponse;

    shortResponseOutcome.atlasResponse =
        Object.keys(atlasResponseWithoutBulk).length > 0
            ? atlasResponseWithoutBulk
            : null;

    return shortResponseOutcome;
}

module.exports = { processMessage };
