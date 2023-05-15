const express = require('express')
const friendRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const friends = require('../logic/friends')
/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get User Friends	

FUNCTIONS B: All Functions Related to Friends Actions
	1) Function B1: Request a Friend	
	2) Function B2: Cancel a Friend	Request
	3) Function B3: Accept Friend Request
	4) Function B4: Decline Friend Request

*/

//FRIEND ROUTES
//FUNCTIONS A: All Functions Related to Friends
//Function A1: Request a Friend
friendRouter.get('/friends/:user_name/', function(req, res) { 
    friends.getUserFriends(req, res);
})

//FUNCTIONS A: All Functions Related to Friends
//Function A1: Request a Friend
friendRouter.post('/friend/request/', function(req, res) { 
    friends.addFriend(req, res);
})



module.exports = friendRouter;
