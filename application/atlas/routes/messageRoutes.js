const express = require('express');
const messageRouter = express.Router();
const messages = require('../logic/messages');
const middlewares = require('../../functions/middlewareFunctions');

/*
FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
    1) Function B1: Post Message — intent → guardrails → action → ChatGPT (no Atlas execution)
    2) Function B2: Delete Message
    3) Function B3: Edit Message
    4) Function A1: Say Hello — OpenAI smoke test

FUNCTIONS C: All Functions Related to getting Messages
    1) Function C1: Get all Group Messages
    2) Function C2: Get all Conversation Messages
*/

//FUNCTIONS A: All Functions Related to Messages with an API (ChatGPT API right now)
//Route B1: Post Message
/* 
Still need
policy: {
    allowed: false, //NOT DONE
    message: null, //NOT DONE
    reasonNotAllowed: null // e.g. "OUT_OF_SCOPE", "DESTRUCTIVE_ACTION" //NOT DONE
},
*/
messageRouter.post('/message', function (req, res) {
    messages.postMessage(req, res);
});

//Route B2: Delete Message
messageRouter.post('/message/delete', function (req, res) {
    messages.deleteMessage(req, res);
});

//Route B3: Edit Message
messageRouter.post('/message/edit', function (req, res) {
    messages.editMessage(req, res);
});

//Route A1: Say Hello — POST /message/hello
messageRouter.post('/message/hello', function (req, res) {
    messages.postMessageHello(req, res);
});

//FUNCTIONS C: All Functions Related to getting Messages
//Route C1: Get all Group Messages
messageRouter.get('/messages/group/:group_id', middlewares.verifyUser, (req, res) => {
    messages.getGroupMessages(req, res);
});

//Route C2: Get all Conversation Messages
messageRouter.get('/messages/conversation/:conversation_id', middlewares.verifyUser, (req, res) => {
    messages.getConversationMessages(req, res);
});

module.exports = messageRouter;
