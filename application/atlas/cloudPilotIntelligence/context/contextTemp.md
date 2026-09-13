# cloudPilotIntelligence/context — folder structure and full source

## Folder structure

```
buildContext.js
buildSystemMessage.js
classes/ConversationHistoryContext.js
classes/CurrentQuestionContext.js
contextTypes/cloudPilotCapabilitiesContext.js
contextTypes/cloudPilotContext.js
contextTypes/cloudPilotCurrentStateContext.js
contextTypes/cloudPilotSituationContext.js
contextTypes/currentQuestionContext.js
contextTypes/organizationKnowledgeContext.js
masterContext/masterFinalResponseContext.js
operationContext/getActionSearchContext.js
operationContext/getAiSpendSearchContext.js
operationContext/getEc2InventorySearchContext.js
operationContext/getOpenRequestsSearchContext.js
operationContext/getOrganizationalKnowledgeSearchContext.js
operationContext/getRegionSearchContext.js
operationContext/getS3InventorySearchContext.js

Tree:
context/
├── buildContext.js
├── buildSystemMessage.js
├── classes/
│   ├── ConversationHistoryContext.js
│   └── CurrentQuestionContext.js
├── contextTypes/
│   ├── cloudPilotCapabilitiesContext.js
│   ├── cloudPilotContext.js
│   ├── cloudPilotCurrentStateContext.js
│   ├── cloudPilotSituationContext.js
│   ├── currentQuestionContext.js
│   └── organizationKnowledgeContext.js
├── masterContext/
│   └── masterFinalResponseContext.js
└── operationContext/
    ├── getActionSearchContext.js
    ├── getAiSpendSearchContext.js
    ├── getEc2InventorySearchContext.js
    ├── getOpenRequestsSearchContext.js
    ├── getOrganizationalKnowledgeSearchContext.js
    ├── getRegionSearchContext.js
    └── getS3InventorySearchContext.js
```

## Full source

### `buildContext.js`

```javascript
const { getCloudPilotContext } = require('./contextTypes/cloudPilotContext');
const { getCloudPilotCapabilitiesContext } = require('./contextTypes/cloudPilotCapabilitiesContext');
const { getCloudPilotSituationContext } = require('./contextTypes/cloudPilotSituationContext');
const { buildCurrentStateContext } = require('./contextTypes/cloudPilotCurrentStateContext');
const { buildCurrentQuestionContext } = require('./contextTypes/currentQuestionContext');
const { getKnowledgeContext } = require('./contextTypes/organizationKnowledgeContext');

/*
Collect selected CloudPilot context for the AI.

Roles:
  cloudPilotContext              — Identity (who is CloudPilot?)
  cloudPilotCapabilitiesContext  — Capabilities (what can I do / retrieve?)
  cloudPilotSituationContext     — Situation (what should AI look for / do?)
  cloudPilotCurrentStateContext  — Current State (factual open request — Chat)
  currentQuestionContext         — Current question (what did the user say?)
  organizationKnowledgeContext   — Knowledge (organization + product)

Pass processMessageContext through — do not unpack fields at each layer.
Collect only — no OpenAI calls, no env toggles, no log formatting.
Rendering: buildSystemMessage.js

options:
  situationTypes      — string[] building blocks for Situation (e.g. ['region'])
  includeKnowledge    — default true for legacy callers; Final Response recipe sets false
  includeIdentity     — default true for General Chat; Search must set false
  includeCapabilities — default false (only Final Response / explicit recipes turn on)
  includeCurrentState — default true for General Chat; Search must set false
*/

function buildAIContext(processMessageContext, options) {
    const opts = options && typeof options === 'object' ? options : {};

    //STEP 1: Identity (Chat only — Search passes includeIdentity: false)
    const includeIdentity = opts.includeIdentity !== false;
    const cloudPilot = includeIdentity ? getCloudPilotContext() : null;

    //STEP 2: Capabilities (Final Response recipe — Search leaves default false)
    const includeCapabilities = opts.includeCapabilities === true;
    const capabilities = includeCapabilities ? getCloudPilotCapabilitiesContext() : null;

    //STEP 3: Situation (what to look for) — only when types are requested
    let situation = null;

    if (Array.isArray(opts.situationTypes) && opts.situationTypes.length > 0) {
        situation = getCloudPilotSituationContext(opts.situationTypes);
    }

    //STEP 4: Current State (Chat only — factual open request when present)
    const includeCurrentState = opts.includeCurrentState !== false;
    const currentState = includeCurrentState
        ? buildCurrentStateContext(processMessageContext)
        : null;

    //STEP 5: Current question (what the user said)
    const currentQuestion = buildCurrentQuestionContext(processMessageContext);

    //STEP 6: Knowledge (optional — organization facts for this turn when loaded)
    const includeKnowledge = opts.includeKnowledge !== false;
    const knowledge = includeKnowledge
        ? getKnowledgeContext(processMessageContext)
        : null;

    //STEP 7: Combine
    const aiContext = {
        cloudPilot: cloudPilot,
        capabilities: capabilities,
        situation: situation,
        currentState: currentState,
        currentQuestion: currentQuestion,
        knowledge: knowledge
    };

    return aiContext;
}

module.exports = {
    buildAIContext
};
```

### `buildSystemMessage.js`

