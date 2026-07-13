/*
temp.js — scratch copy of CloudPilot context stack (NOT wired / NOT imported)

Included:
  1) services/context/* (all)
  2) CloudPilotMessage.speakGeneral (only caller of context today)
  3) openAIFunctions.sendGeneralChat (receives rendered prompt)

NOT included:
  - actionMap.js — context does NOT pull from it today
    (Situation may list capabilities later; that would be a future dependency)
  - requestTemplates / speakRequest — template path, not context/OpenAI
  - full openai client helpers / CHAT_CONFIG — implementation detail of sendGeneralChat

Source paths are marked. Paste/compare only.
*/

// =============================================================================
// FILE: contextTypes/cloudPilotContext.js
// =============================================================================

/*
TYPE 1 — IDENTITY

Who is CloudPilot?

This is product identity, not prompt text.
It rarely changes and stays in code.

Used by: buildConversationContext → buildCloudPilotInstructions → AI (IDENTITY section)
*/

const cloudPilotIdentity = {
    name: 'CloudPilot',

    role: 'Cloud infrastructure assistant',

    communication: {
        tone: 'clear',
        jargon: 'avoid_when_possible'
    },

    goals: [
        'help users understand cloud infrastructure',
        'help users safely manage cloud resources'
    ],

    principles: [
        'explain what is happening',
        'explain why it matters',
        'explain possible risks',
        'explain possible impact'
    ],

    constraints: [
        'never invent AWS findings',
        'CloudPilot owns cloud knowledge',
        'only explain facts provided by CloudPilot'
    ]
};

//Function A1: Return structured Identity context (data only — no prompt string)
function getCloudPilotContext() {
    const identity = {
        loaded: true,
        type: 'identity',
        data: cloudPilotIdentity
    };

    console.log('Building Identity Context');
    console.log(JSON.stringify(identity, null, 2));

    return identity;
}

// =============================================================================
// FILE: contextTypes/currentQuestionContext.js
// =============================================================================

/*
TYPE 2 — SITUATION
Role: What is happening right now? (Full CloudPilot state this turn — not just the user's words.)

Built from the pipeline: request row, handler output, decision, last action.
Not prompt engineering — this IS the current state object.

Target shape (fields added incrementally; only populated keys are sent):
{
    userMessage,
    previousAction,
    openRequest,
    selectedResource,
    findings,
    dashboardData,
    executionMode,
    capabilities
}

MVP today: userMessage only.
See: doc/development/cloud_pilot_chat.md

Used by: buildConversationContext → buildCloudPilotInstructions → AI (CURRENT SITUATION section)
*/

function buildCurrentQuestionContext({ userMessage }) {
    return {
        userMessage: typeof userMessage === 'string' ? userMessage.trim() : ''
    };
}

// =============================================================================
// FILE: contextTypes/organizationKnowledgeContext.js
// =============================================================================

/*
TYPE 3 — KNOWLEDGE (organization slice)
Role: What company-specific background should CloudPilot know before answering?

Examples: Team tag required, Terraform-only, no prod auto-delete, change windows.
Source: database per org/group (groupID) — NOT in repo.

MVP: returns empty object. Product knowledge (AWS rules, rule meanings) lives separately
in services/knowledge/ and is merged into the KNOWLEDGE prompt section at build time.

Do not confuse with Situation (live state) or Identity (product voice).

Used by: buildConversationContext → buildCloudPilotInstructions → AI (KNOWLEDGE section)
*/

function getOrganizationKnowledgeContext() {
    return {};
}

// =============================================================================
// FILE: buildConversationContext.js
// =============================================================================

/*
Collect everything CloudPilot currently knows about this conversation.

Roles:
  Identity  (cloudPilotContext)
  Situation (currentQuestionContext)
  Knowledge (organizationKnowledgeContext + product knowledge from services/knowledge/ later)

Build only — no AI calls, no env toggles.
Identity / Situation / Knowledge builders may log their own data (Step 1+).
All intelligence belongs here; buildCloudPilotInstructions should stay dumb formatting.
*/

function buildConversationContext({ userMessage }) {
    const cloudPilot = getCloudPilotContext();
    const currentQuestion = buildCurrentQuestionContext({ userMessage: userMessage });
    const organizationKnowledgeContext = getOrganizationKnowledgeContext();

    return {
        cloudPilot: cloudPilot,
        currentQuestion: currentQuestion,
        organizationKnowledgeContext: organizationKnowledgeContext,
        log: {
            identity: cloudPilot,
            situation: currentQuestion,
            knowledge: {
                organization: organizationKnowledgeContext,
                product: []
            }
        }
    };
}

// =============================================================================
// FILE: buildCloudPilotInstructions.js  (renderer — still expects cloudPilot.text today)
// =============================================================================

/*
Builds the instructions sent to the AI.

Keep this file dumb: no AWS logic, no business rules.
Only format Identity + Situation + Knowledge sections.
Intelligence lives in context files and services/knowledge/.
*/

function hasOrganizationKnowledge(organizationKnowledge) {
    return (
        organizationKnowledge &&
        typeof organizationKnowledge === 'object' &&
        Object.keys(organizationKnowledge).length > 0
    );
}

function formatSituationSection(currentQuestion) {
    if (!currentQuestion || typeof currentQuestion !== 'object') {
        return '';
    }

    return JSON.stringify(currentQuestion, null, 2);
}

