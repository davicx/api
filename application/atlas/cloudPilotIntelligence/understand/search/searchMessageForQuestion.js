const SearchForAiSpendFunctions = require('./questions/searchForAiSpend');
const SearchForOpenRequestsFunctions = require('./questions/searchForOpenRequests');
const SearchLogs = require('./helpers/searchLogs');

/*
FUNCTIONS A: Question detection from user message
    1) Function A1: searchMessageForQuestion

Questions ask CloudPilot about known information (not Actions, not Values).
Returns one question id string or null.
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
        return 'open_requests';
    }

    //STEP 2: AI spend Question
    const aiSpendHit = await SearchForAiSpendFunctions.searchForAiSpend(message);

    if (aiSpendHit && aiSpendHit.question === 'ai_spend') {
        return 'ai_spend';
    }

    // Legacy shape from before Question migration
    if (aiSpendHit && aiSpendHit.ai_spend === true) {
        return 'ai_spend';
    }

    return null;
}

module.exports = { searchMessageForQuestion };
