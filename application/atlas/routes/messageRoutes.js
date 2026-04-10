const express = require('express');
const messageRouter = express.Router();
const messages = require('../logic/messages');
const middlewares = require('../../functions/middlewareFunctions');

/*
FUNCTIONS A: All Routes Related to Messages
    1) Route A1: Post Message
    2) Route A2: Delete Message
    3) Route A3: Edit Message

FUNCTIONS B: All Routes Related to getting Messages
    1) Route B1: Get all Group Messages
    2) Route B2: Get all Conversation Messages
*/

//FUNCTIONS A: Create / Update / Delete
//Route A1: Post Message
messageRouter.post('/message', function (req, res) {
    messages.postMessage(req, res);
});

//Route A2: Delete Message
messageRouter.post('/message/delete', function (req, res) {
    messages.deleteMessage(req, res);
});

//Route A3: Edit Message
messageRouter.post('/message/edit', function (req, res) {
    messages.editMessage(req, res);
});

//FUNCTIONS B: Get Messages
//Route B1: Get all Group Messages
messageRouter.get('/messages/group/:group_id', middlewares.verifyUser, (req, res) => {
    messages.getGroupMessages(req, res);
});

//Route B2: Get all Conversation Messages
messageRouter.get('/messages/conversation/:conversation_id', middlewares.verifyUser, (req, res) => {
    messages.getConversationMessages(req, res);
});

module.exports = messageRouter;
