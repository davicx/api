const express = require('express');
const openAIRouter = express.Router();
const { postOpenAIChat } = require('./openAIChatLogic');

/*
TEMP OpenAI lab routes — isolated from CloudPilot message pipeline.

FUNCTIONS A:
    1) POST /openai/chat — optional system prompt + user text → OpenAI
*/

openAIRouter.post('/openai/chat', function (req, res) {
    postOpenAIChat(req, res);
});

module.exports = openAIRouter;
