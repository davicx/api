const actionMap = require('../../../../cloudPilot/masterCloudPilotCapabilities');
const SearchLogs = require('../helpers/searchLogs');
const {
    getEc2InventorySearchContext
} = require('../../../context/operationContext/getEc2InventorySearchContext');

/*
FUNCTIONS A: EC2 inventory Question search
    1) Function A1: shouldRunEc2InventorySearch
    2) Function A2: searchForEc2Inventory
    3) Function A3: searchForEc2InventoryInternal

HELPERS
    1) Helper H1: isExplicitScanCommand

ONE operation context → Internal (MVP has no OpenAI path yet).
Same Search TASK shape as Region / Action / Questions.
Returns { question: 'ec2_inventory' } or {}.
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

    //STEP 2: One operation context (Internal-only MVP)
    const ec2InventorySearchContext = getEc2InventorySearchContext(message);
    const result = searchForEc2InventoryInternal(ec2InventorySearchContext);

    SearchLogs.recordSearch({
        name: 'EC2 Inventory',
        method: 'Internal',
        result: result.question || null
    });

    return result;
}

//Function A3: Internal — receives Ec2InventorySearchContext
function searchForEc2InventoryInternal(context) {
    const text = String(context && context.userMessage ? context.userMessage : '')
        .toLowerCase()
        .trim();

    if (!text || isExplicitScanCommand(text)) {
        return {};
    }

    if (typeof actionMap.matchesGetEc2InventoryIntent === 'function') {
        if (actionMap.matchesGetEc2InventoryIntent(text)) {
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