function buildCloudPilotInstructions(context) {
    const sections = [];

    if (context.cloudPilot && context.cloudPilot.text) {
        sections.push('CLOUD PILOT: Context\n----------------\n' + context.cloudPilot.text);
    }

    if (context.currentQuestion) {
        sections.push(
            'CURRENT SITUATION: Context\n----------------\n' + formatSituationSection(context.currentQuestion)
        );
    }

    if (hasOrganizationKnowledge(context.organizationKnowledgeContext)) {
        sections.push(
            'ORGANIZATIONAL KNOWLEDGE: Context\n----------------\n' +
                JSON.stringify(
                    {
                        organization: context.organizationKnowledgeContext
                    },
                    null,
                    2
                )
        );
    }

    return sections.join('\n\n');
}

// =============================================================================
// RELATED: conversation/CloudPilotMessage.js — speakGeneral only (context entry point)
// =============================================================================

/*
CloudPilotMessage — how CloudPilot communicates with the user.

Single voice for General and Request Conversation.
General: context build → log → optional OpenAI. Request: templates.
*/

const GENERAL_CHAT_STUB_MESSAGE = 'Open AI will respond when Live';

function isOpenAiEnhancedRepliesEnabled() {
    return process.env.OPENAI_ENHANCED_REPLIES === 'true';
}

function logGeneralConversationContext(contextLog) {
    console.log('______________________________________________________________');
    console.log('STEP 7a: Build General Conversation Context');
    console.log(JSON.stringify(contextLog, null, 2));
    console.log('______________________________________________________________');
    console.log(' ');
}

//Function A1: General Conversation speak
async function speakGeneral(context) {
    const currentUserMessage = context.currentUserMessage || '';
    const builtContext = buildConversationContext({
        userMessage: currentUserMessage
    });

    const aiEnabled = isOpenAiEnhancedRepliesEnabled();

    logGeneralConversationContext({
        ...builtContext.log,
        aiEnabled: aiEnabled
    });

    let openAIResult;

    if (aiEnabled) {
        const cloudPilotInstructions = buildCloudPilotInstructions(builtContext);
        openAIResult = await openAIFunctions.sendGeneralChat(currentUserMessage, cloudPilotInstructions);
    } else {
        openAIResult = {
            success: true,
            data: GENERAL_CHAT_STUB_MESSAGE
        };
    }

    if (!openAIResult.success) {
        return formatOutgoing({
            success: false,
            cloudPilotMessage: '',
            chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
            atlasResponse: null,
            error: openAIResult.message || 'general_chat_failed'
        });
    }

    const cloudPilotMessage = openAIResult.data ? String(openAIResult.data).trim() : '';

    return formatOutgoing({
        success: Boolean(cloudPilotMessage),
        cloudPilotMessage: cloudPilotMessage,
        chatType: CHAT_TYPE.GENERAL_CHAT_RESPONDING,
        atlasResponse: null,
        error: null
    });
}

//Function B1: Normalize outgoing speak shape
function formatOutgoing(outcome) {
    return {
        success: Boolean(outcome.success),
        cloudPilotMessage: outcome.cloudPilotMessage ? String(outcome.cloudPilotMessage) : '',
        chatType: outcome.chatType || null,
        atlasResponse: outcome.atlasResponse || null,
        error: outcome.error || null
    };
}

// =============================================================================
// RELATED: engines/llm/openai/openAIFunctions.js — sendGeneralChat only
// (helpers getOpenAIClient / createOpenAiChatCompletion / CHAT_CONFIG omitted)
// =============================================================================

async function sendGeneralChat(userMessage, systemPrompt) {
    const norm = normalizeUserMessageForModel(userMessage);
    if (!norm.ok) {
        return { success: false, message: norm.message, data: null };
    }

    const text = norm.text;
    const maxIn = OPENAI_SAFE_DEFAULTS.MAX_USER_INPUT_CHARS;
    if (text.length > maxIn) {
        return {
            success: false,
            message: 'message too long (max ' + maxIn + ' characters)',
            data: null
        };
    }

    const client = getOpenAIClient();
    if (!client) {
        console.warn('[sendGeneralChat] OPENAI_API_KEY is not set');
        return { success: false, message: 'OPENAI_API_KEY is not configured', data: null };
    }

    const config = CHAT_CONFIG.LOW;
    console.log('[sendGeneralChat] model=%s max_tokens=%s temperature=%s', config.model, config.max_tokens, config.temperature);

    const defaultSystemContent =
        'You are CloudPilot, an AWS infrastructure assistant.\n\n' +
        'Prioritize:\n' +
        '- AWS terminology\n' +
        '- operationally useful answers\n' +
        '- exact AWS resource names\n' +
        '- exact AWS region identifiers when relevant\n\n' +
        'Keep responses brief, practical, and natural.\n' +
        'Keep responses under 15 words unless a short follow-up question is needed.\n' +
        'Do not claim AWS actions were executed.';

    const result = await createOpenAiChatCompletion(client, {
        model: config.model,
        messages: [
            {
                role: 'system',
                content: systemPrompt || defaultSystemContent
            },
            { role: 'user', content: text }
        ],
        max_tokens: config.max_tokens,
        temperature: config.temperature
    });

    if (result.success && result.usage) {
        console.log(
            '[sendGeneralChat] usage prompt=%s completion=%s total=%s',
            result.usage.prompt_tokens,
            result.usage.completion_tokens,
            result.usage.total_tokens
        );
    }

    return result;
}
