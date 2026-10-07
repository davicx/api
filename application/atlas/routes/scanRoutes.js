const express = require('express');
const scanRouter = express.Router();
const scans = require('../logic/scans');
const middlewares = require('../../functions/middlewareFunctions');

scanRouter.get(
    '/cloudpilot/scans/conversation/:conversation_id/latest',
    middlewares.verifyUser,
    scans.getLatestScan
);

scanRouter.get(
    '/cloudpilot/scans/conversation/:conversation_id/recent',
    middlewares.verifyUser,
    scans.getRecentScans
);

scanRouter.get(
    '/cloudpilot/scans/:scan_id',
    middlewares.verifyUser,
    scans.getScanByID
);

module.exports = scanRouter;