```javascript
/*
Turn CloudPilot context into the English system message for the AI.

Keep this file dumb: no AWS logic, no business rules.
Intelligence lives in contextTypes/ builders and services/knowledge/.

Conceptual sections (render order locked):
  IDENTITY         — Who is CloudPilot?              (cloudPilotContext)
  CAPABILITIES     — What can I do / retrieve?       (cloudPilotCapabilitiesContext)
  SITUATION        — What should AI look for / do?   (cloudPilotSituationContext)
  CURRENT STATE    — Factual open request (Chat)     (cloudPilotCurrentStateContext)
  CURRENT QUESTION — What did the user say?          (currentQuestionContext)
  Knowledge        — Optional organization/product   (organizationKnowledgeContext)

FUNCTIONS A: Build AI system message
    1) Function A1: buildAISystemMessage

FUNCTIONS B: Write each part of the message
    1) Function B1: writeIdentity
    2) Function B1a: writeCapabilities
    3) Function B1b: writeCurrentState
    4) Function B2: writeSituation
    5) Function B3: writeCurrentQuestion
    6) Function B4: writeKnowledge

FUNCTIONS C: Small helpers
    1) Function C1: writeBulletList
    2) Function C2: hasContent
*/

//FUNCTIONS C: Small helpers
//Function C1: Write a bullet list from string items
function writeBulletList(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '';
    }

    return items.map(function (item) {
        return '- ' + item;
    }).join('\n');
}

//Function C2: True when this block should appear in the system message
function hasContent(data) {
    return (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        Object.keys(data).length > 0
    );
}

//FUNCTIONS B: Write each part of the message
//Function B1: Write Identity (Who is CloudPilot?) — General Chat voice
// Doc: feature_cloud_pilot_context.md Step A — not used by Search
function writeIdentity(cloudPilotContext) {
    const identity = cloudPilotContext && cloudPilotContext.data;

    if (!identity) {
        return '';
    }

    const name = identity.name || 'CloudPilot';
    const intro = identity.intro
        ? String(identity.intro).trim()
        : 'an AI assistant for understanding and managing AWS infrastructure';

    const sections = [
        'You are ' + name + ', ' + intro + '.'
    ];

    const voice = writeBulletList(identity.voice);
    if (voice) {
        sections.push('VOICE\n\n' + voice);
    }

    const productParts = [];
    if (identity.productDescription) {
        productParts.push(String(identity.productDescription).trim());
    }
    const modes = writeBulletList(identity.executionModes);
    if (modes) {
        productParts.push('CloudPilot may carry out work through:\n' + modes);
    }
    if (productParts.length > 0) {
        sections.push('CLOUDPILOT\n\n' + productParts.join('\n\n'));
    }

    const grounding = writeBulletList(identity.grounding);
    if (grounding) {
        sections.push('GROUNDING\n\n' + grounding);
    }

    const conversation = writeBulletList(identity.conversation);
    if (conversation) {
        sections.push('CONVERSATION\n\n' + conversation);
    }

    return sections.join('\n\n');
}

//Function B1a: Write Capabilities (what CloudPilot can do / retrieve)
function writeCapabilities(capabilitiesContext) {
    const data = capabilitiesContext && capabilitiesContext.data;

    if (!data || !Array.isArray(data.capabilities) || data.capabilities.length === 0) {
        return '';
    }

    const lines = ['AVAILABLE CLOUDPILOT CAPABILITIES', ''];
    const capabilities = data.capabilities;

    for (let i = 0; i < capabilities.length; i++) {
        const entry = capabilities[i] || {};
        const label = entry.label ? String(entry.label).trim() : '';
        const action = entry.action ? String(entry.action).trim() : '';
        const description = entry.description ? String(entry.description).trim() : '';

        if (label && description && description !== label) {
            lines.push(label + ' — ' + description);
        } else if (label) {
            lines.push(label);
        } else if (action) {
            lines.push(action);
        } else {
            continue;
        }

        if (Array.isArray(entry.canAnswer) && entry.canAnswer.length > 0) {
            lines.push('Can answer:');
            for (let j = 0; j < entry.canAnswer.length; j++) {
                lines.push('- ' + String(entry.canAnswer[j]));
            }
        }

        if (entry.scope) {
            lines.push('Scope:');
            lines.push(String(entry.scope).trim());
        }

        lines.push('');
    }

    if (data.groundingRule) {
        lines.push(String(data.groundingRule).trim());
    }

    return lines.join('\n').trim();
}

//Function B1b: Write Current State (factual open request — Chat Situation MVP)
// Doc: feature_cloud_pilot_context.md Step D — facts only, not prose instructions
// Friendly Create Step 4: optional create_ec2 knowledge facts when that request is open
function writeCurrentState(currentStateContext) {
    const data = currentStateContext && currentStateContext.data;
    const hasOpenRequestFlag = data && data.hasOpenRequest === true;
    const openRequest = data && data.openRequest;
    const createEc2 = data && data.createEc2;

    const hasOpenRequest =
        hasOpenRequestFlag || (openRequest && typeof openRequest === 'object');
    const hasCreateEc2 = createEc2 && typeof createEc2 === 'object';

    if (!hasOpenRequest && !hasCreateEc2 && data && data.hasOpenRequest !== false) {
        return '';
    }

    const lines = ['CURRENT CLOUDPILOT STATE', ''];

    if (data && Object.prototype.hasOwnProperty.call(data, 'hasOpenRequest')) {
        lines.push('HAS OPEN REQUEST: ' + (hasOpenRequest ? 'YES' : 'NO'));
        lines.push('');
    }

    if (hasOpenRequest && openRequest && typeof openRequest === 'object') {
        const label = openRequest.label ? String(openRequest.label).trim() : '';
        const action = openRequest.action ? String(openRequest.action).trim() : '';
        const status = openRequest.status ? String(openRequest.status).trim() : '';

        lines.push('Open request:');

        if (label) {
            lines.push('Action: ' + label + (action && action !== label ? ' (' + action + ')' : ''));
        } else if (action) {
            lines.push('Action: ' + action);
        }

        if (status) {
            lines.push('Status: ' + status);
        }

        if (openRequest.executionMode) {
            lines.push('Execution mode: ' + String(openRequest.executionMode));
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
        }

        const missing = Array.isArray(openRequest.missing)
            ? openRequest.missing
            : Array.isArray(openRequest.waitingFor)
              ? openRequest.waitingFor
              : [];

        if (missing.length > 0) {
            lines.push('Missing: ' + missing.join(', '));
        } else if (hasOpenRequest) {
            lines.push('Missing: none');
        }

        lines.push('');
    }

    if (hasCreateEc2) {
        lines.push('Create EC2 knowledge (facts only):');

        if (createEc2.meaning) {
            lines.push('- Meaning: ' + String(createEc2.meaning).trim());
        }

        if (Array.isArray(createEc2.choiceFields) && createEc2.choiceFields.length > 0) {
            for (let i = 0; i < createEc2.choiceFields.length; i++) {
                const choice = createEc2.choiceFields[i];
                const choiceLabel = choice.label || choice.field || 'Field';
                const choiceSummary = choice.summary ? String(choice.summary).trim() : '';
                lines.push(
                    '- Choice — ' +
                        choiceLabel +
                        (choiceSummary ? ': ' + choiceSummary : '')
                );
            }
        }

        if (createEc2.demoDefaultInstanceType) {
            lines.push(
                '- Demo default instance type: ' +
                    String(createEc2.demoDefaultInstanceType).trim() +
                    (createEc2.instanceTypeIsDemoDefault
                        ? ' (demo default, not a workload recommendation)'
                        : '')
            );
        }

        if (createEc2.neverInventPrices) {
            lines.push('- Do not invent prices or cost estimates.');
        }

        if (createEc2.showEstimateOnlyWhenKnown) {
            lines.push('- Show an estimated compute cost only when known.');
        }

        if (createEc2.neverClaimSecureUnlessKnown) {
            lines.push('- Do not claim the instance is secure unless protections are known.');
        }

        lines.push('');
    }

    lines.push(
        'Use this information only when relevant to the user\'s current question.'
    );
    lines.push(
        'This turn is answering chat only — do not claim the open request is starting, running, completed, or being executed.'
    );

    return lines.join('\n');
}

//Function B2: Write Situation (What should AI look for / do?)
function writeSituation(situationContext) {
    const data = situationContext && situationContext.data;

    if (!hasContent(data)) {
        return '';
    }

    const sections = [];
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const piece = data[key];

        if (!piece || typeof piece !== 'object') {
            continue;
        }

        const pieceSections = [String(key).toUpperCase()];

        if (piece.purpose) {
            pieceSections.push(piece.purpose);
        }

        const rules = writeBulletList(piece.rules);
        if (rules) {
            pieceSections.push('Rules:\n' + rules);
        }

        sections.push(pieceSections.join('\n\n'));
    }

    if (sections.length === 0) {
        return '';
    }

    return 'SITUATION\n\n' + sections.join('\n\n');
}

//Function B3: Write Current Question (What did the user say?)
function writeCurrentQuestion(currentQuestionContext) {
    const data = currentQuestionContext && currentQuestionContext.data;

    if (!hasContent(data)) {
        return '';
    }

    const sections = [];

    if (data.userMessage) {
        sections.push('Current user message:\n"' + data.userMessage + '"');
    }

    if (data.selectedFinding && typeof data.selectedFinding === 'object') {
        const finding = data.selectedFinding;
        const bullets = [];

        if (finding.ruleId) {
            bullets.push('Rule: ' + finding.ruleId);
        }
        if (finding.service) {
            bullets.push('Service: ' + finding.service);
        }
        if (finding.instanceId) {
            bullets.push('Instance: ' + finding.instanceId);
        }
        if (finding.name || finding.resourceName) {
            bullets.push('Name: ' + (finding.name || finding.resourceName));
        }
        if (finding.title) {
            bullets.push('Title: ' + finding.title);
        }
        if (finding.cpuAverage != null || finding.cpu != null) {
            bullets.push('CPU average: ' + (finding.cpuAverage != null ? finding.cpuAverage : finding.cpu));
        }
        if (finding.lookbackDays != null) {
            bullets.push('Lookback days: ' + finding.lookbackDays);
        }
        if (finding.currentType) {
            bullets.push('Current type: ' + finding.currentType);
        }
        if (finding.recommendedType) {
            bullets.push('Recommended type: ' + finding.recommendedType);
        }
        if (finding.estimatedSavings != null) {
            bullets.push('Estimated savings: ' + finding.estimatedSavings);
        }
        if (finding.region) {
            bullets.push('Region: ' + finding.region);
        }

        if (bullets.length > 0) {
            sections.push(
                'The user is currently looking at a finding:\n' + writeBulletList(bullets)
            );
        }
    }

    if (sections.length === 0) {
        return '';
    }

    return 'CURRENT QUESTION\n\n' + sections.join('\n\n');
}

//Function B4: Write Knowledge (organization + product background)
function writeKnowledge(knowledgeContext) {
    const data = knowledgeContext && knowledgeContext.data;

    if (!data) {
        return '';
    }

    const sections = [];
    const organization = data.organization;
    const product = data.product;

    if (hasContent(organization)) {
        if (organization.contextBlock) {
            sections.push(String(organization.contextBlock).trim());
        } else {
            sections.push(
                'Organization knowledge:\n' + JSON.stringify(organization, null, 2)
            );
        }
    }

    if (Array.isArray(product) && product.length > 0) {
        sections.push('Product knowledge:\n' + JSON.stringify(product, null, 2));
    }

    if (sections.length === 0) {
        return '';
    }

    return 'KNOWLEDGE\n\n' + sections.join('\n\n');
}

//FUNCTIONS A: Build AI system message
//Function A1: Build AI system message from collected context
// Order: Identity → Capabilities → Situation → Current State → Current Question → Knowledge
function buildAISystemMessage(aiContext) {
    const sections = [];

    const identityText = writeIdentity(aiContext && aiContext.cloudPilot);
    if (identityText) {
        sections.push(identityText);
    }

    const capabilitiesText = writeCapabilities(aiContext && aiContext.capabilities);
    if (capabilitiesText) {
        sections.push(capabilitiesText);
    }

    const situationText = writeSituation(aiContext && aiContext.situation);
    if (situationText) {
        sections.push(situationText);
    }

    const currentStateText = writeCurrentState(aiContext && aiContext.currentState);
    if (currentStateText) {
        sections.push(currentStateText);
    }

    const currentQuestionText = writeCurrentQuestion(aiContext && aiContext.currentQuestion);
    if (currentQuestionText) {
        sections.push(currentQuestionText);
    }

    const knowledgeText = writeKnowledge(aiContext && aiContext.knowledge);
    if (knowledgeText) {
        sections.push(knowledgeText);
    }

    return sections.join('\n\n');
}

module.exports = {
    buildAISystemMessage
};
```

