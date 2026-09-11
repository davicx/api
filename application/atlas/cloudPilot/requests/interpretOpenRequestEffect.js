const actionMap = require('../masterCloudPilotCapabilities');
const ActionStatusFunctions = require('./functions/requestStatusFunctions');

/*
STEP 3 — Open request effect (interpretation only)

Does ANY PART of this message affect the open request?
Does NOT execute AWS, speak, or close rows by itself.

MVP default AWS region (when a quiet read later needs one): us-west-2
(Do not build scope engine here.)
*/

const MVP_DEFAULT_AWS_REGION = 'us-west-2';

function emptyEffect() {
    return {
        affectsOpenRequest: false,
        openRequestEffect: {
            type: null,
            values: {},
            continueNormalConversation: false
        }
    };
}

function normalizeState(requestState) {
    const state = requestState || {};
    return {
        pendingAction: state.pendingAction || null,
        status: state.status || null,
        executionMode: state.executionMode || null,
        missing: Array.isArray(state.missing) ? state.missing.slice() : [],
        collected: { ...(state.collected || {}) }
    };
}

function pickApplicableValues(state, values) {
    const out = {};
    if (!values || typeof values !== 'object') {
        return out;
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
            out[fieldName] = fieldValue;
            continue;
        }
        if (missing.includes(fieldName) || requiredFields.includes(fieldName)) {
            out[fieldName] = fieldValue;
        }
    }

    return out;
}

function hasApplicableValues(state, values) {
    return Object.keys(pickApplicableValues(state, values)).length > 0;
}

/** True when message looks like more than a bare field fill (e.g. region + DynamoDB ask). */
function looksLikeMixedMessage(message, applicableValues) {
    let rest = String(message || '');

    if (applicableValues && applicableValues.region) {
        rest = rest.replace(new RegExp(String(applicableValues.region).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ');
    }

    rest = rest
        .replace(/\b(use|region|in|for|me|please|set|to|my|the|a|an)\b/gi, ' ')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = rest.split(/\s+/).filter(Boolean);
    return words.length >= 3;
}

function isConfirmAllowed(state) {
    if (!ActionStatusFunctions.isWaitingOnConfirmation(state.status)) {
        return false;
    }

    const actionDefinition = actionMap[state.pendingAction];
    const needsExecutionMode = actionMap.actionRequiresExecutionModeSelection(actionDefinition);

    if (needsExecutionMode) {
        return state.executionMode === 'automatic';
    }

    return true;
}

/**
 * @param {object} understanding — from understandMessage
 * @param {object} requestState — loaded open request (or empty)
 * @param {string} [message] — original user text (for mixed detection)
 */
function interpretOpenRequestEffect(understanding, requestState, message) {
    const state = normalizeState(requestState);

    if (!state.pendingAction) {
        return emptyEffect();
    }

    const u = understanding || {};
    const applicableValues = pickApplicableValues(state, u.values);

    // 1) Cancellation
    if (u.reply === 'cancel') {
        return {
            affectsOpenRequest: true,
            openRequestEffect: {
                type: 'cancel',
                values: {},
                continueNormalConversation: false
            }
        };
    }

    // 2) Information for open request (region, etc.)
    if (Object.keys(applicableValues).length > 0) {
        const continueNormal =
            Boolean(u.question) || looksLikeMixedMessage(message, applicableValues);

        return {
            affectsOpenRequest: true,
            openRequestEffect: {
                type: 'information',
                values: applicableValues,
                continueNormalConversation: continueNormal
            }
        };
    }

    // 3) Confirmation — only when Current State is waiting on confirmation
    if (u.reply === 'confirm' && isConfirmAllowed(state)) {
        return {
            affectsOpenRequest: true,
            openRequestEffect: {
                type: 'confirm',
                values: {},
                continueNormalConversation: false
            }
        };
    }

    // 4) Leave alone (including soft "yes" when not waiting on confirmation)
    return emptyEffect();
}

function logOpenRequestEffect(effect) {
    const e = effect || emptyEffect();
    const body = e.openRequestEffect || {};

    console.log('OPEN REQUEST EFFECT');
    if (!e.affectsOpenRequest) {
        console.log('affects: NO');
        console.log(' ');
        return;
    }

    console.log('affects: YES');
    console.log('type: ' + (body.type || 'null'));
    if (body.type === 'information' && body.values && Object.keys(body.values).length > 0) {
        console.log('values:');
        for (const key of Object.keys(body.values)) {
            console.log('  ' + key + ': ' + body.values[key]);
        }
    }
    if (body.continueNormalConversation) {
        console.log('continueNormalConversation: YES');
    }
    console.log(' ');
}

module.exports = {
    MVP_DEFAULT_AWS_REGION,
    interpretOpenRequestEffect,
    logOpenRequestEffect,
    hasApplicableValues,
    pickApplicableValues
};
