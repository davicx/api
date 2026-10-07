const SearchForAiSpendFunctions = require('./questions/searchForAiSpend');
const SearchForOpenRequestsFunctions = require('./questions/searchForOpenRequests');
const SearchForEc2InventoryFunctions = require('./questions/searchForEc2Inventory');
const SearchForS3InventoryFunctions = require('./questions/searchForS3Inventory');
const SearchForEc2ComputeCostFunctions = require('./questions/searchForEc2ComputeCost');
const SearchLogs = require('./helpers/searchLogs');

/*
FUNCTIONS A: Question detection from user message
    1) Function A1: searchMessageForQuestion

Questions ask CloudPilot about known information (not Actions, not Values).
Returns one question id string or null.

Family: open_requests, ai_spend, ec2_compute_cost, ec2_inventory, s3_inventory (grounded AWS data).
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
            name: 'EC2 Compute Cost',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'open_requests';
    }

    //STEP 2: AI spend Question
    const aiSpendHit = await SearchForAiSpendFunctions.searchForAiSpend(message);

    if (aiSpendHit && aiSpendHit.question === 'ai_spend') {
        SearchLogs.recordSearch({
            name: 'EC2 Compute Cost',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ai_spend';
    }

    // Legacy shape from before Question migration
    if (aiSpendHit && aiSpendHit.ai_spend === true) {
        SearchLogs.recordSearch({
            name: 'EC2 Compute Cost',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ai_spend';
    }

    //STEP 3: EC2 compute cost Question (stored rates — not General Chat)
    const ec2ComputeCostHit =
        await SearchForEc2ComputeCostFunctions.searchForEc2ComputeCost(message);

    if (ec2ComputeCostHit && ec2ComputeCostHit.question === 'ec2_compute_cost') {
        SearchLogs.recordSearch({
            name: 'EC2 Inventory',
            method: 'Skipped',
            result: null
        });
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ec2_compute_cost';
    }

    //STEP 4: EC2 inventory Question (needs Atlas truth — not General Chat)
    const ec2InventoryHit = await SearchForEc2InventoryFunctions.searchForEc2Inventory(
        message
    );

    if (ec2InventoryHit && ec2InventoryHit.question === 'ec2_inventory') {
        SearchLogs.recordSearch({
            name: 'S3 Inventory',
            method: 'Skipped',
            result: null
        });
        return 'ec2_inventory';
    }

    //STEP 5: S3 inventory Question (needs Atlas truth — not General Chat)
    const s3InventoryHit = await SearchForS3InventoryFunctions.searchForS3Inventory(
        message
    );

    if (s3InventoryHit && s3InventoryHit.question === 's3_inventory') {
        return 's3_inventory';
    }

    return null;
}

module.exports = { searchMessageForQuestion };
