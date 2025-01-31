const express = require('express')
const groupRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
//const postFunctions = require('../functions/postFunctions')
const groupFunctions = require('../logic/groups')

var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 
	3) Function A3: Accept Group Invite
	4) Function A4: Get All Groups User is In 
    5) Function A5: Get Group Users  
	6) Function A6: Leave a Group 

*/

//GROUP ROUTES
//Route A1: Create a new Group
groupRouter.post('/group/create/', function(req, res) { 
    groupFunctions.createGroup(req, res);
})

//Route A2: Invite Users to a Group 
groupRouter.post('/group/invite/', function(req, res) {
    groupFunctions.addGroupUsers(req, res);
})

//Route A3: Accept Group Invite
groupRouter.post('/group/join/', function(req, res) {
    groupFunctions.acceptGroupInvite(req, res);
})

//Route A4: Get All Groups User is In 
//groupRouter.get("/groups/user/:user_name", middlewares.verifyUser, (req, res) => {
groupRouter.get("/groups/user/:user_name/", (req, res) => {
    groupFunctions.getUserGroups(req, res);
})

//Route A5: Get Group Users 
groupRouter.get("/group/users/:groupID", middlewares.verifyUser, (req, res) => {
    groupFunctions.getGroupUsers(req, res);
})

//Route A6: Leave a Group
groupRouter.post('/group/leave/', function(req, res) {
    groupFunctions.leaveGroup(req, res);
})


module.exports = groupRouter;



