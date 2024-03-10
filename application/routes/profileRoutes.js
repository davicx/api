const express = require('express')
const userRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const profile = require('../logic/profile')

//const postFunctions = require('../functions/postFunctions')
//const groupFunctions = require('../logic/groups')

//const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Get Simple User Profile
	3) Function A3: Update User Profile
*/

//PROFILE ROUTES
//Route A1: Get User Profile
userRouter.get('/profile/:user_name/', function(req, res) { 
    profile.getUserProfile(req, res);
})

//Function A2: Get Simple User Profile
userRouter.get('/profile/simple/:user_name', function(req, res) { 
    profile.getSimpleUserProfile(req, res);
})

//Route A2: Update User Profile
userRouter.post('/profile', function(req, res) {
    profile.updateUserProfile(req, res);
})


module.exports = userRouter;



