const express = require('express')
const userRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
//const postFunctions = require('../functions/postFunctions')
//const groupFunctions = require('../logic/groups')

//const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Update User Profile

*/

//USER ROUTES
//Route A1: Get User Profile
userRouter.post('/group/create/', function(req, res) { 
    userFunctions.getUserProfile(req, res);
})

//Route A2: Update User Profile
userRouter.post('/group/invite/', function(req, res) {
    userFunctions.updateUserProfile(req, res);
})


module.exports = userRouter;



