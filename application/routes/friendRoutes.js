const express = require('express')
const friendRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const friends = require('../logic/friends')
/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get All Site Users	
	2) Function A2: Get Your Friends	
	3) Function A3: Get All Your Friends (Active and Pending)	
	4) Function A4: Get your Pending Friends Requests (They accept)	
	5) Function A5: Get your Pending Friends Invites (You can accept)
	6) Function A6: Get a list of someones friends 
	7) Function A7: Get a list of someones friends with Friendship Status
	8) Function A8: Get all Site Users with Friendship Status 

FUNCTIONS B: All Functions Related to Friends Actions
	1) Function B1: Request a Friend	
	2) Function B2: Accept Friend Request 
	3) Function B3: Cancel a Friend	Request
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

//Function A3: Get All Your Friends (Active and Pending)	
friendRouter.get('/friends/all/:user_name/', function(req, res) { 
    friends.getAllYourFriends(req, res);
})

//Function A4: Get your Pending Friends Requests (They accept)
friendRouter.get('/friends/requests/:user_name/', function(req, res) { 
    friends.getPendingFriendRequests(req, res);
})

//Function A5: Get your Pending Friends Invites (You can accept)
friendRouter.get('/friends/invites/:user_name/', function(req, res) { 
    friends.getPendingFriendInvites(req, res);
})

//Function A6: Get a list of someones friends 
friendRouter.get('/friend/:friend_name', function(req, res) { 
    friends.getBasicUserFriends(req, res);
})

//Function A7: Get a list of someones friends with Friendship Status
friendRouter.get('/friend/:friend_name/user/:user_name/', function(req, res) { 
    friends.getUserFriends(req, res);
})

//Function A8: Get all Site Users with Friendship Status 
friendRouter.get('/users/all/:user_name/', function(req, res) { 
    friends.getAllUsersWithFriendship(req, res);
})

//FUNCTIONS B: All Functions Related to Friends Actions
//Function B1: Request a Friend	
friendRouter.post('/friend/request/', function(req, res) { 
    friends.addFriend(req, res);
})

//Function B2: Accept Friend Request 
friendRouter.post('/friend/accept/', function(req, res) { 
    friends.acceptFriendRequest(req, res);
})

//Function B3: Cancel a Friend Request

//Function B4: Decline Friend Request

module.exports = friendRouter;

