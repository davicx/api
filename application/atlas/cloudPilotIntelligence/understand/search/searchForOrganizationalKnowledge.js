const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const SearchLogs = require('./helpers/searchLogs');
const {
    getOrganizationalKnowledgeSearchContext
} = require('../../context/operationContext/getOrganizationalKnowledgeSearchContext');

/*
FUNCTIONS A: Organizational knowledge search (S3 MVP)
    1) Function A1: shouldRunOrganizationalKnowledgeSearch
    2) Function A2: searchForOrganizationalKnowledge
    3) Function A3: searchForOrganizationalKnowledgeInternal
    4) Function A4: searchForOrganizationalKnowledgeOpenAI

HELPERS
    1) Helper H1: parseOpenAIOrganizationalKnowledgeResponse
    2) Helper H2: buildOrganizationalKnowledgeOpenAIMessages
    3) Helper H3: normalizeOrganizationalKnowledgeHit
    4) Helper H4: getSelectedResourceName
    5) Helper H5: messageUsesSelectedFinding
    6) Helper H6: extractInternalResourceReference

ONE operation context → same object to Internal and OpenAI.
buildOrganizationalKnowledgeOpenAIMessages = OpenAI adapter only.
Returns { knowledgeType: 's3', resourceReference } or {}.
*/

//HELPERS
//Helper H1: Parse OpenAI extract response — strict shape only
function parseOpenAIOrganizationalKnowledgeResponse(raw) {
    if (raw === undefined || raw === null) {
        return {};
    }

    let text = String(raw).trim();
    if (!text) {
        return {};
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
        text = fenced[1].trim();
    }

    try {
        const parsed = JSON.parse(text);
        return normalizeOrganizationalKnowledgeHit(parsed);
    } catch (err) {
        return {};
    }
}

//Helper H2: OpenAI adapter — format OrganizationalKnowledgeSearchContext
function buildOrganizationalKnowledgeOpenAIMessages(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const userMessage = String(searchContext.userMessage || '');
    const selectedResourceName = String(searchContext.selectedResourceName || '');
    const task = searchContext.task || {};
    const purpose = String(task.purpose || '');
    const examples = Array.isArray(task.examples) ? task.examples : [];
    const outputFormat = String(task.outputFormat || '');

    const exampleLines = [];

    for (let i = 0; i < examples.length; i++) {
        const example = examples[i] || {};
        exampleLines.push('"' + String(example.input || '') + '"');
        exampleLines.push(String(example.output || ''));
        exampleLines.push('');
    }

    const systemParts = [
        'TASK',
        '',
        purpose,
        '',
        outputFormat,
        '',
        'EXAMPLES',
        '',
        exampleLines.join('\n').trim()
    ];

    if (selectedResourceName) {
        systemParts.push(
            '',
            'SELECTED FINDING',
            '',
            'The UI has a selected S3 resource named: "' + selectedResourceName + '".',
            'If the user refers to "this" / "this bucket" / "that bucket" without naming',
            'another resource, set resourceReference to that selected name.'
        );
    }

    const systemMessage = systemParts.join('\n');

    const messages = [
        { role: 'system', content: systemMessage },
        {
            role: 'user',
            content: 'CURRENT MESSAGE\n\n"' + userMessage + '"\n\nReturn JSON only.'
        }
    ];

    return {
        systemMessage: systemMessage,
        messages: messages,
        contextSummary: OpenAIClient.summarizeSearchTaskContext()
    };
}

//Helper H3: Keep only knowledgeType + resourceReference
function normalizeOrganizationalKnowledgeHit(parsed) {
    if (!parsed || typeof parsed !== 'object') {
        return {};
    }

    const knowledgeTypeRaw =
        parsed.knowledgeType != null
            ? String(parsed.knowledgeType).trim().toLowerCase()
            : '';
    let resourceReference =
        parsed.resourceReference != null
            ? String(parsed.resourceReference).trim()
            : '';

    if (!resourceReference && parsed.resource_reference != null) {
        resourceReference = String(parsed.resource_reference).trim();
    }

    if (!resourceReference) {
        return {};
    }

    // MVP: s3 only (accept legacy "s3_bucket")
    if (
        knowledgeTypeRaw &&
        knowledgeTypeRaw !== 's3' &&
        knowledgeTypeRaw !== 's3_bucket'
    ) {
        return {};
    }

    return {
        knowledgeType: 's3',
        resourceReference: resourceReference
    };
}