### `classes/ConversationHistoryContext.js`

```javascript
const Message = require('../../../../functions/classes/Message');

/*
ConversationHistoryContext — past turns for AI (not Situation).

One job: load recent DB messages and format them for OpenAI-style roles.
Does not build Identity, Situation, or Knowledge. Does not call OpenAI.

getMessages(messageHistoryCount) = that many message ROWS (not exchanges).
Excludes the current turn's user message when it was already saved to DB.
Skips placeholder assistant replies (e.g. offline stub) so they never pollute OpenAI history.
*/

const PLACEHOLDER_ASSISTANT_REPLIES = {
    'Open AI will respond when Live': true
};

class ConversationHistoryContext {
    constructor(conversationId, options) {
        this.conversationId = conversationId;
        this.currentUserMessage =
            options && typeof options.currentUserMessage === 'string'
                ? options.currentUserMessage.trim()
                : '';
    }

    // Load last N prior rows, oldest → newest, as { role, content, speakerName }
    async getMessages(messageHistoryCount) {
        const count = normalizeMessageHistoryCount(messageHistoryCount);

        if (!this.conversationId || count < 1) {
            return [];
        }

        const outcome = await Message.getConversationMessages(this.conversationId);
        const rows =
            outcome && outcome.success && Array.isArray(outcome.messages)
                ? outcome.messages
                : [];

        const withoutCurrent = dropCurrentUserMessage(rows, this.currentUserMessage);
        const withoutPlaceholders = dropPlaceholderAssistantReplies(withoutCurrent);
        const recent = withoutPlaceholders.slice(-count);

        return recent.map(formatMessageRowForAI).filter(Boolean);
    }
}

function normalizeMessageHistoryCount(messageHistoryCount) {
    const parsed = Number(messageHistoryCount);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return 0;
    }

    return Math.floor(parsed);
}

// User message is saved before prepareGeneralMessageReply — drop that trailing row so current turn is not duplicated
function dropCurrentUserMessage(messages, currentUserMessage) {
    if (!currentUserMessage || !messages.length) {
        return messages;
    }

    const last = messages[messages.length - 1];
    const from = String(last.messageFrom || '');
    const caption = String(last.messageCaption || '').trim();

    if (from !== 'CloudPilot' && caption === currentUserMessage) {
        return messages.slice(0, -1);
    }

    return messages;
}

// Offline stub replies saved while OpenAI was off — never send these to the model
function dropPlaceholderAssistantReplies(messages) {
    const filtered = [];

    for (let i = 0; i < messages.length; i++) {
        const row = messages[i];
        const from = String(row.messageFrom || '');
        const caption = String(row.messageCaption || '').trim();

        if (from === 'CloudPilot' && PLACEHOLDER_ASSISTANT_REPLIES[caption]) {
            continue;
        }

        filtered.push(row);
    }

    return filtered;
}

function formatMessageRowForAI(row) {
    const content = String(row.messageCaption || '').trim();

    if (!content) {
        return null;
    }

    const from = String(row.messageFrom || '');
    const role = from === 'CloudPilot' ? 'assistant' : 'user';
    const speakerName = from === 'CloudPilot' ? 'CloudPilot' : from || 'Current User';

    return {
        role: role,
        content: content,
        speakerName: speakerName
    };
}

module.exports = ConversationHistoryContext;
```

