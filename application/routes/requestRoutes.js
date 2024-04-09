const express = require('express')
const requestRouter = express.Router();
//const postFunctions = require('../functions/postFunctions')
const requests = require('../logic/requests')
//const db = require('../functions/conn');
//const db = require('../functions/conn');
const middlewares = require('../functions/middlewareFunctions')

/*
FUNCTIONS A: All Functions Related to Requests
	1) Function A1: Get all Notifications 
	2) Function A2: Get all Notifications to Group
	3) Function A3: Get all Notifications to User 
*do not accept here

*/

requestRouter.get('/requests/user/:user_name', function(req, res) {
    requests.getUserRequests(req, res);
})

module.exports = requestRouter;