const db = require('./conn');
//const Group = require('./classes/Group');
//const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
//const Requests = require('./classes/Requests');

//Function A1: Get all Notifications 
function getUserNotifications(req, res) {
    const userName = req.params.user_name;
    const connection = db.getConnection(); 

	const notificationQuery = "SELECT * FROM notifications WHERE notification_to = ? AND notification_deleted = 0";

    connection.query(notificationQuery, [userName], (err, rows) => {
        if (!err) {
			var notificationsArray = [];

			rows.map((row) => {
                let notification = {
                    notificationID: row.notification_id,
                    notificationFrom: row.notification_from,
                    notificationTo: row.notification_to,
                    notificationType: row.notification_type,
                    notificationMessage: row.notification_message

                }
				notificationsArray.push(notification);
			});

            //const filteredNotifications = notificationsArray.filter(notification => notification.notificationType === "group_invite");
 
			//res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({notifications: notificationsArray});

        } else {
            console.log("Failed to Select Notifications" + err)
            res.sendStatus(500)
            return
		}
    })
}

//Function A1: Get all Friend Invite Notifications 
//Function A2: Get all Post Notifications 
//Function A3: Get all Group Notifications 

module.exports = { getUserNotifications };