### `classes/CurrentQuestionContext.js`

```javascript
/*
CurrentQuestionContext — What did the user say this turn?

Application owns this. Temporary: user message, selected finding.
Open request facts → cloudPilotCurrentStateContext (Step D).

Assembles Current Question data from processMessageContext. Does not persist sources.

METHODS A: Read pieces from this turn
    1) Method A1: getUserMessage
    2) Method A2: getSelectedFinding

METHODS B: Build Current Question data
    1) Method B1: toData
*/

class CurrentQuestionContext {
    constructor(processMessageContext) {
        this.processMessageContext = processMessageContext || {};
    }

    //METHODS A: Read pieces from this turn
    //Method A1: User message for this turn
    getUserMessage() {
        const raw = this.processMessageContext.currentUserMessage;

        if (typeof raw !== 'string') {
            return '';
        }

        return raw.trim();
    }

    //Method A2: Slim finding the user is looking at (from request body — not DB)
    getSelectedFinding() {
        return slimSelectedFinding(this.processMessageContext.selectedFinding);
    }

    //METHODS B: Build Current Question data
    //Method B1: Current Question object for AI context (JSON for CloudPilot)
    // Open request facts live in Current State (Step D) — not here.
    toData() {
        const data = {};
        const userMessage = this.getUserMessage();
        const selectedFinding = this.getSelectedFinding();

        if (userMessage) {
            data.userMessage = userMessage;
        }

        if (selectedFinding) {
            data.selectedFinding = selectedFinding;
        }

        return data;
    }
}

// Keep only small scalar fields — never dump Navigator / Atlas payloads
function slimSelectedFinding(selectedFinding) {
    if (!selectedFinding || typeof selectedFinding !== 'object' || Array.isArray(selectedFinding)) {
        return null;
    }

    const allowedKeys = [
        'ruleId',
        'instanceId',
        'name',
        'resourceName',
        'service',
        'title',
        'cpuAverage',
        'cpu',
        'lookbackDays',
        'estimatedSavings',
        'currentType',
        'recommendedType',
        'region'
    ];

    const slim = {};

    for (let i = 0; i < allowedKeys.length; i++) {
        const key = allowedKeys[i];
        const value = selectedFinding[key];

        if (value === undefined || value === null || value === '') {
            continue;
        }

        if (typeof value === 'object') {
            continue;
        }

        slim[key] = value;
    }

    if (Object.keys(slim).length === 0) {
        return null;
    }

    return slim;
}

module.exports = CurrentQuestionContext;
```

