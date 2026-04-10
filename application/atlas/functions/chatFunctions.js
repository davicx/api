/*
FUNCTIONS A: Detect Intent
FUNCTIONS B: Guardrails
FUNCTIONS C: Build Action Object
*/

// FUNCTIONS A: Detect Intent
function detectIntent(text) {
	const raw = String(text || '')
	const t = raw.toLowerCase()
	console.log('detectIntent: ' + raw)

	if (t.includes('scan') && t.includes('ec2')) {
		console.log('detectIntent: result scan_ec2')
		return 'scan_ec2'
	}

	if (t.includes('toggle') || t.includes('switch')) {
		console.log('detectIntent: result toggle_ec2')
		return 'toggle_ec2'
	}

	console.log('detectIntent: result unknown')
	return 'unknown'
}

// FUNCTIONS B: Guardrails
function checkGuardrails(intent) {
	console.log('checkGuardrails: ' + intent)
	const allowed = ['scan_ec2', 'toggle_ec2']

	if (!allowed.includes(intent)) {
		console.log('checkGuardrails: blocked')
		return {
			allowed: false,
			message: 'I can only help with EC2 right now.',
		}
	}

	console.log('checkGuardrails: allowed')
	return { allowed: true }
}

// FUNCTIONS C: Build Action Object
function buildAction(intent, guardrailResult) {
	console.log('buildAction: ' + intent + ' allowed=' + !!guardrailResult.allowed)
	if (!guardrailResult.allowed) {
		const action = {
			type: 'none',
			allowed: false,
			message: guardrailResult.message,
		}
		console.log('buildAction: type none (guardrail)')
		return action
	}

	if (intent === 'scan_ec2') {
		console.log('buildAction: type scan_ec2')
		return {
			type: 'scan_ec2',
			allowed: true,
			requiresExecution: false,
			message: 'Scanning EC2 now.',
		}
	}

	if (intent === 'toggle_ec2') {
		console.log('buildAction: type toggle_ec2')
		return {
			type: 'toggle_ec2',
			allowed: true,
			requiresExecution: false,
			message: 'Switching instances.',
		}
	}

	console.log('buildAction: type none (fallback)')
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
