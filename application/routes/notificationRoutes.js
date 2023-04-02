const express = require('express')
const notificationRouter = express.Router();
//const postFunctions = require('../functions/postFunctions')
const notifications = require('../logic/notifications')
//var jwt = require('jsonwebtoken');
//var jwt_decode = require('jwt-decode');
//const db = require('../functions/conn');
//const db = require('../functions/conn');
const middlewares = require('../functions/middlewareFunctions')

/*
FUNCTIONS A: All Functions Related to Getting Notifications 
	1) Function A1: Get all Notifications to User 
 
FUNCTIONS B: All Functions Related to Notification Actions 
	1) Function B1: Set all Notification as Seen 

*/

//FUNCTIONS A: All Functions Related to Getting Notifications 
//Function A1: Get all Notifications to User 
notificationRouter.get('/notifications/user/:user_id', function(req, res) {
    notifications.getUserNotifications(req, res);
})


module.exports = notificationRouter;
//http://localhost:3003/notifications/user/davey