### `contextTypes/cloudPilotCapabilitiesContext.js`

```javascript
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const masterCloudPilotCapabilities = require('../../../cloudPilot/masterCloudPilotCapabilities');

/*
TYPE — CAPABILITIES (what CloudPilot can do / retrieve)

Projects ONLY model-relevant fields from masterCloudPilotCapabilities.js.
Does not include match, executionFunction, messages, or handlers.

Used by: buildAIContext → buildAISystemMessage → Final Response (General Chat)
*/

const CAPABILITIES_GROUNDING_RULE =
    'Do not invent AWS services, actions, or facts outside this capabilities list.';

//Function A1: Project master capabilities into model-facing context
function getCloudPilotCapabilitiesContext() {
    const capabilities = [];
    const keys = Object.keys(masterCloudPilotCapabilities);

    for (let i = 0; i < keys.length; i++) {
        const definition = masterCloudPilotCapabilities[keys[i]];

        if (!definition || typeof definition !== 'object') {
            continue;
        }

        if (definition.allowed !== true) {
            continue;
        }

        const actionType = definition.type
            ? String(definition.type)
            : String(keys[i]);

        if (actionType === 'general_chat' || actionType === 'show_capabilities') {
            continue;
        }

        // Skip helper exports on the module (functions)
        if (typeof definition === 'function') {
            continue;
        }

        const capability =
            definition.capability && typeof definition.capability === 'object'
                ? definition.capability
                : {};

        const entry = {
            action: actionType,
            label: definition.actionLabel
                ? String(definition.actionLabel)
                : actionType,
            description: capability.description
                ? String(capability.description).trim()
                : ''
        };

        if (Array.isArray(capability.cloudPilotCanAnswer)) {
            entry.canAnswer = capability.cloudPilotCanAnswer
                .map(function (item) {
                    return String(item);
                })
                .filter(Boolean);
        }

        if (capability.scope) {
            entry.scope = String(capability.scope).trim();
        }

        capabilities.push(entry);
    }

    const context = {
        loaded: true,
        type: 'capabilities',
        data: {
            capabilities: capabilities,
            groundingRule: CAPABILITIES_GROUNDING_RULE
        }
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Capabilities Context');
        console.log(JSON.stringify(context, null, 2));
    }

    return context;
}

module.exports = {
    getCloudPilotCapabilitiesContext,
    CAPABILITIES_GROUNDING_RULE
};
```

### `contextTypes/cloudPilotContext.js`

```javascript
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE 1 — IDENTITY (General Chat only)

Who is CloudPilot?

This is product identity for Chat. Search paths must not use it
(buildAIContext({ includeIdentity: false })).

Doc: doc/development/current/feature_cloud_pilot_context.md (Step A)

Used by: buildAIContext → buildAISystemMessage → General Chat
*/

const cloudPilotIdentity = {
    name: 'CloudPilot',

    intro: 'an AI assistant for understanding and managing AWS infrastructure',

    voice: [
        'Be conversational, clear, and concise.',
        'Answer the user\'s question directly.',
        'Prefer a short useful answer over a long explanation.',
        'Do not automatically structure answers into sections.',
        'Do not automatically explain risks, impact, or why something matters.',
        'Explain those things when they are relevant or the user asks.',
        'Speak like a knowledgeable engineer helping another person, not like documentation, a consultant, or a customer support bot.',
        'GREETING RULE: Only greet if the user\'s current message is itself a greeting. Otherwise do not begin with Hi, Hello, Hey, or Hey there.',
        'EXECUTION RULE: This reply is conversation only. Never claim a scan, change, or request is initiating, starting, running, completed, or being executed unless this turn actually ran that work.'
    ],

    productDescription:
        'CloudPilot can understand AWS infrastructure, answer questions about it, ' +
        'scan resources, identify issues, and help users safely make changes.',

    executionModes: [
        'instructions',
        'CLI commands',
        'pull requests',
        'automatic execution'
    ],

    grounding: [
        'Never invent the user\'s AWS resources, costs, requests, findings, or state.',
        'CloudPilot owns user-specific facts.',
        'Use user-specific facts only when they are provided in the current context.',
        'You may use general AWS knowledge to explain concepts.'
    ],

    conversation: [
        'Use conversation history when it helps understand what the user means.',
        'If CloudPilot provides relevant current state, incorporate it naturally.',
        'Do not repeat old information merely because it appears in conversation history.',
        'Always answer the user\'s current question first.'
    ]
};

//Function A1: Return structured Identity context (data only — no prompt string)
function getCloudPilotContext() {
    const identity = {
        loaded: true,
        type: 'identity',
        data: cloudPilotIdentity
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Identity Context');
        console.log(JSON.stringify(identity, null, 2));
    }

    return identity;
}

module.exports = {
    getCloudPilotContext,
    cloudPilotIdentity
};
```

