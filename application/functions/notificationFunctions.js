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

//Function A4: Delete a Notification
async function deleteSingleNotification(userName, notificationID)  {
    const connection = db.getConnection(); 
    console.log(userName)
    console.log(notificationID)

    /*
        

        const queryString = "UPDATE posts SET post_status = 0 WHERE post_id = ?;";

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			var response = {
				postID: postID,
				currentUser: currentUser,
			}
			deletePostOutcome.data.push(response)
			deletePostOutcome.message = true;
			deletePostOutcome.success = "Sucesfully deleted post " + postID;

			res.json(deletePostOutcome);

        } else {
            console.log("Failed to Delete Posts" + err)
			deletePostOutcome.statusCode = 500
			deletePostOutcome.message = "Could not delete post " + postID;
			deletePostOutcome.errors.push(err);
			
			res.status(500).json(deletePostOutcome)
            return
		}
    })
    var groupUserStatus = {
        outcome: 200,
		userName: userName
    }

    return new Promise(async function(resolve, reject) {
        const existingUsersSet = new Set();
        try {
            
            const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ? AND user_name = ?"			
            
            connection.query(queryString, [groupID, userName], (err, rows) => {
                if (!err) {
                    if(rows.length > 0) {
                        groupUserStatus.userInGroup = true
                    } else {
                        groupUserStatus.userInGroup = false
                    }

                    resolve(groupUserStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupUserStatus);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            reject(groupUserStatus);
        } 
    })
    */

}

module.exports = { getUserNotifications, deleteSingleNotification };
