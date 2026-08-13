const OpenAIClient = require('../../../providers/openAI/client/openAIClient');
const { CHAT_CONFIG } = require('../../../config/chatGPTconfig');
const { CLOUDPILOT_AI_CONFIG } = require('../../../config/cloudPilotAIConfig');
const SearchLogs = require('./helpers/searchLogs');

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

Public entry — shouldRun + Internal | OpenAI.
Returns { knowledgeType: 's3', resourceReference } or {}.

Detect / extract only. CloudPilot DB resolves the reference later.
OpenAI must NOT return purpose, importance, recommendedAction, or AWS names as facts.

Search OpenAI = tiny TASK only (no Chat Identity / Knowledge / history).
Doc: feature_organizational_knowledge.md Step 2
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

//Helper H2: Build tiny Organizational Knowledge Search TASK messages
function buildOrganizationalKnowledgeOpenAIMessages(message, options) {
    const userMessage = String(message || '');
    const selectedResourceName = getSelectedResourceName(options);

    const systemParts = [
        'TASK',
        '',
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
        'Return JSON only in this exact shape:',
        '{"knowledgeType":"s3","resourceReference":"<text>"}',
        'or',
        '{}',
        '',
        'Never return importance, purpose, notes, recommendedAction, or resourceName',
        'as separate fields.',
        '',
        'EXAMPLES',
        '',
        '"What is this bucket for?"',
        '{"knowledgeType":"s3","resourceReference":"this"}',
        '',
        '"Tell me about my tutorial bucket."',
        '{"knowledgeType":"s3","resourceReference":"tutorial"}',
        '',
        '"What is the website images bucket?"',
        '{"knowledgeType":"s3","resourceReference":"website images"}',
        '',
        '"Tell me about sam-youtube-demo"',
        '{"knowledgeType":"s3","resourceReference":"sam-youtube-demo"}',
        '',
        '"how much does this bucket cost"',
        '{}',
        '',
        '"scan s3"',
        '{}',
        '',
        '"hello"',
        '{}'
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

//Helper H4: Optional selected finding name from options
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

    // Exact-ish AWS name patterns from demo + generic bucket-looking tokens
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

    // Display-ish phrases
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

    // "my tutorial bucket" / "the website images bucket" / "about my tutorial bucket"
    const taggedBucket = text.match(
        /\b(?:my|the|our|about(?:\s+my|\s+the)?)\s+(.+?)\s+bucket\b/
    );
    if (taggedBucket && taggedBucket[1]) {
        return String(taggedBucket[1]).trim();
    }

    // "tell me about my tutorial" (no "bucket")
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

    //STEP 2: How should I run? (Internal or OpenAI via config)
    const openaiRequested = CLOUDPILOT_AI_CONFIG.orgKnowledgeSearch === 'openai';
    const masterDisabled = !CLOUDPILOT_AI_CONFIG.aiEnabled;
    const useOpenAI = openaiRequested && !masterDisabled;

    let result;

    if (useOpenAI) {
        const openAIOutcome = await searchForOrganizationalKnowledgeOpenAI(
            userMessage,
            searchOptions
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
            userMessage,
            searchOptions
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

    result = searchForOrganizationalKnowledgeInternal(userMessage, searchOptions);
    SearchLogs.recordSearch({
        name: 'Org Knowledge',
        method: 'Internal',
        result: result.resourceReference || null
    });
    return result;
}

//Function A3: Find org-knowledge intent + reference using internal rules
function searchForOrganizationalKnowledgeInternal(message, options) {
    const selectedResourceName = getSelectedResourceName(options);

    // Selected finding + "this bucket" style question
    if (selectedResourceName && messageUsesSelectedFinding(message)) {
        return {
            knowledgeType: 's3',
            resourceReference: selectedResourceName
        };
    }

    const resourceReference = extractInternalResourceReference(message);

    if (!resourceReference) {
        // Selected finding alone does not force a hit without a knowledge-style ask
        return {};
    }

    // Require a knowledge-style ask when we only extracted a name/tag from text
    const text = String(message || '').toLowerCase();
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

//Function A4: Extract org-knowledge reference using OpenAI (+ shared context system)
async function searchForOrganizationalKnowledgeOpenAI(message, options) {
    try {
        const client = OpenAIClient.getOpenAIClient();

        if (!client) {
            return {
                result: searchForOrganizationalKnowledgeInternal(message, options),
                billing: false,
                openAIResponse: null,
                fallback: 'no API key / client'
            };
        }

        const config = CHAT_CONFIG.LOW;
        const maxTokens = CLOUDPILOT_AI_CONFIG.orgKnowledgeTokenLimit;
        const openAIRequest = buildOrganizationalKnowledgeOpenAIMessages(
            message,
            options
        );

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
                result: searchForOrganizationalKnowledgeInternal(message, options),
                billing: true,
                openAIResponse: openAIResponse,
                fallback: apiResult.message || apiResult.error || 'request failed'
            };
        }

        let hit = parseOpenAIOrganizationalKnowledgeResponse(apiResult.data);

        // Resolve "this" / empty-ish selected references to the selected finding name
        const selectedResourceName = getSelectedResourceName(options);
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
            result: searchForOrganizationalKnowledgeInternal(message, options),
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