### `contextTypes/cloudPilotCurrentStateContext.js`

```javascript
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
```

### `contextTypes/cloudPilotSituationContext.js`

```javascript
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE — SITUATION (what CloudPilot wants AI to look for / do right now)

Selectable building blocks. Data only — no prompt strings assembled here.
Rendering: buildSystemMessage.js → writeSituation

Callers select any combination via getCloudPilotSituationContext(types).
Situation pieces describe WHAT to identify and identification rules only.
Output format / JSON schema belongs to the calling AI operation
(e.g. searchMessageForRegionOpenAI), not to individual pieces.

For now ONLY the region building block exists.
*/

const situationPieces = {
    region: {
        purpose:
            'Determine whether the current user message provides or clearly identifies an AWS region.',

        rules: [
            'Return a region only when the user provided or clearly identified one',
            'Do not choose a default region',
            'Do not invent a region',
            'Normalize AWS region codes to lowercase',
            'Natural language region references may be interpreted when clear'
        ]
    },

    ai_spend: {
        purpose:
            'Determine whether the current user message is asking about CloudPilot AI / OpenAI usage or spend.',

        rules: [
            'Return a hit only when the user is clearly asking about AI or OpenAI spend, cost, or usage',
            'Do not treat AWS billing or cloud infrastructure cost questions as AI spend',
            'Do not invent dollar amounts or usage totals',
            'Classify only — CloudPilot will load real usage data'
        ]
    },

    open_requests: {
        purpose:
            'Determine whether the current user message is asking about open CloudPilot requests or actions in progress.',

        rules: [
            'Return a hit only when the user is clearly asking what requests or actions are open, pending, or waiting',
            'Do not treat new action requests (scan, toggle, create) as open-requests questions',
            'Do not invent a list of requests',
            'Classify only — CloudPilot will load real request state'
        ]
    }
};

/*
FUNCTIONS A: Situation context
    1) Function A1: getCloudPilotSituationContext
*/

//Function A1: Return structured Situation context for the selected building blocks
function getCloudPilotSituationContext(types) {
    const selected = {};
    const requested = Array.isArray(types) ? types : [];

    for (let i = 0; i < requested.length; i++) {
        const type = requested[i];

        if (situationPieces[type]) {
            selected[type] = situationPieces[type];
        }
    }

    const situation = {
        loaded: true,
        type: 'situation',
        data: selected
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Situation Context');
        console.log(JSON.stringify(situation, null, 2));
    }

    return situation;
}

module.exports = {
    getCloudPilotSituationContext
};
```

### `contextTypes/currentQuestionContext.js`

```javascript
const CurrentQuestionContext = require('../classes/CurrentQuestionContext');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE — CURRENT QUESTION
Role: What did the user say?

Application owns this. Temporary for this turn.
Build from processMessageContext — do not invent AWS facts.

MVP: userMessage + selectedFinding (from request body).
Open request facts → cloudPilotCurrentStateContext (Step D).

Used by: buildAIContext → buildAISystemMessage → AI
(Situation / what to look for is cloudPilotSituationContext — not this file.)
*/

//Function A1: Return structured Current Question context (data only)
function buildCurrentQuestionContext(processMessageContext) {
    const questionBuilder = new CurrentQuestionContext(processMessageContext);
    const data = questionBuilder.toData();

    const currentQuestion = {
        loaded: true,
        type: 'current_question',
        data: data
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Current Question Context');
        console.log(JSON.stringify(currentQuestion, null, 2));
    }

    return currentQuestion;
}

module.exports = {
    buildCurrentQuestionContext
};
```

### `contextTypes/organizationKnowledgeContext.js`

```javascript
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');

/*
TYPE 3 — KNOWLEDGE (organization slice + product slice)
Role: What background should CloudPilot know before answering?

Organization: Loaded S3 org facts for this turn (search → DB resolve).
Product: AWS rule meanings from services/knowledge/ later.

MVP: organization comes from processMessageContext.organizationKnowledge
when General Chat resolved a hit. product [].

Do not confuse with Situation (live state) or Identity (product voice).

Used by: buildAIContext → buildAISystemMessage → AI (KNOWLEDGE section)
Doc: feature_organizational_knowledge.md Step 4
*/

/*
FUNCTIONS A: Knowledge context
    1) Function A1: getOrganizationKnowledgeData
    2) Function A2: getKnowledgeContext
*/

//Function A1: Organization knowledge slice for this turn (facts already loaded)
function getOrganizationKnowledgeData(processMessageContext) {
    const context = processMessageContext || {};
    const loaded = context.organizationKnowledge;

    if (!loaded || typeof loaded !== 'object') {
        return {};
    }

    const status = String(loaded.status || '').trim();

    if (status !== 'found' && status !== 'ambiguous') {
        return {};
    }

    if (!loaded.contextBlock || !String(loaded.contextBlock).trim()) {
        return {};
    }

    const organization = {
        status: status,
        resourceReference: loaded.resourceReference || '',
        matchedBy: loaded.matchedBy || null,
        contextBlock: String(loaded.contextBlock).trim()
    };

    if (loaded.record && loaded.record.resourceName) {
        organization.resourceName = loaded.record.resourceName;
    }

    return organization;
}

//Function A2: Return structured Knowledge context (data only)
function getKnowledgeContext(processMessageContext) {
    const organization = getOrganizationKnowledgeData(processMessageContext);
    const product = [];

    const knowledge = {
        loaded: true,
        type: 'knowledge',
        data: {
            organization: organization,
            product: product
        }
    };

    if (CLOUDPILOT_AI_CONFIG.contextLogs) {
        console.log('Building Knowledge Context');
        console.log(JSON.stringify(knowledge, null, 2));
    }

    return knowledge;
}

module.exports = {
    getOrganizationKnowledgeData,
    getKnowledgeContext
};
```

