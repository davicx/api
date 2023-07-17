const db = require('../functions/conn');
//const Group = require('../functions/classes/Group');
//const Post = require('../functions/classes/Post');
//const Notification = require('../functions/classes/Notification')
//const Comment = require('../functions/classes/Comment')
//const Requests = require('../functions/classes/Requests');
//const Functions = require('../functions/functions');
const NotificationFunctions = require('../functions/notificationFunctions');

/*
FUNCTIONS A: All Functions Related to Getting Notifications 
	1) Function A1: Get all Notifications 
	2) Function A2: Get all Notifications to Group
	3) Function A3: Get all Notifications to User 
 
FUNCTIONS B: All Functions Related to Notification Actions 
	1) Function B1: Set Notification to Seen 
	2) Function B2: Set all Notification as Seen
	3) Function B3: Delete Notification
	4) Function B4: Delete All Notifications 
	5) Function B5: Check for Existing Notification
*/

//FUNCTIONS A: All Functions Related to Getting Notifications 
//Function A1: Get all Notifications 
async function getAllNotifications(req, res) {
    const connection = db.getConnection(); 

    var notificationResponse = {
		notificationData: {},
		message: "", 
        statusCode: 500,
		success: false,
		errors: [], 
		currentUser: "Global"
    }

    const queryString = "SELECT * FROM notifications WHERE notification_deleted = 0";

    connection.query(queryString, (err, rows) => {
        if (!err) {
            console.log(rows)
            
			const notificationArray = rows.map((row) => {
				return {
					notificationID: row.notification_id,
					groupID: row.group_id,
					commentFrom: row.post_id,
					commentType: row.comment_id,	
					notificationFrom: row.notification_from,
					notificationTo: row.notification_to,
					notificationType: row.notification_type,
					notificationMessage: row.notification_message,
					notificationTime: row.notification_time,
					notificationSeen: row.notification_seen
				}
			});
            notificationResponse.message = "Sucesfully got your notifications!"
            notificationResponse.notificationData.notificationCount = notificationArray.length
            notificationResponse.notificationData.notificationArray = notificationArray

            res.json(notificationResponse)
            
        } else {
            console.log("Failed to Select Posts" + err)
            notificationResponse.errors.push(err)
            res.status(500).json(notificationResponse);
            //res.sendStatus(500)
            return
		}
    })

}

//Function A2: Get all Notifications to a Group
async function getGroupNotifications(req, res) {
    let groupID = req.params.group_id;
    console.log(groupID);
    const connection = db.getConnection(); 

    var notificationResponse = {
		notificationData: {},
		message: "", 
        statusCode: 500,
		success: false,
		errors: [], 
		currentUser: "Global"
    }

    const queryString = "SELECT * FROM notifications WHERE group_id = ? AND notification_deleted = 0";

    connection.query(queryString, [groupID], (err, rows) => {
        if (!err) {
            console.log(rows)
            
			const notificationArray = rows.map((row) => {
				return {
					notificationID: row.notification_id,
					groupID: row.group_id,
					commentFrom: row.post_id,
					commentType: row.comment_id,	
					notificationFrom: row.notification_from,
					notificationTo: row.notification_to,
					notificationType: row.notification_type,
					notificationMessage: row.notification_message,
					notificationTime: row.notification_time,
					notificationSeen: row.notification_seen
				}
			});
            notificationResponse.message = "Sucesfully got your group notifications!"
            notificationResponse.notificationData.notificationCount = notificationArray.length
            notificationResponse.notificationData.notificationArray = notificationArray

            res.json(notificationResponse)
            
        } else {
            console.log("Failed to Select Posts" + err)
            notificationResponse.errors.push(err)
            res.status(500).json(notificationResponse);
            //res.sendStatus(500)
            return
		}
    })

}

//Function A3: Get all Notifications to User 
async function getUserNotifications(req, res) {
    let currentUser = req.params.user_id;
    console.log(currentUser);
    const connection = db.getConnection(); 

    var notificationResponse = {
		notificationData: {},
		message: "", 
        statusCode: 500,
		success: false,
		errors: [], 
		currentUser: "Global"
    }

    const queryString = "SELECT * FROM notifications WHERE notification_to = ? AND notification_deleted = 0";

    connection.query(queryString, [currentUser], (err, rows) => {
        if (!err) {
            console.log(rows)
            
			const notificationArray = rows.map((row) => {
				return {
					notificationID: row.notification_id,
					groupID: row.group_id,
					commentFrom: row.post_id,
					commentType: row.comment_id,	
					notificationFrom: row.notification_from,
					notificationTo: row.notification_to,
					notificationType: row.notification_type,
					notificationMessage: row.notification_message,
					notificationTime: row.notification_time,
					notificationSeen: row.notification_seen
				}
			});
            notificationResponse.message = "Sucesfully got your group notifications!"
            notificationResponse.notificationData.notificationCount = notificationArray.length
            notificationResponse.notificationData.notificationArray = notificationArray

            res.json(notificationResponse)
            
        } else {
            console.log("Failed to Select Posts" + err)
            notificationResponse.errors.push(err)
            res.status(500).json(notificationResponse);
            //res.sendStatus(500)
            return
		}
    })
}

//FUNCTIONS B: All Functions Related to Notification Actions 
//Function B1: Set Notification to Seen 
async function setNotificationSeen(req, res) {
	res.json({hi: "hi"})
}

//Function B2: Set all Notification as Seen
async function setAllNotificationsSeen(req, res) {
	res.json({hi: "hi"})
}

//Function B3: Delete Notification
async function deleteNotification(req, res) {
	console.log(req.params)
	const currentUser = req.params.user_name;
	const notificationID = req.params.notification_id;
	//NotificationFunctions.deleteSingleNotification(currentUser, notificationID)
	NotificationFunctions.deleteSingleNotification(currentUser, notificationID)
	res.json({hi: "hi"})
}

//Function B4: Delete All Notifications 

//Function B5: Check for Existing Notification
async function checkNotificationStatus(notificationType, notificationFrom, notificationTo) {
    const connection = db.getConnection(); 

    var notificationResponse = {
		notificationCount: 0,
		notificationExists: true,
		notificationMessage: "",
		errors: [], 
    }

    const queryString = "SELECT * FROM notifications WHERE notification_type = ? AND notification_from = ? AND notification_to = ? AND notification_deleted = 0";
 
	return new Promise(async function(resolve, reject) {
		try {
			connection.query(queryString, [notificationType, notificationFrom, notificationTo], (err, rows) => {
				if (!err) {
					
					notificationResponse.notificationCount = rows.length;
					if(rows.length < 1) {
						notificationResponse.notificationExists = false;
					} else {
						notificationResponse.notificationExists = true;
					}
					
					resolve(notificationResponse);
				} else {
					notificationResponse.errors.push(err);
					resolve(notificationResponse);
				}
			})  
		} catch(err) {
			notificationResponse.errors.push(err);
			reject(notificationResponse);
		} 
	});

}


module.exports = { getUserNotifications, getGroupNotifications, getAllNotifications, setNotificationSeen, setAllNotificationsSeen, deleteNotification, checkNotificationStatus };


