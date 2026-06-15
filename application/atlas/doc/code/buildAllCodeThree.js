/**
 * Builds doc/code/allCodeThree.js — active Atlas pipeline only.
 * Excludes orphaned files, handler implementations, and commented-out blocks.
 */
const fs = require('fs');
const path = require('path');

const ATLAS_ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(__dirname, 'allCodeThree.js');

const FILES = [
    'routes/messageRoutes.js',
    'logic/messages.js',
    'functions/config/chatGPTconfig.js',
    'state/ActionState.js',
    'functions/actionStatusFunctions.js',
    'functions/classes/Actions.js',
    'functions/actions/actionStateFunctions.js',
    'functions/decision/decisionTypes.js',
    'functions/decision/decideNextStep.js',
    'functions/understanding/search/searchMessageForAction.js',
    'functions/understanding/search/searchMessageForConversation.js',
    'functions/understanding/search/searchMessageForInstanceId.js',
    'functions/understanding/search/searchMessageForInstanceType.js',
    'functions/understanding/search/searchMessageForName.js',
    'functions/understanding/search/searchMessageForRegion.js',
    'functions/understanding/search/searchMessageForReply.js',
    'functions/understanding/search/searchMessageForStructuredFields.js',
    'functions/understanding/search/searchMessageForValues.js',
    'functions/understanding/understandMessage.js',
    'functions/requests/requestHelpers.js',
    'functions/requests/startRequest.js',
    'functions/requests/updateRequest.js',
    'functions/requests/applyDecision.js',
    'functions/responses/buildCloudPilotResponse.js',
    'functions/responses/buildGeneralChatResponse.js',
    'functions/responses/buildResponse.js',
    'functions/chat/CloudPilotChat.js',
    'functions/classes/AtlasExecution.js',
    'functions/actions/actionRegistry.js',
    'functions/chat/openAI/openAIFunctions.js',
    'functions/cloudPilotMessageFunctions.js'
];

function trimCloudPilotMessageFunctions(content) {
    const lines = content.split('\n');
    const out = [];
    let skipUntilCloseComment = false;
    let inDeadFunction = false;
    let braceDepth = 0;

    const deadFunctionStarts = [
        'async function handleGeneralChat(',
        'function shouldStartNewAction(',
        'function resolveNullActionEvent('
    ];

    for (let idx = 0; idx < lines.length; idx += 1) {
        const line = lines[idx];

        if (line.trim() === '/*' && idx > 180) {
            skipUntilCloseComment = true;
            continue;
        }

        if (line.includes('// TO DO: remove me — replaced by understanding')) {
            while (idx < lines.length && !lines[idx].startsWith('function getActionDefinition')) {
                idx += 1;
            }
            idx -= 1;
            continue;
        }

        if (skipUntilCloseComment) {
            if (line.trim() === '*/') {
                skipUntilCloseComment = false;
            }
            continue;
        }

        if (line.startsWith('module.exports')) {
            inDeadFunction = false;
            out.push(line);
            continue;
        }

        if (!inDeadFunction) {
            for (const start of deadFunctionStarts) {
                if (line.includes(start)) {
                    inDeadFunction = true;
                    braceDepth = 0;
                    break;
                }
            }
        }

        if (inDeadFunction) {
            for (const ch of line) {
                if (ch === '{') {
                    braceDepth += 1;
                } else if (ch === '}') {
                    braceDepth -= 1;
                }
            }

            if (braceDepth <= 0 && line.includes('}')) {
                inDeadFunction = false;
            }
            continue;
        }

        if (line.includes('// GOAL') || line.includes('//GOAL') || line.includes('//FINAL') || line.includes('//APPENDIX')) {
            break;
        }

        out.push(line);
    }

    let trimmed = out.join('\n');

    trimmed = trimmed.replace(
        /const Functions = require\('\.\/functions'\);\n/,
        ''
    );
    trimmed = trimmed.replace(
        /const AtlasExecution = require\('\.\/classes\/AtlasExecution'\);\n/,
        ''
    );
    trimmed = trimmed.replace(
        /const CloudPilotChat = require\('\.\/chat\/CloudPilotChat'\);\n/,
        ''
    );

    trimmed = trimmed.replace(
        /const ActionStatusFunctions = require\('\.\/actionStatusFunctions'\);\n/,
        ''
    );

    trimmed = trimmed.replace(/^\s*\/\/let .+\n/gm, '');

    trimmed = trimmed.replace(
        /\/\/FUNCTIONS C: Chat Handlers\n\/\/Function C1: Handle General Chat\n\n/g,
        ''
    );
    trimmed = trimmed.replace(
        /\/\/Function D2: Should Start New Action\n\n/g,
        ''
    );
    trimmed = trimmed.replace(
        /\/\/Function D5: Resolve null actionEvent when workflow is still open\n\n/g,
        ''
    );

    return trimmed.trim() + '\n';
}

