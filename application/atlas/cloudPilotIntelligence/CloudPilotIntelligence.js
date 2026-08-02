/*
CloudPilot Intelligence Facade

CloudPilot depends on this module for AI-assisted thinking work.
CloudPilotIntelligence decides Internal vs OpenAI based on configuration.

Project B Phase 1: facade skeleton only.
Understand methods are wired in Phase 2 (migrate chat/understand/).
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

//Function A1: Understand full user message (wired in Phase 2)
async function understandMessage(message) {
    //STEP 1: Not wired yet — migrate cloudPilot/chat/understand in Phase 2
    throw new Error(
        'CloudPilotIntelligence.understandMessage is not wired yet (Project B Phase 2).'
    );
}

//Function A2: Understand region from message (wired in Phase 2)
async function understandRegion(message) {
    //STEP 1: Not wired yet — migrate region search in Phase 2
    throw new Error(
        'CloudPilotIntelligence.understandRegion is not wired yet (Project B Phase 2).'
    );
}

//Function A3: Understand action from message (wired in Phase 2)
async function understandAction(message) {
    //STEP 1: Not wired yet — migrate action search in Phase 2
    throw new Error(
        'CloudPilotIntelligence.understandAction is not wired yet (Project B Phase 2).'
    );
}

//Function A4: Understand resource signals from message (wired in Phase 2)
async function understandResource(message) {
    //STEP 1: Not wired yet — migrate resource extractors in Phase 2
    throw new Error(
        'CloudPilotIntelligence.understandResource is not wired yet (Project B Phase 2).'
    );
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
