const CreateEC2Context = require('./createEC2Context');

/*
FUNCTIONS A: Create EC2 guidance — how CloudPilot explains each stage
    1) Function A1: buildStartedMessage
    2) Function A2: buildReadyReviewMessage
    3) Function A3: buildConfirmMessage
    4) Function A4: buildSuccessMessage
*/

/*
Create-only walkthrough copy. Existing request flow owns WHEN;
this file only supplies create-specific wording for a known stage.
*/

//Function A1: STARTED — before / while collecting; nothing created yet
function buildStartedMessage(options) {
    const settings = options || {};
    const missingFieldsMessage = String(settings.missingFieldsMessage || '').trim();
    const choiceFields = CreateEC2Context.getCreateEc2ChoiceFields();
    const demoDefaults = CreateEC2Context.getCreateEc2Context().demoDefaults || {};
    const demoInstanceType = String(demoDefaults.instance_type || 't3.micro').trim();

    const choiceLines = [];

    for (let i = 0; i < choiceFields.length; i++) {
        const choice = choiceFields[i];
        choiceLines.push('• ' + choice.label + ' — ' + choice.summary);
    }

    let message =
        'Sure — I can help you create a small EC2 instance.\n\n' +
        "I'll walk you through the important choices before anything is created.\n\n" +
        "We'll need:\n" +
        choiceLines.join('\n') +
        '\n\n' +
        'For this demo, we can use ' +
        demoInstanceType +
        ", one of AWS's smallest general-purpose types. " +
        'That is a demo default, not a workload recommendation.\n\n' +
        "Nothing will be created until you review and approve it.\n\n" +
        "I'll show you exactly what will be created before anything changes.";

    if (missingFieldsMessage) {
        message += '\n\n' + missingFieldsMessage;
    }

    return message;
}

//Function A2: READY / MODE PICK — actual choices + how to create
function buildReadyReviewMessage(options) {
    const settings = options || {};
    const collectedFields = settings.collectedFields || {};
    const estimatedComputeCost = settings.estimatedComputeCost;
    const requestNamePrompt = String(settings.requestNamePrompt || '').trim();

    const name = formatCollectedValue(collectedFields.name);
    const region = formatCollectedValue(collectedFields.region);
    const instanceType = formatCollectedValue(collectedFields.instance_type);

    let message =
        'I have everything I need to create your EC2 instance.\n\n' +
        'Name: ' +
        name +
        '\n' +
        'Region: ' +
        region +
        '\n' +
        'Instance type: ' +
        instanceType;

    if (estimatedComputeCost != null && String(estimatedComputeCost).trim() !== '') {
        message +=
            '\nEstimated compute cost: ' +
            String(estimatedComputeCost).trim() +
            ' if left running continuously';
    }

    message +=
        '\n\n' +
        'CloudPilot will only create the instance after you approve the action.\n\n' +
        'How would you like to create it?\n\n' +
        '1. Instructions\n' +
        '2. CLI Commands\n' +
        '3. Pull Request (not available for create yet)\n' +
        '4. Cloud Pilot Does It\n\n' +
        'For create, choose Instructions, CLI, or Cloud Pilot Does It.';

    if (requestNamePrompt) {
        message += '\n\n' + requestNamePrompt;
    }

    return message;
}

//Function A3: CONFIRM — safer Automatic confirmation before create
function buildConfirmMessage(options) {
    const settings = options || {};
    const collectedFields = settings.collectedFields || {};
    const executionMode = String(settings.executionMode || '').trim();
    const estimatedComputeCost = settings.estimatedComputeCost;

    const name = formatCollectedValue(collectedFields.name);
    const region = formatCollectedValue(collectedFields.region);
    const instanceType = formatCollectedValue(collectedFields.instance_type);

    let message =
        'CloudPilot can create this for you.\n\n' +
        "I'm going to create " +
        name +
        ', a ' +
        instanceType +
        ' instance in ' +
        region +
        '.\n\n' +
        'This will start an actual AWS resource and may incur AWS charges.';

    if (estimatedComputeCost != null && String(estimatedComputeCost).trim() !== '') {
        message +=
            '\n\nEstimated compute cost: ' +
            String(estimatedComputeCost).trim() +
            ' if left running continuously.';
    }

    if (executionMode) {
        message += '\n\nExecution mode: ' + executionMode;
    }

    message += '\n\nCreate instance?\n\nCreate · Cancel';

    return message;
}

//Function A4: SUCCESS — facts from execution result only
function buildSuccessMessage(options) {
    const settings = options || {};
    const atlasResponse = settings.atlasResponse || {};
    const collectedFields = settings.collectedFields || {};
    const estimatedComputeCost = settings.estimatedComputeCost;
    const createContext = CreateEC2Context.getCreateEc2Context();

    const instanceId = firstKnownValue(atlasResponse.instance_id, null);
    const region = firstKnownValue(atlasResponse.region, collectedFields.region);
    const instanceType = firstKnownValue(
        atlasResponse.instance_type,
        collectedFields.instance_type
    );
    const name = firstKnownValue(atlasResponse.name, collectedFields.name);
    const status = firstKnownValue(atlasResponse.state, atlasResponse.status, null);
    const tagsWereConfirmed = hasConfirmedTags(atlasResponse);

    let message = 'Your EC2 instance was created.';

    if (name) {
        message += '\n\n' + name;
    } else {
        message += '\n';
    }

    if (instanceId) {
        message += '\n' + instanceId;
    }

    if (instanceType || region) {
        message +=
            '\n' +
            [instanceType, region].filter(Boolean).join(' · ');
    }

    if (status) {
        message += '\n\nStatus: ' + status;
    }

    if (estimatedComputeCost != null && String(estimatedComputeCost).trim() !== '') {
        message +=
            '\nEstimated compute cost: ' +
            String(estimatedComputeCost).trim() +
            ' if continuously running';
    }

    if (tagsWereConfirmed) {
        message +=
            '\n\nI\'ve tagged the instance so CloudPilot can identify and manage it later.';
    }

    const followUps = createContext.afterCreate && createContext.afterCreate.followUps
        ? createContext.afterCreate.followUps
        : [];
    const comingSoon = createContext.afterCreate && createContext.afterCreate.comingSoonLabels
        ? createContext.afterCreate.comingSoonLabels
        : [];

    if (followUps.length > 0) {
        message += '\n\nYou can now ask me things like:';

        for (let i = 0; i < followUps.length; i++) {
            message += '\n• ' + followUps[i];
        }
    }

    if (comingSoon.length > 0) {
        message += '\n\nComing soon / Demo:';

        for (let i = 0; i < comingSoon.length; i++) {
            message += '\n• ' + comingSoon[i];
        }
    }

    return message;
}

function hasConfirmedTags(atlasResponse) {
    if (!atlasResponse || typeof atlasResponse !== 'object') {
        return false;
    }

    if (atlasResponse.tags_applied === true) {
        return true;
    }

    const tags = atlasResponse.tags;

    if (!tags || typeof tags !== 'object' || Array.isArray(tags)) {
        return false;
    }

    return Object.keys(tags).length > 0;
}

function firstKnownValue() {
    for (let i = 0; i < arguments.length; i++) {
        const value = arguments[i];

        if (value != null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }

    return null;
}

function formatCollectedValue(value) {
    if (value == null || String(value).trim() === '') {
        return '(not set)';
    }

    return String(value).trim();
}

module.exports = {
    buildStartedMessage,
    buildReadyReviewMessage,
    buildConfirmMessage,
    buildSuccessMessage
};
