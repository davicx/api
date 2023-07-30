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
	1) Function A1: Get all Notifications 
	2) Function A2: Get all Notifications to Group
	3) Function A3: Get all Notifications to User 
 
FUNCTIONS B: All Functions Related to Notification Actions 
	1) Function B1: Set Notification to Seen 
	2) Function B2: Set all Notification as Seen 
	3) Function B3: Delete Notification 
	4) Function B3: Delete All Notifications 

*/

//FUNCTIONS A: All Functions Related to Getting Notifications 
//Function A1: Get all Notifications 
notificationRouter.get('/notifications/', function(req, res) {
    notifications.getAllNotifications(req, res);
})

//Function A2: Get all Notifications to a Group
notificationRouter.get('/notifications/group/:group_id', function(req, res) {
    notifications.getGroupNotifications(req, res);
})

//Function A3: Get all Notifications to User 
notificationRouter.get('/notifications/user/:user_id', function(req, res) {
    notifications.getUserNotifications(req, res);
})

//FUNCTIONS B: All Functions Related to Notification Actions 
//Function B1: Set Notification to Seen 
notificationRouter.get('/notification/seen/:notification_id', function(req, res) {
    notifications.setNotificationSeen(req, res);
})

//Function B2: Set all Notification as Seen 
notificationRouter.get('/notifications/seen/:user_id', function(req, res) {
    notifications.setAllNotificationsSeen(req, res);
})

//Function B3: Delete Notification 
notificationRouter.get('/notifications/delete/:notification_id/:user_name', function(req, res) {
    notifications.deleteNotification(req, res);
})
 
//Function B4: Delete All Notifications 



module.exports = notificationRouter;
//http://localhost:3003/notifications/user/davey