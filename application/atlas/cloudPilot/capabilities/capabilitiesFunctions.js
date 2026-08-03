const openAIFunctions = require('../../providers/openAI/client/openAIClient');
const { CLOUDPILOT_AI_CONFIG } = require('../../config/cloudPilotAIConfig');

/*
FUNCTIONS A: Capability catalog from actionMap
    1) Function A1: getEligibleCapabilityActions
    2) Function A2: buildCapabilitiesCatalog
    3) Function A3: buildCapabilitiesMessage

FUNCTIONS B: Capabilities response — Should I run? / How should I run?
    1) Function B1: shouldRespondCapabilities
    2) Function B2: respondCapabilitiesInternal
    3) Function B3: respondCapabilitiesOpenAI
    4) Function B4: respondCapabilities
*/

const EXECUTION_MODE_LABELS = {
    instructions: 'Instructions',
    cli: 'AWS CLI',
    pr: 'Pull Request',
    automatic: 'Automatic'
};

function getActionMap() {
    return require('../actionMap');
}

//Function A1: Eligible user-facing actions from the live actionMap
function getEligibleCapabilityActions() {
    const actionMap = getActionMap();
    const actions = [];
    const keys = Object.keys(actionMap);

    for (let i = 0; i < keys.length; i++) {
        const actionDefinition = actionMap[keys[i]];

        if (!actionDefinition || typeof actionDefinition !== 'object') {
            continue;
        }

        if (actionDefinition.allowed !== true) {
            continue;
        }

        const actionType = actionDefinition.type
            ? String(actionDefinition.type)
            : String(keys[i]);

        if (actionType === 'general_chat' || actionType === 'show_capabilities') {
            continue;
        }

        actions.push(actionDefinition);
    }

    return actions;
}

//Function A2: Build structured catalog payload from eligible actions
function buildCapabilitiesCatalog() {
    const eligibleActions = getEligibleCapabilityActions();
    const sections = {};

    for (let i = 0; i < eligibleActions.length; i++) {
        const actionDefinition = eligibleActions[i];
        const capability =
            actionDefinition.capability && typeof actionDefinition.capability === 'object'
                ? actionDefinition.capability
                : {};

        const sectionName =
            capability.section && String(capability.section).trim()
                ? String(capability.section).trim()
                : 'Other';

        const description =
            capability.description && String(capability.description).trim()
                ? String(capability.description).trim()
                : actionDefinition.actionLabel
                  ? String(actionDefinition.actionLabel)
                  : String(actionDefinition.type || '');

        const executionModes = Array.isArray(actionDefinition.executionModes)
            ? actionDefinition.executionModes.slice()
            : [];

        if (!sections[sectionName]) {
            sections[sectionName] = [];
        }

        sections[sectionName].push({
            type: actionDefinition.type,
            actionLabel: actionDefinition.actionLabel || actionDefinition.type,
            description: description,
            executionModes: executionModes
        });
    }

    const sectionNames = Object.keys(sections).sort(function (left, right) {
        if (left === 'Other') {
            return 1;
        }

        if (right === 'Other') {
            return -1;
        }

        return left.localeCompare(right);
    });

    const orderedSections = [];

    for (let i = 0; i < sectionNames.length; i++) {
        const sectionName = sectionNames[i];
        const items = sections[sectionName].slice().sort(function (left, right) {
            return String(left.description).localeCompare(String(right.description));
        });

        orderedSections.push({
            section: sectionName,
            actions: items
        });
    }

    return {
        sections: orderedSections,
        executionModes: collectUniqueExecutionModes(eligibleActions)
    };
}

//FUNCTIONS B: Capabilities response
//Function B1: Should capabilities response run? (handler only called for show_capabilities)
function shouldRespondCapabilities() {
    //STEP 1: show_capabilities was selected — response is needed
    return true;
}

//Function B2: Deterministic Internal wording from grounded catalog
function respondCapabilitiesInternal(catalog) {
    //STEP 1: Format catalog into fixed chat text
    return buildCapabilitiesMessage(catalog);
}

//Function B3: OpenAI wording of the same grounded catalog (facts only)
async function respondCapabilitiesOpenAI(catalog) {
    const catalogJson = JSON.stringify(catalog || {}, null, 2);
    const systemMessage =
        'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
        'Present the current capabilities to the user in clear, natural language.\n\n' +
        'Rules:\n' +
        '- Only describe capabilities listed in the CAPABILITIES CATALOG\n' +
        '- Do not invent AWS services, actions, or execution modes\n' +
        '- Do not claim work was executed\n' +
        '- You may improve wording, not facts\n' +
        '- Keep the response concise and useful\n\n' +
        'CAPABILITIES CATALOG (JSON):\n' +
        catalogJson;

    const openAIResult = await openAIFunctions.sendGeneralChat({
        systemMessage: systemMessage,
        conversationHistory: [],
        userMessage: 'What can you do?',
        capability: 'Capabilities',
        conversationHistoryEnabled: false,
        context: {
            identity: true,
            situation: false,
            currentQuestion: true,
            knowledge: false
        }
    });

    if (!openAIResult || !openAIResult.success) {
        return {
            success: false,
            message: null,
            error:
                (openAIResult && (openAIResult.message || openAIResult.error)) ||
                'capabilities_openai_failed'
        };
    }

    const message =
        openAIResult.data !== undefined && openAIResult.data !== null
            ? String(openAIResult.data).trim()
            : '';

    if (!message) {
        return {
            success: false,
            message: null,
            error: 'capabilities_openai_empty'
        };
    }

    return {
        success: true,
        message: message,
        error: null
    };
}