### `masterContext/masterFinalResponseContext.js`

```javascript
/*
masterFinalResponseContext — recipe for General Chat / final user-facing reply

contextTypes/   = WHAT each ingredient contains
masterContext/  = WHICH ingredients this AI call receives (under context/)
operationContext/ = specialized task payloads (not used here)

Configuration only. No handlers, OpenAI calls, or prompt prose.
*/

const masterFinalResponseContext = {
    includeIdentity: true,
    includeCapabilities: true,
    includeCurrentState: true,
    includeKnowledge: false,

    // Situation ON when appropriate — empty = no Situation block for default final reply
    situationTypes: [],

    conversationHistory: {
        include: true,
        limit: 6
    }
};

module.exports = masterFinalResponseContext;
```

### `operationContext/getActionSearchContext.js`

```javascript
/*
Action Search — operation context

Assembles ONE ActionSearchContext for the Action Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildActionOpenAIMessages) format this for OpenAI only.

Doc: feature_intelligence_provider.md / how_to/intelligence_provider.md
*/

const actionMap = require('../../../cloudPilot/masterCloudPilotCapabilities');

function buildActionCatalog() {
    const catalog = [];

    for (const definition of Object.values(actionMap)) {
        if (!definition || typeof definition !== 'object') {
            continue;
        }

        if (!definition.type || definition.type === 'general_chat') {
            continue;
        }

        catalog.push({
            action: definition.type,
            label: definition.actionLabel || definition.type,
            description:
                definition.capability && definition.capability.description
                    ? definition.capability.description
                    : ''
        });
    }

    return catalog;
}

//Function A1: Build Action Search context for this operation
function getActionSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Classify the current user message using only the approved action catalog.',
                'Return an action when the user wants CloudPilot to run that capability.',
                'A question about the user’s current AWS resources requires a read capability.',
                'General knowledge questions such as "what is an EC2 instance?" are not actions.',
                'Vague help such as "help me with S3" is not an action.',
                'Only choose scan actions when the user explicitly asks to scan, analyze, or check for issues.',
                'Never answer the question and never invent AWS facts.'
            ].join('\n'),
            catalog: buildActionCatalog(),
            outputFormat: 'Return JSON only: {"action":"scan_ec2"} or {}.'
        }
    };
}

module.exports = {
    getActionSearchContext,
    buildActionCatalog
};
```

### `operationContext/getAiSpendSearchContext.js`

```javascript
/*
AI Spend Search — operation context

Assembles ONE AiSpendSearchContext for the AI Spend Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildAiSpendOpenAIMessages) format this for OpenAI only.
*/

//Function A1: Build AI Spend Search context for this operation
function getAiSpendSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is asking about CloudPilot AI / OpenAI',
                'usage or spend.',
                '',
                'Return a hit only when the user is clearly asking about AI or OpenAI',
                'spend, cost, or usage.',
                'Do not treat AWS billing or cloud infrastructure cost questions as AI spend.',
                'Classify only — do not invent dollar amounts or usage totals.'
            ].join('\n'),
            examples: [
                { input: 'how much have I spent on openai', output: '{"ai_spend":true}' },
                { input: 'show my ai spend', output: '{"ai_spend":true}' },
                { input: 'how much is my EC2 costing', output: '{}' },
                { input: 'scan ec2', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"ai_spend":true}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getAiSpendSearchContext
};
```

### `operationContext/getEc2InventorySearchContext.js`

```javascript
/*
EC2 Inventory Search — operation context

Assembles ONE Ec2InventorySearchContext for this Search TASK.
Internal receives this object today (MVP has no OpenAI path yet).
Same shape as other Search operations so a later provider can share it.
*/

//Function A1: Build EC2 Inventory Search context for this operation
function getEc2InventorySearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Classify whether the user is asking for EC2 inventory truth',
                '(how many / show / list / running) — not an explicit scan action',
                'and not a general-knowledge "what is EC2" question.',
                '',
                'Classify only. Do not invent AWS instance facts.'
            ].join('\n'),
            outputFormat: [
                'Return JSON only:',
                '{"question":"ec2_inventory"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getEc2InventorySearchContext
};
```

### `operationContext/getOpenRequestsSearchContext.js`

```javascript
/*
Open Requests Search — operation context

Assembles ONE OpenRequestsSearchContext for the Open Requests Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildOpenRequestsOpenAIMessages) format this for OpenAI only.
*/

//Function A1: Build Open Requests Search context for this operation
function getOpenRequestsSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is asking to see CloudPilot requests',
                'that are currently open, pending, or waiting.',
                '',
                'Classify only. Do not answer. Do not invent requests.',
                'Do not treat new action requests (scan, toggle, create) as open-requests questions.'
            ].join('\n'),
            examples: [
                { input: 'do I have any open requests', output: '{"open_requests":true}' },
                { input: 'what am I waiting on', output: '{"open_requests":true}' },
                { input: 'scan ec2', output: '{}' },
                { input: 'what is a request?', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"open_requests":true}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getOpenRequestsSearchContext
};
```

