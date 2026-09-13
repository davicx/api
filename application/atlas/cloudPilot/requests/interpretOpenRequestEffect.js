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

// Stored on asked JSON — eligible only until a non-request turn clears it.
const SOFT_ACCEPT_OFFER_KEY = '__softAcceptOffer';

const SOFT_ACCEPT_PHRASES = [
    'ok',
    'okay',
    'yes',
    'yep',
    'yup',
    'sure',
    'sounds good',
    'that works',
    'go ahead',
    'perfect',
    'fine'
];

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
        collected: { ...(state.collected || {}) },
        asked: { ...(state.asked || {}) }
    };
}

function normalizeSoftAcceptMessage(message) {
    return String(message || '')
        .toLowerCase()
        .trim()
        .replace(/[.!?]+$/g, '');
}

function isSoftAcceptPhrase(message) {
    const normalized = normalizeSoftAcceptMessage(message);

    if (!normalized) {
        return false;
    }

    return SOFT_ACCEPT_PHRASES.indexOf(normalized) !== -1;
}

function readSoftAcceptOffer(asked) {
    const offer = asked && asked[SOFT_ACCEPT_OFFER_KEY];

    if (!offer || typeof offer !== 'object') {
        return null;
    }

    const fieldName = offer.field != null ? String(offer.field).trim() : '';
    const fieldValue = offer.value != null ? String(offer.value).trim() : '';

    if (!fieldName || !fieldValue) {
        return null;
    }

    return { field: fieldName, value: fieldValue };
}

// Narrow soft accept: one missing field + CloudPilot just proposed a value for it.
function trySoftAcceptEffect(state, message) {
    if (!ActionStatusFunctions.isCollectingFields(state.status)) {
        return null;
    }

    if (!isSoftAcceptPhrase(message)) {
        return null;
    }

    const missing = state.missing || [];

    if (missing.length !== 1) {
        return null;
    }

    const offer = readSoftAcceptOffer(state.asked);

    if (!offer) {
        return null;
    }

    if (offer.field !== missing[0]) {
        return null;
    }

    return {
        affectsOpenRequest: true,
        openRequestEffect: {
            type: 'information',
            values: { [offer.field]: offer.value },
            continueNormalConversation: false
        }
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
    if (looksLikeStructuredFieldFill(message)) {
        return false;
    }

    let rest = String(message || '');
    const values = applicableValues && typeof applicableValues === 'object' ? applicableValues : {};

    if (values.region) {
        const region = String(values.region);
        rest = rest.replace(new RegExp(region.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), ' ');
        // "west 2" / "west-2" after extracting us-west-2
        const regionTail = region.replace(/^us-/i, '').replace(/-/g, '[\\s-]*');
        if (regionTail) {
            rest = rest.replace(new RegExp('\\b' + regionTail + '\\b', 'ig'), ' ');
        }
    }

    rest = rest
        .replace(
            /\b(use|using|region|in|for|me|please|set|to|my|the|a|an|yes|yeah|yep|ok|okay|sure|lets|let|go|with|that|works|sounds|good|fine|proceed)\b/gi,
            ' '
        )
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const words = rest.split(/\s+/).filter(Boolean);
    return words.length >= 3;
}

/** Structured field lines only — e.g. region: "us-west-2" — not a mixed conversation turn */
function looksLikeStructuredFieldFill(message) {
    const lines = String(message || '')
        .split(/\n/)
        .map(function (line) {
            return String(line || '').trim();
        })
        .filter(Boolean);

    if (lines.length === 0) {
        return false;
    }

    return lines.every(function (line) {
        return /^[a-z_][a-z0-9_]*\s*:\s*.+/i.test(line);
    });
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

    // 2b) Soft accept of a value CloudPilot just suggested (waiting_on_fields only)
    const softAcceptEffect = trySoftAcceptEffect(state, message);

    if (softAcceptEffect) {
        return softAcceptEffect;
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

    // 4) Leave alone (including soft "yes" when not waiting on confirmation / no offer)
    return emptyEffect();
}

function logOpenRequestEffect(effect) {
    const e = effect || emptyEffect();
    const body = e.openRequestEffect || {};
    const MasterLogging = require('../logging/masterLogging');

    MasterLogging.logDecisionDetail('OPEN REQUEST EFFECT');
    if (!e.affectsOpenRequest) {
        MasterLogging.logDecisionDetail('affects: NO');
        MasterLogging.logDecisionDetail(' ');
        return;
    }

    MasterLogging.logDecisionDetail('affects: YES');
    MasterLogging.logDecisionDetail('type: ' + (body.type || 'null'));
    if (body.type === 'information' && body.values && Object.keys(body.values).length > 0) {
        MasterLogging.logDecisionDetail('values:');
        for (const key of Object.keys(body.values)) {
            MasterLogging.logDecisionDetail('  ' + key + ': ' + body.values[key]);
        }
    }
    if (body.continueNormalConversation) {
        MasterLogging.logDecisionDetail('continueNormalConversation: YES');
    }
    MasterLogging.logDecisionDetail(' ');
}

module.exports = {
    MVP_DEFAULT_AWS_REGION,
    SOFT_ACCEPT_OFFER_KEY,
    interpretOpenRequestEffect,
    logOpenRequestEffect,
    hasApplicableValues,
    isSoftAcceptPhrase,
    readSoftAcceptOffer,
    pickApplicableValues
};
