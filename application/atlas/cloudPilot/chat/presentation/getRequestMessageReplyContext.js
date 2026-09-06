const FieldPromptExamples = require('../templates/fieldPromptExamples');

/*
FUNCTIONS A: Request Message Reply context (CloudPilot owns truth)
    1) Function A1: getRequestMessageReplyContext

HELPERS
    1) Helper H1: isRequestPresentationEvent
    2) Helper H2: buildActionSummary
    3) Helper H3: copyCollectedFields
    4) Helper H4: latestCollectedFieldName
    5) Helper H5: buildExecutionModeOptions
    6) Helper H6: buildConfirmOrCancelLine

Phase 1: missing-field asks + optional request name.
Phase 2: field acknowledgement, execution-mode tone, confirmation polish.
OpenAI may only rephrase these values — never invent fields or values.
Mode option labels stay CloudPilot-owned (1–4 must not be rewritten).
*/

const REQUEST_PRESENTATION_EVENTS = {
    new_action: true,
    missing_fields_given: true,
    workflow_in_progress: true,
    request_status: true,
    awaiting_execution_mode: true,
    awaiting_confirmation: true
};

const DEFAULT_EXECUTION_MODE_OPTIONS = [
    { number: 1, label: 'Instructions' },
    { number: 2, label: 'CLI Commands' },
    { number: 3, label: 'Pull Request' },
    { number: 4, label: 'Cloud Pilot Does It' }
];

const CREATE_EC2_EXECUTION_MODE_OPTIONS = [
    { number: 1, label: 'Instructions' },
    { number: 2, label: 'CLI Commands' },
    { number: 3, label: 'Pull Request (not available for create yet)' },
    { number: 4, label: 'Cloud Pilot Does It' }
];

//HELPERS
//Helper H1: Request events whose template copy may be presented
function isRequestPresentationEvent(actionEvent) {
    return REQUEST_PRESENTATION_EVENTS[String(actionEvent || '')] === true;
}

//Helper H1b: Alias kept for Step 1 callers
function isPhase1PresentationEvent(actionEvent) {
    return isRequestPresentationEvent(actionEvent);
}

//Helper H2: Short action summary from CloudPilot registry (not OpenAI)
function buildActionSummary(actionDefinition) {
    const definition = actionDefinition || {};

    if (definition.capability && definition.capability.description) {
        return String(definition.capability.description).trim();
    }

    if (definition.actionLabel) {
        return String(definition.actionLabel).trim();
    }

    if (definition.type) {
        return String(definition.type).trim();
    }

    return '';
}

//Helper H3: Shallow copy of collected field values
function copyCollectedFields(collectedFields) {
    const collected = collectedFields && typeof collectedFields === 'object'
        ? collectedFields
        : {};
    const copy = {};
    const fieldNames = Object.keys(collected);

    for (let i = 0; i < fieldNames.length; i++) {
        const fieldName = fieldNames[i];
        copy[fieldName] = collected[fieldName];
    }

    return copy;
}

//Helper H4: Last collected field name (matches template acknowledgement)
function latestCollectedFieldName(collectedFields) {
    const fieldNames = Object.keys(collectedFields || {});

    if (fieldNames.length === 0) {
        return null;
    }

    return fieldNames[fieldNames.length - 1];
}

//Helper H5: Numbered execution-mode options (must match requestTemplates / create guidance)
function buildExecutionModeOptions(actionDefinition) {
    const actionType =
        actionDefinition && actionDefinition.type
            ? String(actionDefinition.type)
            : '';

    if (actionType === 'create_ec2') {
        return CREATE_EC2_EXECUTION_MODE_OPTIONS.slice();
    }

    return DEFAULT_EXECUTION_MODE_OPTIONS.slice();
}

//Helper H6: Confirm/cancel line (must match requestTemplates)
function buildConfirmOrCancelLine(actionType) {
    if (actionType === 'scan_ec2' || actionType === 'scan_s3') {
        return 'Confirm to run the scan now, or cancel.';
    }

    return 'Confirm to run now, or cancel.';
}

//FUNCTIONS A: Request Message Reply context
//Function A1: Operation context for Request Message Reply (Internal AI | OpenAI)
function getRequestMessageReplyContext(payload, templateMessage) {
    const requestPayload = payload || {};
    const actionEvent = String(requestPayload.actionEvent || '');
    const actionDefinition = requestPayload.actionDefinition || {};
    const actionState = requestPayload.actionState || {};
    const missingFields = Array.isArray(actionState.missingFields)
        ? actionState.missingFields.slice()
        : [];
    const collectedFields = copyCollectedFields(actionState.collectedFields);
    const exampleContext = requestPayload.exampleContext || {};
    const templateText = templateMessage ? String(templateMessage) : '';
    const actionType = actionDefinition.type || actionState.pendingAction || null;

    if (!isRequestPresentationEvent(actionEvent) || !templateText) {
        return null;
    }

    const suggestions = {};
    const optionalPrompts = [];

    for (let i = 0; i < missingFields.length; i++) {
        const fieldName = missingFields[i];
        suggestions[fieldName] = FieldPromptExamples.resolveFieldExample(
            fieldName,
            actionDefinition,
            exampleContext
        );
    }

    const requestNamePrompt = FieldPromptExamples.buildOptionalRequestNamePrompt(
        actionDefinition,
        collectedFields
    );

    if (requestNamePrompt) {
        optionalPrompts.push('request_name');
        suggestions.request_name = FieldPromptExamples.resolveRequestNameExample(
            actionDefinition
        );
    }

    const hasMissingFields = missingFields.length > 0;
    const hasOptionalNameAsk =
        optionalPrompts.length > 0 &&
        (actionEvent === 'new_action' ||
            actionEvent === 'missing_fields_given' ||
            actionEvent === 'awaiting_execution_mode');
    const hasFieldAcknowledgement =
        actionEvent === 'missing_fields_given' &&
        latestCollectedFieldName(collectedFields) != null;
    const hasModeAsk = actionEvent === 'awaiting_execution_mode';
    const hasConfirmation = actionEvent === 'awaiting_confirmation';

    if (
        !hasMissingFields &&
        !hasOptionalNameAsk &&
        !hasFieldAcknowledgement &&
        !hasModeAsk &&
        !hasConfirmation
    ) {
        return null;
    }

    const speakFacts = {
        action: actionType,
        actionLabel: actionDefinition.actionLabel || null,
        actionSummary: buildActionSummary(actionDefinition),
        actionEvent: actionEvent,
        missing: missingFields,
        suggestions: suggestions,
        optionalPrompts: optionalPrompts,
        collected: collectedFields,
        templateMessage: templateText
    };

    if (hasFieldAcknowledgement) {
        speakFacts.latestCollectedField = latestCollectedFieldName(collectedFields);
    }

    if (hasModeAsk) {
        speakFacts.executionModeOptions = buildExecutionModeOptions(actionDefinition);
    }

    if (hasConfirmation) {
        speakFacts.executionMode = actionState.executionMode || null;
        speakFacts.confirmOrCancelLine = buildConfirmOrCancelLine(actionType);
    }

    return speakFacts;
}

module.exports = {
    getRequestMessageReplyContext,
    isRequestPresentationEvent,
    isPhase1PresentationEvent
};
