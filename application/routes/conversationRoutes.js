const express = require('express');
const conversationRouter = express.Router();
const conversations = require('../logic/conversations');
const middlewares = require('../functions/middlewareFunctions');

conversationRouter.get(
    '/conversations/group/:group_id',
    middlewares.verifyUser,
    (req, res) => {
        conversations.getConversationsByGroup(req, res);
    }
);

conversationRouter.get(
    '/conversations/:conversation_id',
    middlewares.verifyUser,
    (req, res) => {
        conversations.getConversationById(req, res);
    }
);

module.exports = conversationRouter;
