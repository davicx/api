const {
	detectIntent,
	checkGuardrails,
	buildAction,
} = require('../functions/chatFunctions')

/*
FUNCTIONS A: All Functions Related to Chat
	1) Function A1: handleChat — intent → guardrails → action (deterministic; no OpenAI / Python yet)
	2) Function A2: postChat — HTTP: read body, run handleChat, respond

Flow: User message → detect intent → guardrails → build action → (later: execute)
*/

const MAX_GREETING_BODY_CHARS = 300

// Function A1: Main orchestrator (brain)
async function handleChat(userInput) {
	console.log('STEP 1: Detect intent')
	const intent = detectIntent(userInput)

	console.log('STEP 2: Check guardrails')
	const guard = checkGuardrails(intent)

	console.log('STEP 3: Build action')
	const action = buildAction(intent, guard)

	console.log('ACTION RESULT:', action)

	// STEP 4: (later) execute action via Python / internal APIs

	return action
}

// Function A2: POST /chat/
async function postChat(req, res) {
	var headerMessage = 'NEW CHAT: postChat'
	console.log(headerMessage)

	var chatOutcome = {
		success: false,
		message: '',
	}

	// STEP 1: Read and cap body from request
	console.log('STEP 1: Read body from request')
	let raw = ''
	if (req.body && req.body.body !== undefined && req.body.body !== null) {
		raw = String(req.body.body).trim()
	}
	if (raw.length > MAX_GREETING_BODY_CHARS) {
		raw = raw.substring(0, MAX_GREETING_BODY_CHARS)
	}

	// STEP 2: Run orchestrator
	console.log('STEP 2: handleChat')
	const action = await handleChat(raw)

	// STEP 3: Map action to HTTP outcome
	console.log('STEP 3: Send chat outcome')
	chatOutcome.success = action.allowed === true
	chatOutcome.message = action.message
	if (action.type) {
		chatOutcome.actionType = action.type
	}

	console.log(chatOutcome)
	console.log('____________________________')

	res.json(chatOutcome)
}

module.exports = { postChat, handleChat }
