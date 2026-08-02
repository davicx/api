/*
CloudPilot Intelligence Facade

CloudPilot depends on this module for AI-assisted thinking work.
CloudPilotIntelligence decides Internal vs OpenAI based on configuration.

Project B Phase 2: understand methods wired to migrated chat/understand code.
Respond / explain / improve / generate stay placeholders until later projects.

FUNCTIONS A: Understand
    1) Function A1: understandMessage
    2) Function A2: understandRegion
    3) Function A3: understandAction
    4) Function A4: understandResource

FUNCTIONS B: Respond (placeholder)
    1) Function B1: respond

FUNCTIONS C: Explain (placeholder)
    1) Function C1: explain

FUNCTIONS D: Improve (placeholder)
    1) Function D1: improve

FUNCTIONS E: Generate (placeholder)
    1) Function E1: generate
*/

const UnderstandMessageFunctions = require('./understand/understandMessage');
const SearchMessageForRegionFunctions = require('./understand/search/searchMessageForRegion');
const SearchMessageForActionFunctions = require('./understand/search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./understand/search/searchMessageForValues');

//Function A1: Understand full user message
async function understandMessage(message) {
    //STEP 1: Delegate to understand orchestrator (Internal/OpenAI decided inside extractors)
    return UnderstandMessageFunctions.understandMessage(message);
}

//Function A2: Understand region from message
async function understandRegion(message) {
    //STEP 1: Delegate to region search (Internal vs OpenAI via CLOUDPILOT_AI_CONFIG)
    return SearchMessageForRegionFunctions.searchMessageForRegion(message);
}

//Function A3: Understand action from message
async function understandAction(message) {
    //STEP 1: Delegate to action search (rules / actionMap)
    return SearchMessageForActionFunctions.searchMessageForAction(message);
}

//Function A4: Understand resource / field signals from message
async function understandResource(message) {
    //STEP 1: Delegate to values extractors (region, ids, name, tags, structured fields)
    return SearchMessageForValuesFunctions.searchMessageForValues(message);
}

//Function B1: Respond — placeholder until a later project
async function respond(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.respond is not implemented yet.');
}

//Function C1: Explain — placeholder until a later project
async function explain(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.explain is not implemented yet.');
}

//Function D1: Improve — placeholder until a later project
async function improve(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.improve is not implemented yet.');
}

//Function E1: Generate — placeholder until a later project
async function generate(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.generate is not implemented yet.');
}

module.exports = {
    understandMessage,
    understandRegion,
    understandAction,
    understandResource,
    respond,
    explain,
    improve,
    generate
};
