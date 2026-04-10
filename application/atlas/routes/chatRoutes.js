const express = require('express')
const chatRouter = express.Router();
const chat = require('../logic/chat')

/*
FUNCTIONS A: All Routes Related to Chat
	1) Function A1: POST /chat/ — optional JSON body; intent → guardrails → action (deterministic)

*/

//FUNCTIONS A: Chat
//Route A1: POST /chat/
chatRouter.post('/', function (req, res) {
	chat.postChat(req, res);
})

module.exports = chatRouter
