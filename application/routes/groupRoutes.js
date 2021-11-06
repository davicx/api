const express = require('express')
const groupRouter = express.Router();
const groupFunctions = require('./../../functions/groupFunctions')
//app.use(express.json());

//USER ROUTES
//Route A1: Create a New Group
groupRouter.post('/group/create/', function(req, res) {
    groupFunctions.createGroup(req, res);
})

//Route A2: Invite User to a Group 
groupRouter.post('/group/invite/', function(req, res) {
    groupFunctions.addGroupUser(req, res);
})

//Route A3: Join Group 
groupRouter.post('/group/join/', function(req, res) {
    groupFunctions.acceptGroupInvite(req, res);
})

//Route A4: Leave a Group
groupRouter.post('/group/leave/', function(req, res) {
    groupFunctions.leaveGroup(req, res);
})

//GET ROUTES
//Route B1: Get Single Group by ID 
groupRouter.get("/group/:groupID", (req, res) => {
    groupFunctions.getGroup(req, res);
})

//Route B2: Get Group Users 
groupRouter.get("/group/users/:groupID", (req, res) => {
    groupFunctions.getGroupUsers(req, res);
})

//Route B3: Get All Groups a User is In


/*
groupRouter.get("/groups/:userName", (req, res) => {
    groupFunctions.getAllGroups(req, res);
})
*/



module.exports = groupRouter;




