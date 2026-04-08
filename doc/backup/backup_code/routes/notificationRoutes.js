const express = require('express')
const notificationRouter = express.Router();
const notificationFunctions = require('../../functions/notificationFunctions')
const cors = require('cors');
notificationRouter.use(cors())

//GET ROUTES
//Route B1: Get all Notifications to a User 
notificationRouter.get("/notifications/user/:user_name", (req, res) => {
    notificationFunctions.getUserNotifications(req, res);
})

//Route B2: Get Single Notification 
notificationRouter.get("/notifications/user/:user_name", (req, res) => {
    //notificationFunctions.getUserNotifications(req, res);
    res.json({singleNotification: "singleNotification"})
})

//POST ROUTES
//Route A1: Mark Notification as Seen 
notificationRouter.post('/notifications/create', function(req, res) {
    postFunctions.postText(req, res);
})

//Route A2: Delete Notification

//Route A2: Delete All Notifications





module.exports = notificationRouter;
