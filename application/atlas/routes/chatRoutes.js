const express = require('express');
const OpenAI = require('openai');
const chatRouter = express.Router();

/*
FUNCTIONS A: Chat (files under application/atlas/routes for organization only)
	1) Function A1: POST /chat/ — optional JSON body; ChatGPT reply capped at three words

Billing: OpenAI charges per token (input + output). This route keeps both small:
	short prompts, max_tokens low, and threeWordsMax() so you never ship a long reply.
	Set a monthly $ cap in the OpenAI dashboard (Billing → Limits) as a backstop.
*/

// Cap how much the client can send in "body" so one request cannot paste a huge string (input tokens $).
const MAX_GREETING_BODY_CHARS = 300;
// Output token ceiling — three English words are usually well under this; keeps bill predictable.
const MAX_OUTPUT_TOKENS = 12;

function threeWordsMax(text) {
	const s = String(text).trim();
	const parts = s.split(/\s+/);
	const kept = [];
	let i = 0;
	while (i < parts.length) {
		const word = parts[i];
		if (word.length > 0) {
			kept.push(word);
		}
		if (kept.length === 3) {
			break;
		}
		i = i + 1;
	}
	return kept.join(' ');
}

// Route A1: POST /chat/ — body optional: { "body": "your greeting" }; needs OPENAI_API_KEY in api/.env
chatRouter.post('/', async function (req, res) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey || String(apiKey).trim().length === 0) {
		res.status(500).json({
			success: false,
			message: 'Missing OPENAI_API_KEY in api — add your key from platform.openai.com/api-keys',
		});
		return;
	}

	let raw = '';
	if (req.body && req.body.body !== undefined && req.body.body !== null) {
		raw = String(req.body.body).trim();
	}
	if (raw.length > MAX_GREETING_BODY_CHARS) {
		raw = raw.substring(0, MAX_GREETING_BODY_CHARS);
	}

	let userMessage = '';
	if (raw.length > 0) {
		userMessage = 'The user sent this greeting: ' + raw + '. Reply in at most three words.';
	} else {
		userMessage = 'Say a short friendly hello in at most three words.';
	}

	const client = new OpenAI({ apiKey: apiKey });

	let replyText = '';
	try {
		const completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content: 'Reply with at most three words only.',
				},
				{ role: 'user', content: userMessage },
			],
			max_tokens: MAX_OUTPUT_TOKENS,
			temperature: 0.3,
		});
		const content = completion.choices[0].message.content;
		if (content) {
			replyText = threeWordsMax(content);
		} else {
			replyText = '';
		}
	} catch (err) {
		res.status(502).json({
			success: false,
			message: 'OpenAI request failed: ' + String(err.message),
		});
		return;
	}

	res.json({
		success: true,
		message: replyText,
	});
});

module.exports = chatRouter;
