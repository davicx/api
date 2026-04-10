/*
FUNCTIONS A: Detect Intent
FUNCTIONS B: Guardrails
FUNCTIONS C: Build Action Object
*/

// FUNCTIONS A: Detect Intent
function detectIntent(text) {
	const t = String(text || '').toLowerCase()

	if (t.includes('scan') && t.includes('ec2')) {
		return 'scan_ec2'
	}

	if (t.includes('toggle') || t.includes('switch')) {
		return 'toggle_ec2'
	}

	return 'unknown'
}

// FUNCTIONS B: Guardrails
function checkGuardrails(intent) {
	const allowed = ['scan_ec2', 'toggle_ec2']

	if (!allowed.includes(intent)) {
		return {
			allowed: false,
			message: 'I can only help with EC2 right now.',
		}
	}

	return { allowed: true }
}

// FUNCTIONS C: Build Action Object
function buildAction(intent, guardrailResult) {
	if (!guardrailResult.allowed) {
		return {
			type: 'none',
			allowed: false,
			message: guardrailResult.message,
		}
	}

	if (intent === 'scan_ec2') {
		return {
			type: 'scan_ec2',
			allowed: true,
			requiresExecution: false,
			message: 'Scanning EC2 now.',
		}
	}

	if (intent === 'toggle_ec2') {
		return {
			type: 'toggle_ec2',
			allowed: true,
			requiresExecution: false,
			message: 'Switching instances.',
		}
	}

	return {
		type: 'none',
		allowed: false,
		message: 'Unknown request.',
	}
}

module.exports = {
	detectIntent,
	checkGuardrails,
	buildAction,
}
