/*
CloudPilot Intelligence Facade

CloudPilotMessage is the product's voice. CloudPilotIntelligence is the product's brain.
This file is the only front door for GenAI.

CloudPilotIntelligence decides Internal vs OpenAI based on configuration.

See: doc/development/finished/feature_intelligence_front_door.md

FUNCTIONS A: Conversation
    1) Function A1: chat

FUNCTIONS B: Understand (Gather Context)
    1) Function B1: understandMessage
    2) Function B2: understandRegion
    3) Function B3: understandAction
    4) Function B4: understandResource

FUNCTIONS C: Explain (placeholder)
    1) Function C1: explain

FUNCTIONS D: Improve (placeholder)
    1) Function D1: improve

FUNCTIONS E: Generate (placeholder)
    1) Function E1: generate

Note: Legacy respond() kept as a placeholder export until callers are gone.
*/

const ConversationChatFunctions = require('./conversation/chat');
const UnderstandMessageFunctions = require('./understand/understandMessage');
const SearchMessageForRegionFunctions = require('./understand/search/searchMessageForRegion');
const SearchMessageForActionFunctions = require('./understand/search/searchMessageForAction');
const SearchMessageForValuesFunctions = require('./understand/search/searchMessageForValues');

//FUNCTIONS A: Conversation
//Function A1: GenAI conversation front door
async function chat(processMessageContext) {
    //STEP 1: Delegate to conversation chat implementation
    return ConversationChatFunctions.chat(processMessageContext);
}

//FUNCTIONS B: Understand (Gather Context)
//Function B1: Understand full user message
async function understandMessage(message, requestState) {
    //STEP 1: Delegate to understand orchestrator (Internal/OpenAI decided inside extractors)
    return UnderstandMessageFunctions.understandMessage(message, requestState);
}

//Function B2: Understand region from message
async function understandRegion(message, requestState) {
    //STEP 1: Delegate to region search (shouldRun + Internal vs OpenAI)
    return SearchMessageForRegionFunctions.searchMessageForRegion(message, requestState);
}

//Function B3: Understand action from message
async function understandAction(message) {
    //STEP 1: Delegate to action search (rules / actionMap)
    return SearchMessageForActionFunctions.searchMessageForAction(message);
}

//Function B4: Understand resource / field signals from message
async function understandResource(message, requestState) {
    //STEP 1: Delegate to values extractors (region, ids, name, tags, structured fields)
    return SearchMessageForValuesFunctions.searchMessageForValues(message, requestState);
}

//FUNCTIONS C: Explain
//Function C1: Explain — placeholder until a later project
async function explain(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.explain is not implemented yet.');
}

//FUNCTIONS D: Improve
//Function D1: Improve — placeholder until a later project
async function improve(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.improve is not implemented yet.');
}

//FUNCTIONS E: Generate
//Function E1: Generate — placeholder until a later project
async function generate(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.generate is not implemented yet.');
}

//Legacy placeholder — prefer chat() for GenAI conversation
async function respond(context) {
    //STEP 1: Placeholder only
    throw new Error('CloudPilotIntelligence.respond is not implemented yet.');
}

module.exports = {
    chat,
    understandMessage,
    understandRegion,
    understandAction,
    understandResource,
    explain,
    improve,
    generate,
    respond
};
