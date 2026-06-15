/*
FUNCTIONS C: Conversation State (MVP)

Lightweight per-conversation state for CloudPilot multi-step flows.

NOTES:
- In-memory only (single Node process). Resets on restart.
- TODO: Replace Map with DB/Redis when you need multi-process + durable workflows.

FUNCTIONS A: Internal state helpers
	1) Function A1: nowMs
	2) Function A2: defaultConversationState
	3) Function A3: cloneDefaultState
	4) Function A4: isStaleState

FUNCTIONS B: Conversation key
	1) Function B1: Normalize conversation key

FUNCTIONS C: State storage API
	1) Function C1: Get State
	2) Function C2: Save State
	3) Function C3: Clear State

FUNCTIONS D: User message helpers
	1) Function D1: Detect cancel message

*/

//WHAT IS THIS WHAT A MESS MAYBE CLEAN

// TODO: Replace in-memory Map with DB/Redis for multi-process + durable workflows.
const stateStore = new Map();

const STATE_TTL_MS = Number(process.env.CLOUDPILOT_STATE_TTL_MS) || 30 * 60 * 1000;
const MAX_SLOT_ATTEMPTS = Number(process.env.CLOUDPILOT_STATE_MAX_SLOT_ATTEMPTS) || 8;

//FUNCTIONS A: Internal state helpers
//Function A1: nowMs
function nowMs() {
    return Date.now();
}

//Function A2: defaultConversationState
function defaultConversationState() {
    return {
        pendingAction: null,
        collected: {},
        missing: [],
        slotAttempts: 0,
        updatedAt: 0
    };
}

//Function A3: cloneDefaultState
function cloneDefaultState() {
    const base = defaultConversationState();
    return {
        pendingAction: base.pendingAction,
        collected: { ...base.collected },
        missing: base.missing.slice(),
        slotAttempts: base.slotAttempts,
        updatedAt: base.updatedAt
    };
}

//Function A4: isStaleState
function isStaleState(state) {
    if (!state || !state.updatedAt) {
        return false;
    }
    return nowMs() - state.updatedAt > STATE_TTL_MS;
}

//FUNCTIONS B: Conversation key
//Function B1: Normalize conversation key
function normalizeConversationKey(conversationID) {
    const id = Number(conversationID || 0);
    if (!Number.isFinite(id) || id <= 0) {
        return null;
    }
    return String(id);
}

//FUNCTIONS C: State storage API
//Function C1: Get State
function getConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return cloneDefaultState();
    }

    const existing = stateStore.get(key);
    if (!existing) {
        return cloneDefaultState();
    }

    if (isStaleState(existing)) {
        console.log('conversationState: stale state cleared (conversationID=' + key + ')');
        stateStore.delete(key);
        return cloneDefaultState();
    }

    return {
        pendingAction: existing.pendingAction,
        collected: { ...(existing.collected || {}) },
        missing: Array.isArray(existing.missing) ? existing.missing.slice() : [],
        slotAttempts: Number.isFinite(existing.slotAttempts) ? existing.slotAttempts : 0,
        updatedAt: existing.updatedAt || 0
    };
}

//Function C2: Save State
function saveConversationState(conversationID, state) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }

    const next = {
        pendingAction: state && state.pendingAction != null ? state.pendingAction : null,
        collected: { ...(state && state.collected ? state.collected : {}) },
        missing: Array.isArray(state && state.missing) ? state.missing.slice() : [],
        slotAttempts: Number.isFinite(state && state.slotAttempts) ? state.slotAttempts : 0,
        updatedAt: nowMs()
    };

    stateStore.set(key, next);
}

//Function C3: Clear State
function clearConversationState(conversationID) {
    const key = normalizeConversationKey(conversationID);
    if (!key) {
        return;
    }
    stateStore.delete(key);
}

//FUNCTIONS D: User message helpers
//Function D1: Detect cancel message
function isCancelMessage(userText) {
    const t = String(userText || '').trim().toLowerCase();
    if (!t) {
        return false;
    }

    const cancelPhrases = ['cancel', 'stop', 'never mind', 'nevermind', 'forget it', 'abort', 'quit'];
    return cancelPhrases.some((p) => t === p || t.includes(p));
}

module.exports = {
    // STATE_TTL_MS, // Unused externally — only referenced internally by isStaleState()
    MAX_SLOT_ATTEMPTS,
    normalizeConversationKey,
    getConversationState,
    saveConversationState,
    clearConversationState,
    isCancelMessage
};
