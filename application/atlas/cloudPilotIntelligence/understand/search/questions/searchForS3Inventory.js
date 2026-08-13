const actionMap = require('../../../../cloudPilot/actionMap');
const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: S3 inventory Question search
    1) Function A1: shouldRunS3InventorySearch
    2) Function A2: searchForS3Inventory
    3) Function A3: searchForS3InventoryInternal

HELPERS
    1) Helper H1: isExplicitScanCommand

Public entry — shouldRun + Internal classify only (MVP).
Returns { question: 's3_inventory' } or {}.

Semantic distinction (feature_s3_inventory_ask):
  "scan s3"                     → Action scan_s3 (operation)
  "what S3 buckets do I have?"  → Question s3_inventory (needs AWS truth)

Fulfillment reuses scan_s3 / Atlas plumbing — CloudPilot owns facts.
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

    // General knowledge stays General Chat
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

    //STEP 2: Internal classify only (MVP — no OpenAI smoke / optional later)
    const result = searchForS3InventoryInternal(userMessage);

    SearchLogs.recordSearch({
        name: 'S3 Inventory',
        method: 'Internal',
        result: result.question || null
    });

    return result;
}

//Function A3: Inventory-style S3 data question (not explicit scan, not "what is S3")
function searchForS3InventoryInternal(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text || isExplicitScanCommand(text)) {
        return {};
    }

    if (typeof actionMap.matchesScanS3Intent === 'function') {
        if (actionMap.matchesScanS3Intent(text)) {
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
