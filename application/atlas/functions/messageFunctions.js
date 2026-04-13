/*
FUNCTIONS A: Detect Intent
FUNCTIONS B: Guardrails
FUNCTIONS C: Build Action Object
*/

//Example Intent
/*
{
  "intent": "scan_ec2",
  "params": {
    "scan_type": "team",
    "region": "us-west-2",
    "team": "cloud-pilot",
    "rules": ["ec2_low_cpu"]
  }
}

{
  "intent": "scan_ec2",
  "status": "ready" | "incomplete",
  "params": {
    "scan_type": "full" | "instance" | "team" | "region",
    "region": "us-west-2",
    "team": "cloud-pilot",
    "instance_id": null,
    "rules": ["ec2_low_cpu"]
  },
  "missing": ["region", "rules"]
}
*/

// FUNCTIONS A: Detect Intent
function detectIntent(userMessage) {
    const originalMessage = String(userMessage || "");
    const normalizedMessage = originalMessage.toLowerCase();

    console.log("detectIntent: Received message -> " + originalMessage);
    console.log("detectIntent: Normalized message -> " + normalizedMessage);

    if (normalizedMessage.includes("scan") && normalizedMessage.includes("ec2")) {
        console.log("detectIntent: result scan_ec2");
        return "scan_ec2";
    }

    if (normalizedMessage.includes("toggle") || normalizedMessage.includes("switch")) {
        console.log("detectIntent: result toggle_ec2");
        return "toggle_ec2";
    }

    console.log("detectIntent: result unknown");
    return "unknown";
}

// FUNCTIONS B: Guardrails
function checkGuardrails(intent) {
    console.log("checkGuardrails: Checking if intent is allowed -> " + intent);

    if (intent === "unknown") {
        console.log("checkGuardrails: allowed (general chat)");
        return { allowed: true };
    }

    const allowedIntents = ["scan_ec2", "toggle_ec2"];

    if (!allowedIntents.includes(intent)) {
        console.log("checkGuardrails: blocked");
        return {
            allowed: false,
            message: "I can only help with EC2 right now.",
        };
    }

    console.log("checkGuardrails: allowed");
    return { allowed: true };
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
			message: 'Preparing EC2 scan.',
		}
	}

	if (intent === 'toggle_ec2') {
		console.log('buildAction: type toggle_ec2')
		return {
			type: 'toggle_ec2',
			allowed: true,
			requiresExecution: false,
			message: 'Confirm before changing EC2 instances.',
		}
	}

	if (intent === 'unknown') {
		console.log('buildAction: type none (general chat)')
		return {
			type: 'none',
			allowed: true,
			requiresExecution: false,
			message: '',
		}
	}

	console.log('buildAction: type none (fallback)')
	return {
		type: 'none',
		allowed: false,
		message: 'Unknown request.',
	}
}

/** Same as checkGuardrails — name matches orchestration code in messages.js */
function checkIntentPolicy(intent) {
	return checkGuardrails(intent);
}

module.exports = {
	detectIntent,
	checkGuardrails,
	checkIntentPolicy,
	buildAction,
}


/*
You are an intent classifier for CloudPilot.

Return ONLY a JSON object in this exact format:

{
  "intent": "scan_ec2" | "toggle_ec2" | "unknown"
}

User message:
"<user message>"

const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini", // or whatever you prefer
  messages: [
    {
      role: "system",
      content: "You are an intent classifier for CloudPilot. Return only JSON."
    },
    {
      role: "user",
      content: userMessage
    }
  ]
});

const result = JSON.parse(completion.choices[0].message.content);
const intent = result.intent;

*/