//Function B4: Choose Internal or OpenAI (master OFF / internal → Internal; OpenAI failure → Internal)
async function respondCapabilities(catalog) {
    //STEP 1: Should I run?
    if (!shouldRespondCapabilities()) {
        return {
            success: false,
            cloudPilotMessage: '',
            source: 'skipped',
            error: 'capabilities_not_needed'
        };
    }

    //STEP 2: How should I run?
    const useOpenAI =
        CLOUDPILOT_AI_CONFIG.aiEnabled &&
        CLOUDPILOT_AI_CONFIG.messageResponse === 'openai';

    if (useOpenAI) {
        const openAIOutcome = await respondCapabilitiesOpenAI(catalog);

        if (openAIOutcome.success && openAIOutcome.message) {
            return {
                success: true,
                cloudPilotMessage: openAIOutcome.message,
                source: 'openai',
                error: null
            };
        }
    }

    openAIFunctions.logOpenAI({
        capability: 'Capabilities',
        conversationHistoryEnabled: false,
        conversationHistoryCount: 0,
        context: {
            identity: true,
            situation: false,
            currentQuestion: true,
            knowledge: false
        },
        messages: [
            {
                role: 'system',
                content:
                    'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
                    'Present the current capabilities to the user in clear, natural language.\n\n' +
                    'Rules:\n' +
                    '- Only describe capabilities listed in the CAPABILITIES CATALOG\n' +
                    '- Do not invent AWS services, actions, or execution modes\n' +
                    '- Do not claim work was executed\n' +
                    '- You may improve wording, not facts\n' +
                    '- Keep the response concise and useful\n\n' +
                    'CAPABILITIES CATALOG (JSON):\n' +
                    JSON.stringify(catalog || {}, null, 2)
            },
            {
                role: 'user',
                content: 'What can you do?'
            }
        ],
        previewOnly: true
    });

    //STEP 3: Internal (default, master OFF, or OpenAI fallback)
    return {
        success: true,
        cloudPilotMessage: respondCapabilitiesInternal(catalog),
        source: useOpenAI ? 'internal_fallback' : 'internal',
        error: null
    };
}

//Function A3: Format catalog into a deterministic chat response
function buildCapabilitiesMessage(catalog) {
    const lines = [];
    const sections =
        catalog && Array.isArray(catalog.sections) ? catalog.sections : [];
    const modeLabels = formatExecutionModeLabels(
        catalog && Array.isArray(catalog.executionModes)
            ? catalog.executionModes
            : []
    );

    lines.push('Here is how CloudPilot can help you today:');
    lines.push('');

    if (sections.length === 0) {
        lines.push('No user-facing actions are registered yet.');
        return lines.join('\n');
    }

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        lines.push(section.section);
        lines.push('');

        for (let j = 0; j < section.actions.length; j++) {
            const action = section.actions[j];
            lines.push('• ' + action.description);
        }

        lines.push('');
    }

    if (modeLabels.length > 0) {
        lines.push('Here is how we can do this:');
        lines.push('');

        for (let i = 0; i < modeLabels.length; i++) {
            lines.push('• ' + modeLabels[i]);
        }

        lines.push('');
    }

    lines.push(
        'I am still growing, so more AWS services and remediations will be added over time.'
    );

    return lines.join('\n').trim();
}

function collectUniqueExecutionModes(eligibleActions) {
    const seen = {};
    const modes = [];

    for (let i = 0; i < eligibleActions.length; i++) {
        const executionModes = eligibleActions[i].executionModes;

        if (!Array.isArray(executionModes)) {
            continue;
        }

        for (let j = 0; j < executionModes.length; j++) {
            const mode = String(executionModes[j] || '').trim().toLowerCase();

            if (!mode || seen[mode]) {
                continue;
            }

            seen[mode] = true;
            modes.push(mode);
        }
    }

    return modes;
}

function formatExecutionModeLabels(executionModes) {
    const labels = [];

    if (!Array.isArray(executionModes)) {
        return labels;
    }

    for (let i = 0; i < executionModes.length; i++) {
        const mode = String(executionModes[i] || '').trim().toLowerCase();

        if (!mode) {
            continue;
        }

        labels.push(EXECUTION_MODE_LABELS[mode] || mode);
    }

    return labels;
}

module.exports = {
    getEligibleCapabilityActions,
    buildCapabilitiesCatalog,
    buildCapabilitiesMessage,
    shouldRespondCapabilities,
    respondCapabilitiesInternal,
    respondCapabilitiesOpenAI,
    respondCapabilities
};