//Helper H4: Optional selected finding name from options (gate / callers)
function getSelectedResourceName(options) {
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

//Helper H5: Message clearly about the selected / "this" resource
function messageUsesSelectedFinding(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    return (
        /\bthis bucket\b/.test(text) ||
        /\bthat bucket\b/.test(text) ||
        /\bthis resource\b/.test(text) ||
        /what is this (bucket )?for/.test(text) ||
        /what's this (bucket )?for/.test(text) ||
        /whats this (bucket )?for/.test(text) ||
        /why (do )?i have this/.test(text) ||
        /is this (bucket )?important/.test(text) ||
        /should i delete this/.test(text)
    );
}

//Helper H6: Internal phrase / pattern extract of resourceReference
function extractInternalResourceReference(message) {
    const raw = String(message || '').trim();
    const text = raw.toLowerCase();

    if (!text) {
        return '';
    }

    const knownNames = [
        'sam-youtube-demo',
        'cloudpilot-assets',
        'cloudpilot-user-uploads'
    ];

    for (let i = 0; i < knownNames.length; i++) {
        if (text.includes(knownNames[i])) {
            return knownNames[i];
        }
    }

    const displayPhrases = [
        'sam youtube demo',
        'cloudpilot assets',
        'cloudpilot user uploads',
        'user uploads'
    ];

    for (let j = 0; j < displayPhrases.length; j++) {
        if (text.includes(displayPhrases[j])) {
            return displayPhrases[j];
        }
    }

    const taggedBucket = text.match(
        /\b(?:my|the|our|about(?:\s+my|\s+the)?)\s+(.+?)\s+bucket\b/
    );
    if (taggedBucket && taggedBucket[1]) {
        return String(taggedBucket[1]).trim();
    }

    const aboutMine = text.match(/\b(?:tell me about|what about)\s+my\s+(.+)$/);
    if (aboutMine && aboutMine[1]) {
        return String(aboutMine[1])
            .replace(/\?+$/, '')
            .trim();
    }

    return '';
}

//FUNCTIONS A: Organizational knowledge search
//Function A1: Cheap gate — skip unrelated messages
function shouldRunOrganizationalKnowledgeSearch(message, options) {
    const text = String(message || '').toLowerCase();
    const selectedResourceName = getSelectedResourceName(options);

    if (!text.trim()) {
        return false;
    }

    if (selectedResourceName && messageUsesSelectedFinding(text)) {
        return true;
    }

    if (
        /bucket|s3|upload|uploads|assets|tutorial|youtube|what is .+ for|what's .+ for|whats .+ for|purpose|important|safe to delete|should i delete/.test(
            text
        )
    ) {
        return true;
    }

    if (/tell me about|what about/.test(text) && /my |the /.test(text)) {
        return true;
    }

    return false;
}

