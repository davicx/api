const actionMap = require('../../../../cloudPilot/actionMap');
const SearchLogs = require('../helpers/searchLogs');

/*
FUNCTIONS A: EC2 inventory Question search
    1) Function A1: shouldRunEc2InventorySearch
    2) Function A2: searchForEc2Inventory
    3) Function A3: searchForEc2InventoryInternal

HELPERS
    1) Helper H1: isExplicitScanCommand

Public entry — shouldRun + Internal classify only (MVP).
Returns { question: 'ec2_inventory' } or {}.

Semantic distinction (feature_cloud_pilot_context Step E):
  "scan my EC2"              → Action scan_ec2 (operation)
  "how many EC2 are running?" → Question ec2_inventory (needs AWS truth)

Fulfillment reuses scan_ec2 / Atlas plumbing — CloudPilot owns facts.
*/

//HELPERS
//Helper H1: Explicit scan stays on Action Search — not this Question
function isExplicitScanCommand(message) {
    return /\bscan\b/.test(String(message || '').toLowerCase());
}

//FUNCTIONS A: EC2 inventory Question search
//Function A1: Cheap gate — skip unrelated messages
function shouldRunEc2InventorySearch(message) {
    const text = String(message || '').toLowerCase();

    if (!text.trim()) {
        return false;
    }

    if (!/\bec2\b/.test(text)) {
        return false;
    }

    if (isExplicitScanCommand(text)) {
        return false;
    }

    // General knowledge stays General Chat
    if (/\bwhat\s+is\s+(an?\s+)?ec2\b/.test(text)) {
        return false;
    }

    return (
        /\bhow\s+many\b/.test(text) ||
        /\b(show|list|find|display)\b/.test(text) ||
        /\b(do|does)\s+(i|we)\s+have\b/.test(text) ||
        /\b(running|stopped|pending|terminated|active)\b/.test(text) ||
        /\b(what|which)\s+ec2\b/.test(text) ||
        /\b(my|our)\s+ec2\b/.test(text)
    );
}

//Function A2: Select how CloudPilot searches the message for EC2 inventory Question
async function searchForEc2Inventory(message) {
    const userMessage = String(message || '');

    //STEP 1: Should I run?
    if (!shouldRunEc2InventorySearch(userMessage)) {
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        return {};
    }

    //STEP 2: Internal classify only (MVP — no OpenAI smoke / optional later)
    const result = searchForEc2InventoryInternal(userMessage);

    SearchLogs.recordSearch({
        name: 'EC2 Inventory',
        method: 'Internal',
        result: result.question || null
    });

    return result;
}

//Function A3: Inventory-style EC2 data question (not explicit scan, not "what is EC2")
function searchForEc2InventoryInternal(message) {
    const text = String(message || '').toLowerCase().trim();

    if (!text || isExplicitScanCommand(text)) {
        return {};
    }

    // Reuse Be Cool Man EC2-data matcher; exclude operation "scan"
    if (typeof actionMap.matchesScanEC2Intent === 'function') {
        if (actionMap.matchesScanEC2Intent(text)) {
            return { question: 'ec2_inventory' };
        }
    }

    return {};
}

module.exports = {
    shouldRunEc2InventorySearch,
    searchForEc2Inventory,
    searchForEc2InventoryInternal
};
