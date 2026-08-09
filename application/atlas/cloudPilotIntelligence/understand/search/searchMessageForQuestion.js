const SearchForAiSpendFunctions = require('./questions/searchForAiSpend');
const SearchForOpenRequestsFunctions = require('./questions/searchForOpenRequests');
const SearchForEc2InventoryFunctions = require('./questions/searchForEc2Inventory');
const SearchLogs = require('./helpers/searchLogs');

/*
FUNCTIONS A: Question detection from user message
    1) Function A1: searchMessageForQuestion

Questions ask CloudPilot about known information (not Actions, not Values).
Returns one question id string or null.

Family: open_requests, ai_spend, ec2_inventory (Step E — grounded AWS data).
*/

//Function A1: Find the Question the user is asking (if any)
async function searchMessageForQuestion(message) {
    //STEP 1: Open requests Question
    const openRequestsHit = await SearchForOpenRequestsFunctions.searchForOpenRequests(
        message
    );

    if (openRequestsHit && openRequestsHit.question === 'open_requests') {
        // Later question searches are not evaluated once one Question wins
        SearchLogs.recordSearch({
            name: 'AI Spend',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'open_requests';
    }

    //STEP 2: AI spend Question
    const aiSpendHit = await SearchForAiSpendFunctions.searchForAiSpend(message);

    if (aiSpendHit && aiSpendHit.question === 'ai_spend') {
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ai_spend';
    }

    // Legacy shape from before Question migration
    if (aiSpendHit && aiSpendHit.ai_spend === true) {
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ai_spend';
    }

    //STEP 3: EC2 inventory Question (needs Atlas truth — not General Chat)
    const ec2InventoryHit = await SearchForEc2InventoryFunctions.searchForEc2Inventory(
        message
    );

    if (ec2InventoryHit && ec2InventoryHit.question === 'ec2_inventory') {
        return 'ec2_inventory';
    }

    return null;
}

module.exports = { searchMessageForQuestion };
