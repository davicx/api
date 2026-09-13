const actionMap = require('../../../../cloudPilot/masterCloudPilotCapabilities');
const SearchLogs = require('../helpers/searchLogs');
const {
    getS3InventorySearchContext
} = require('../../../context/operationContext/getS3InventorySearchContext');

/*
FUNCTIONS A: S3 inventory Question search
    1) Function A1: shouldRunS3InventorySearch
    2) Function A2: searchForS3Inventory
    3) Function A3: searchForS3InventoryInternal

HELPERS
    1) Helper H1: isExplicitScanCommand

ONE operation context → Internal (MVP has no OpenAI path yet).
Same Search TASK shape as Region / Action / Questions.
Returns { question: 's3_inventory' } or {}.
*/

//HELPERS
//Helper H1: Explicit scan stays on Action Search — not this Question
function isExplicitScanCommand(message) {
    return /\bscan\b/.test(String(message || '').toLowerCase());
}

//FUNCTIONS A: S3 inventory Question search
//Function A1: Cheap gate — skip unrelated messages
function shouldRunS3InventorySearch(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    if (!/\bs3\b/.test(text) && !/\bbuckets\b/.test(text)) {
        return false;
    }

    if (isExplicitScanCommand(text)) {
        return false;
    }

    if (
        /\bwhat\s+is\s+(an?\s+)?s3\b/.test(text) ||
        /\bwhat\s+is\s+(an?\s+)?s3\s+bucket\b/.test(text) ||
        /\bwhat\s+is\s+a\s+bucket\b/.test(text)
    ) {
        return false;
    }

    return (
        /\bhow\s+many\b/.test(text) ||
        /\b(show|list|find|display)\b/.test(text) ||
        /\b(do|does)\s+(i|we)\s+have\b/.test(text) ||
        /\b(what|which)\s+(s3\s+)?buckets\b/.test(text) ||
        /\b(my|our)\s+(s3\s+)?buckets\b/.test(text) ||
        /\b(my|our)\s+s3\b/.test(text)
    );
}

//Function A2: Select how CloudPilot searches the message for S3 inventory Question
async function searchForS3Inventory(message) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunS3InventorySearch(userMessage)) {
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: One operation context (Internal-only MVP)
    const s3InventorySearchContext = getS3InventorySearchContext(message);
    const result = searchForS3InventoryInternal(s3InventorySearchContext);

    SearchLogs.recordSearch({
        name: 'S3 Inventory',
        method: 'Internal',
        result: result.question || null
    });

    return result;
}

//Function A3: Internal — receives S3InventorySearchContext
function searchForS3InventoryInternal(context) {
    const text = String(context && context.userMessage ? context.userMessage : '')
        .toLowerCase()
        .trim();

    if (!text || isExplicitScanCommand(text)) {
        return {};
    }

    if (typeof actionMap.matchesGetS3InventoryIntent === 'function') {
        if (actionMap.matchesGetS3InventoryIntent(text)) {
            return { question: 's3_inventory' };
        }
    }

    return {};
}

module.exports = {
    shouldRunS3InventorySearch,
    searchForS3Inventory,
    searchForS3InventoryInternal
};