function trimActionRegistry(content) {
    const lines = content.split('\n');
    const out = [];
    let skippingHandlerRequires = true;

    for (const line of lines) {
        if (skippingHandlerRequires) {
            if (line.startsWith('const ') && line.includes("require('./")) {
                continue;
            }
            skippingHandlerRequires = false;
        }

        out.push(line);
    }

    let trimmed = out.join('\n');
    trimmed = trimmed.replace(/executionFunction:\s*inventoryAWSHandler/g, 'executionFunction: null /* handler excluded — STEP 6 not wired */');
    trimmed = trimmed.replace(/executionFunction:\s*scanEC2Handler/g, 'executionFunction: null /* handler excluded — STEP 6 not wired */');
    trimmed = trimmed.replace(/executionFunction:\s*toggleEC2Handler/g, 'executionFunction: null /* handler excluded — STEP 6 not wired */');
    trimmed = trimmed.replace(/executionFunction:\s*createEC2Handler/g, 'executionFunction: null /* handler excluded — STEP 6 not wired */');
    trimmed = trimmed.replace(/executionFunction:\s*deleteEC2Handler/g, 'executionFunction: null /* handler excluded — STEP 6 not wired */');

    return trimmed;
}

function processFile(relativePath, raw) {
    if (relativePath === 'functions/cloudPilotMessageFunctions.js') {
        return trimCloudPilotMessageFunctions(raw);
    }

    if (relativePath === 'functions/actions/actionRegistry.js') {
        return trimActionRegistry(raw);
    }

    return raw;
}

const today = new Date().toISOString().slice(0, 10);
const header = `// @ts-nocheck
/**
 * Active CloudPilot / Atlas pipeline (reference snapshot).
 * Real DB + real chat; STEP 6 execution not wired yet (mock planned).
 * Excludes: orphaned modules, action handlers, navigator adapters, commented-out blocks.
 * For reference only — not a runnable module (multiple module.exports).
 * Updated: ${today}
 *
 * Pipeline:
 *   STEP 1 Normalize → STEP 2 Load request → STEP 3 Understand → STEP 4 Decide
 *   → STEP 5 Apply → STEP 7 Build response (STEP 6 executeRequest planned)
 *
 * Excluded files:
 *   workflowConversationFunctions.js, focusedWorkflowFunctions.js,
 *   conversationStateFunctions.js, functions/functions.js (legacy helpers),
 *   ec2/* handlers, aws/inventory handlers, navigatorResponseFunctions.js
 */

`;

let output = header;

for (const relativePath of FILES) {
    const fullPath = path.join(ATLAS_ROOT, relativePath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const body = processFile(relativePath, raw);

    output += '\n// ================================================================================\n';
    output += '// FILE: application/atlas/' + relativePath + '\n';
    output += '// ================================================================================\n\n';
    output += body.trim() + '\n';
}

fs.writeFileSync(OUT_FILE, output, 'utf8');
console.log('Wrote', OUT_FILE, '(' + output.split('\n').length + ' lines)');
