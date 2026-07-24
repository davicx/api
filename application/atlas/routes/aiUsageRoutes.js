const express = require('express');
const aiUsageRouter = express.Router();
const aiUsage = require('../logic/aiUsage');

/*
FUNCTIONS A: AI usage routes
    1) Route A1: Get AI usage summary

Doc: doc/development/ai_usage.md
*/

//Route A1: GET /ai/usage/summary
aiUsageRouter.get('/ai/usage/summary', function (req, res) {
    aiUsage.getAiUsageSummary(req, res);
});

module.exports = aiUsageRouter;
