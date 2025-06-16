const express = require('express')
const groupRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
//const postFunctions = require('../functions/postFunctions')
const groupFunctions = require('../logic/groups')
const functions = require('../functions/functions')

var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	1) Function A2: Get Groups
	2) Function A3: Invite User to a Group 
	3) Function A4: Accept Group Invite
	4) Function A5: Get All Groups User is In 
    5) Function A6: Get Group Users  
	6) Function A7: Leave a Group 
	7) Function A8: Update Group

*/

//GROUP ROUTES
//Route A1: Create a new Group
groupRouter.post('/group/create/working', function(req, res) { 
    groupFunctions.createGroupWorking(req, res);
})

//Route A1: Create a new Group
groupRouter.post('/group/create/', function(req, res) { 
    //groupFunctions.createGroup(req, res);
    const appLocation = process.env.APP_LOCATION
    const fileLocation = process.env.FILE_LOCATION

    console.log("appLocation " + appLocation + " fileLocation " +fileLocation );

    //Type 1: Local to Local 
    if(functions.compareStrings(appLocation, "local") && functions.compareStrings(fileLocation, "local")) {
        console.log("__________________________________")
        console.log("New Group: Type 1: Local to Local")
        console.log("__________________________________")
        groupFunctions.createGroup(req, res)
    //Type 2: Local to AWS 	
    } else if (functions.compareStrings(appLocation, "local") && functions.compareStrings(fileLocation, "aws")) {
        console.log("__________________________________")
        console.log("New Group: Type 2: Local to AWS")
        console.log("__________________________________")
        groupFunctions.createGroupAWS(req, res)
    //Type 3: AWS to AWS	
    } else if(functions.compareStrings(appLocation, "aws") && functions.compareStrings(fileLocation, "aws")) {
        console.log("__________________________________")
        console.log("New Group: Type 3: AWS to AWS")
        console.log("__________________________________")
        res.json({need:"Set this up"})
    } else {
        res.json({outcome:"uhh whats up dude", appLocation: appLocation, fileLocation:fileLocation})
    }
})


//Route A2: Get Groups
groupRouter.get('/groups/user/:user_name/', function(req, res) {
    groupFunctions.getGroups(req, res);
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
groupRouter.get("/groups/small/user/:user_name/", (req, res) => {
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

//Route A8: Update Group (Function A2: Update Group)
groupRouter.post('/group/update/', function(req, res) {
    groupFunctions.updateGroup(req, res);
});

module.exports = groupRouter;



