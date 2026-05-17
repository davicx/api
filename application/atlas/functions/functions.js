/*
FUNCTIONS A: AWS Helper Functions 
	1) Function A1: Extract AWS region from user text
	2) Function A2: Extract EC2 instance type from user text
	3) Function A3: Extract instance name from user text (MVP phrases)
	4) Function A4: fieldExtractors map (field name → extractor)
	5) Function A5: Extract structured workflow fields from user message
	6) Function A6: Determine request readiness
	7) Function A7: Determine workflow event

*/

//FUNCTIONS A: AWS Helper Functions
//Function A1: Extract AWS region from user text
function extractAwsRegion(userText) {
    const s = String(userText || '');
    const match = s.match(/\b((?:us|eu|ap|sa|ca|me|af)-(?:gov-)?[a-z]+-\d)\b/i);
    if (!match) {
        return null;
    }
    return String(match[1]).toLowerCase();
}

//Function A2: Extract EC2 instance type from user text
function extractInstanceType(text) {
    const match = text.match(/\b(t2|t3|m5|c5)\.(micro|small|medium|large)\b/i);
    if (!match) {
        return null;
    }
    return String(match[0]).toLowerCase();
}

//Function A3: Extract instance name from user text (MVP phrases)
function extractName(text) {
    const s = String(text || '');
    let match = s.match(/\bname\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    match = s.match(/\bcall\s+it\s+([a-z0-9][a-z0-9._-]*)\b/i);
    if (match) {
        return String(match[1]).trim();
    }
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    if (/^(hello|hi|hey|thanks|thank you|yes|no|ok)\s*$/i.test(lower)) {
        return null;
    }
    const afterLeadIn = trimmed.replace(/^(ok|yes|sure|thanks)[,.\s]+/i, '').trim();
    const candidate = afterLeadIn.length ? afterLeadIn : trimmed;
    if (/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(candidate) && (candidate.includes('-') || candidate.includes('_') || candidate.includes('.'))) {
        return candidate;
    }
    return null;
}

//Function A4: fieldExtractors map (field name → extractor)
const fieldExtractors = {
    region: extractAwsRegion,
    instance_type: extractInstanceType,
    name: extractName
};

//Function A5: Extract structured workflow fields from user message
function extractStructuredFields(message) {
    const extractedFields = {};
    const text = String(message || '');
    const regex = /(\w+)\s*:\s*"([^"]+)"/g;

    let match;

    while ((match = regex.exec(text)) !== null) {
        const missingFieldName = match[1];
        const structuredFieldValue = match[2];

        // Last duplicate match wins
        extractedFields[missingFieldName] = structuredFieldValue;
    }

    return extractedFields;
}

//Function A6: Determine request readiness
function determineRequestReadiness(activeRequestedAction, currentStateData) {

    // No active request exists
    if (!activeRequestedAction) {
        console.log("STEP 6A: No active request");
        return false;
    }

    // Request still missing fields
    if (currentStateData.missing.length > 0) {
        console.log("STEP 6B: Request still missing fields");
        return false;
    }

    // Request already completed
    if (currentStateData.status === "completed") {
        console.log("STEP 6C: Request already completed");
        return false;
    }

    // Request already failed
    if (currentStateData.status === "failed") {
        console.log("STEP 6D: Request already failed");
        return false;
    }

    console.log("STEP 6E: Request is READY");

    return true;
}

//Function A7: Determine workflow event
function determineActionEvent(actionEventData) {

    if (actionEventData.actionTransitionedToReady) {
        return "awaiting_confirmation";
    }

    if (actionEventData.newActionStarted) {
        return "new_action";
    }

    if (actionEventData.fieldsUpdated) {
        return "missing_fields_given";
    }

    return null;
}

function userConfirmedAction(userMessage) {
    const normalizedMessage = String(userMessage || '').toLowerCase().trim().replace(/[.!?]+$/g, '');
    const confirmationMessages = [
        "yes",
        "confirm",
        "run it",
        "do it",
        "proceed",
        "execute"
    ];

    return confirmationMessages.includes(normalizedMessage);
}

function shouldStartExecution(executionDecisionData) {
    return Boolean(
        executionDecisionData.activeAction &&
        executionDecisionData.actionState &&
        executionDecisionData.actionState.status === "ready" &&
        userConfirmedAction(executionDecisionData.currentUserMessage)
    );
}

fieldExtractors.extractStructuredFields = extractStructuredFields;
fieldExtractors.determineRequestReadiness = determineRequestReadiness;
fieldExtractors.determineActionEvent = determineActionEvent;
fieldExtractors.userConfirmedAction = userConfirmedAction;
fieldExtractors.shouldStartExecution = shouldStartExecution;

module.exports = fieldExtractors;