//Function A2: Select how CloudPilot searches for organizational knowledge
async function searchForOrganizationalKnowledge(message, options) {
    const userMessage = String(message || '');
    const searchOptions = options || {};

    //STEP 1: Should I run?
    if (!shouldRunOrganizationalKnowledgeSearch(userMessage, searchOptions)) {
        SearchLogs.recordSearch({
            name: 'Org Knowledge',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: One operation context for every provider
    const orgKnowledgeSearchContext = getOrganizationalKnowledgeSearchContext(
        message,
        searchOptions
    );

    //STEP 3: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.orgKnowledgeSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;

    if (useOpenAI) {
        const openAIOutcome = await searchForOrganizationalKnowledgeOpenAI(
            orgKnowledgeSearchContext
        );
        result = openAIOutcome.result || {};
        SearchLogs.recordSearch({
            name: 'Org Knowledge',
            method: openAIOutcome.fallback ? 'Internal' : 'OpenAI',
            result: result.resourceReference || null
        });
        return result;
    }

    // Preview when openai requested but master off
    if (openaiRequested && masterDisabled) {
        const openAIRequest = buildOrganizationalKnowledgeOpenAIMessages(
            orgKnowledgeSearchContext
        );
        OpenAIClient.logOpenAI({
            capability: 'Org Knowledge Search',
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: true
        });
    }

    result = searchForOrganizationalKnowledgeInternal(orgKnowledgeSearchContext);
    SearchLogs.recordSearch({
        name: 'Org Knowledge',
        method: 'Internal',
        result: result.resourceReference || null
    });
    return result;
}

//Function A3: Internal — receives same OrganizationalKnowledgeSearchContext as OpenAI
function searchForOrganizationalKnowledgeInternal(context) {
    const searchContext = context && typeof context === 'object' ? context : {};
    const message = String(searchContext.userMessage || '');
    const selectedResourceName = String(searchContext.selectedResourceName || '');

    if (selectedResourceName && messageUsesSelectedFinding(message)) {
        return {
            knowledgeType: 's3',
            resourceReference: selectedResourceName
        };
    }

    const resourceReference = extractInternalResourceReference(message);

    if (!resourceReference) {
        return {};
    }

    const text = message.toLowerCase();
    const looksLikeKnowledgeAsk =
        /what is|what's|whats|tell me about|what about|purpose|important|delete|for\?|bucket for/.test(
            text
        );

    if (!looksLikeKnowledgeAsk) {
        return {};
    }

    return {
        knowledgeType: 's3',
        resourceReference: resourceReference
    };
}

//Function A4: OpenAI — receives same OrganizationalKnowledgeSearchContext as Internal
async function searchForOrganizationalKnowledgeOpenAI(context) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForOrganizationalKnowledgeInternal(context),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.orgKnowledgeTokenLimit;
        const openAIRequest = buildOrganizationalKnowledgeOpenAIMessages(context);

        const apiResult = await OpenAIClient.createOpenAiChatCompletion(client, {
            model: config.model,
            messages: openAIRequest.messages,
            max_tokens: maxTokens,
            temperature: 0,
            feature: 'org_knowledge_search'
        });

        const openAIResponse =
            apiResult.data !== undefined && apiResult.data !== null
                ? String(apiResult.data)
                : '';

        OpenAIClient.logOpenAI({
            capability: 'Org Knowledge Search',
            model: config.model,
            conversationHistoryEnabled: false,
            conversationHistoryCount: 0,
            context: openAIRequest.contextSummary,
            messages: openAIRequest.messages,
            previewOnly: false,
            responseText: apiResult.success
                ? openAIResponse
                : apiResult.message || apiResult.error || 'OpenAI request failed',
            usage: apiResult.success ? apiResult.usage : null
        });

        if (!apiResult.success) {
            return {
                result: searchForOrganizationalKnowledgeInternal(context),
                billing: true,
                openAIResponse: openAIResponse,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        let hit = parseOpenAIOrganizationalKnowledgeResponse(apiResult.data);

        const selectedResourceName = String(
            context && context.selectedResourceName ? context.selectedResourceName : ''
        );
        if (
            hit.resourceReference &&
            selectedResourceName &&
            /^(this|that|this bucket|that bucket)$/i.test(hit.resourceReference)
        ) {
            hit = {
                knowledgeType: 's3',
                resourceReference: selectedResourceName
            };
        }

        return {
            result: hit,
            billing: true,
            openAIResponse: openAIResponse,
            fallback: null
        };
    } catch (error) {
        return {
            result: searchForOrganizationalKnowledgeInternal(context),
            billing: false,
            openAIResponse: null,
            fallback: error && error.message ? error.message : String(error)
        };
    }
}

module.exports = {
    shouldRunOrganizationalKnowledgeSearch,
    searchForOrganizationalKnowledge,
    searchForOrganizationalKnowledgeInternal,
    searchForOrganizationalKnowledgeOpenAI,
    buildOrganizationalKnowledgeOpenAIMessages
};
