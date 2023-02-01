const express = require('express')
const groupRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const postFunctions = require('../functions/postFunctions')
const groupFunctions = require('../functions/groupFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');


//GROUP ROUTES
//Route A1: Create a new Group
groupRouter.post('/group/create/', function(req, res) { 
    groupFunctions.createGroup(req, res);
})

/*
groupRouter.post('/group/invite/', function(req, res) {
    groupFunctions.addGroupUsers(req, res);
})
*/

//Route A1: Get all Groups for current user
groupRouter.get("/groups/user/:user_name", middlewares.verifyUser, (req, res) => {
    const currentUser = req.authorizationData.currentUser;
    
    groupFunctions.getUserGroups(req, res, currentUser);
})


module.exports = groupRouter;



