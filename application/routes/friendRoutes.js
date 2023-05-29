const express = require('express')
const friendRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const friends = require('../logic/friends')
/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get All Site Users	
	2) Function A2: Get Your Friends	
	3) Function A3: Get a list of someones friends	


FUNCTIONS B: All Functions Related to Friends Actions
	1) Function B1: Request a Friend	
	2) Function B2: Cancel a Friend	Request
	3) Function B3: Accept Friend Request
	4) Function B4: Decline Friend Request

*/

//FRIEND ROUTES
//FUNCTIONS A: All Functions Related to Friends 
//Function A1: Get All Site Users
friendRouter.get('/users/all/', function(req, res) { 
    friends.getAllUsers(req, res);
})

//Function A2: Get Your Friends	
friendRouter.get('/friends/:user_name/', function(req, res) { 
    friends.getYourFriends(req, res);
})

//Function A3: Get a list of someones friends	
//http://localhost:3003/friend/sam/user/davey
friendRouter.get('/friend/:friend_name/user/:user_name/', function(req, res) { 
    friends.getUserFriends(req, res);
})


//FUNCTIONS B: All Functions Related to Friends Actions
//Function B1: Request a Friend	
friendRouter.post('/friend/request/', function(req, res) { 
    friends.addFriend(req, res);
})

//Function B2: Cancel a Friend	Request
//Function B3: Accept Friend Request
//Function B4: Decline Friend Request




module.exports = friendRouter;
