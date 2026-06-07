const GetActionFunctions = require('./getAction');

/*
FUNCTIONS A: Message understanding (P1 — action only; values/reply in P2+)
    1) Function A1: buildUnderstandingContext
    2) Function A2: parseMessage
    3) Function A3: understandUserMessage
*/

//Function A1: Build context object for parseMessage from loaded request state
function buildUnderstandingContext(actionState) {
    const state = actionState || {};

    return {
        activeRequest: state.pendingAction || null,
        status: state.status || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        executionMode: state.executionMode || null
    };
}

//Function A2: Parse user message into structured signals (no DB, no chat text)
async function parseMessage(message, context) {
    const ctx = context || {};
    const activeRequest = ctx.activeRequest || null;

    const emptySignals = {
        action: null,
        values: {},
        reply: null,
        conversation: null,
        ambiguous: false,
        candidates: [],
        source: 'rules',
        confidence: 1.0
    };

    // Phase 1: skip action detection when a request is already open (continuations → P2 getValues)
    if (activeRequest) {
        return emptySignals;
    }

    const actionResult = GetActionFunctions.getAction(message);

    return {
        action: actionResult.action,
        values: {},
        reply: null,
        conversation: null,
        ambiguous: actionResult.ambiguous,
        candidates: actionResult.candidates.slice(),
        source: actionResult.source,
        confidence: actionResult.confidence
    };
}

//Function A3: Orchestrator entry — build context from state, then parse message
async function understandUserMessage(message, actionState) {
    const context = buildUnderstandingContext(actionState);

    return parseMessage(message, context);
}

module.exports = { buildUnderstandingContext, parseMessage, understandUserMessage };