### `operationContext/getOrganizationalKnowledgeSearchContext.js`

```javascript
/*
Organizational Knowledge Search — operation context

Assembles ONE OrganizationalKnowledgeSearchContext for this operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters format this for OpenAI only.
Detect / extract only — CloudPilot DB resolves the reference later.
*/

function resolveSelectedResourceName(options) {
    if (!options || typeof options !== 'object') {
        return '';
    }

    if (options.selectedResourceName != null) {
        return String(options.selectedResourceName).trim();
    }

    if (options.selectedFinding != null) {
        const finding = options.selectedFinding;
        if (typeof finding === 'string') {
            return String(finding).trim();
        }
        if (finding && finding.resourceName != null) {
            return String(finding.resourceName).trim();
        }
        if (finding && finding.resource_name != null) {
            return String(finding.resource_name).trim();
        }
    }

    return '';
}

//Function A1: Build Organizational Knowledge Search context for this operation
function getOrganizationalKnowledgeSearchContext(message, options) {
    const selectedResourceName = resolveSelectedResourceName(options);

    return {
        userMessage: String(message || ''),
        selectedResourceName: selectedResourceName,
        task: {
            purpose: [
                'Determine whether the user is asking why an S3 bucket / storage resource',
                'exists in their organization (purpose, importance, whether to delete, what',
                'it is for) — not live AWS cost or a new scan action.',
                '',
                'If yes, extract how they referred to the resource as resourceReference.',
                'resourceReference may be an AWS name, a friendly display phrase, or a tag',
                'like "tutorial" or "website images".',
                '',
                'Classify / extract only. Do not invent purpose, importance, or recommended actions.',
                'Do not map aliases to AWS names. Do not answer the question.',
                '',
                'Never return importance, purpose, notes, recommendedAction, or resourceName',
                'as separate fields.'
            ].join('\n'),
            examples: [
                {
                    input: 'What is this bucket for?',
                    output: '{"knowledgeType":"s3","resourceReference":"this"}'
                },
                {
                    input: 'Tell me about my tutorial bucket.',
                    output: '{"knowledgeType":"s3","resourceReference":"tutorial"}'
                },
                {
                    input: 'What is the website images bucket?',
                    output: '{"knowledgeType":"s3","resourceReference":"website images"}'
                },
                {
                    input: 'Tell me about sam-youtube-demo',
                    output: '{"knowledgeType":"s3","resourceReference":"sam-youtube-demo"}'
                },
                { input: 'how much does this bucket cost', output: '{}' },
                { input: 'scan s3', output: '{}' },
                { input: 'hello', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only in this exact shape:',
                '{"knowledgeType":"s3","resourceReference":"<text>"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getOrganizationalKnowledgeSearchContext,
    resolveSelectedResourceName
};
```

### `operationContext/getRegionSearchContext.js`

```javascript
/*
Region Search — operation context

Assembles ONE RegionSearchContext for the Region Search operation.
Internal and OpenAI both receive this same object.

Do not put Identity / Knowledge / Chat history here.
Provider adapters (e.g. buildRegionOpenAIMessages) format this for OpenAI only.

Doc: feature_intelligence_provider.md
*/

//Function A1: Build Region Search context for this operation
function getRegionSearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Determine whether the user is PROVIDING an AWS region',
                'to be used for the current request.',
                '',
                'Return the normalized AWS region if provided.',
                '',
                'Do not return a region when the user is:',
                '- asking about a region',
                '- mentioning a region as an example',
                '- rejecting a region',
                '- discussing regions generally',
                '',
                'Interpret obvious natural-language names and minor spelling mistakes.'
            ].join('\n'),
            examples: [
                { input: 'I want to use US West 2', output: '{"region":"us-west-2"}' },
                { input: 'use USA West 2', output: '{"region":"us-west-2"}' },
                { input: 'I want to use USA Weste 2', output: '{"region":"us-west-2"}' },
                { input: "Let's do this in Oregon", output: '{"region":"us-west-2"}' },
                { input: 'What is US West 2?', output: '{}' },
                { input: 'Why do you want a region like US West 2?', output: '{}' },
                { input: "I don't want to use US West 2", output: '{}' },
                { input: 'Which region should I use?', output: '{}' }
            ],
            outputFormat: [
                'Return JSON only:',
                '{"region":"us-west-2"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getRegionSearchContext
};
```

### `operationContext/getS3InventorySearchContext.js`

```javascript
/*
S3 Inventory Search — operation context

Assembles ONE S3InventorySearchContext for this Search TASK.
Internal receives this object today (MVP has no OpenAI path yet).
Same shape as other Search operations so a later provider can share it.
*/

//Function A1: Build S3 Inventory Search context for this operation
function getS3InventorySearchContext(message) {
    return {
        userMessage: String(message || ''),
        task: {
            purpose: [
                'Classify whether the user is asking for S3 inventory truth',
                '(what buckets / how many / show / list) — not an explicit scan action',
                'and not a general-knowledge "what is S3" question.',
                '',
                'Classify only. Do not invent AWS bucket facts.'
            ].join('\n'),
            outputFormat: [
                'Return JSON only:',
                '{"question":"s3_inventory"}',
                'or',
                '{}'
            ].join('\n')
        }
    };
}

module.exports = {
    getS3InventorySearchContext
};
```

