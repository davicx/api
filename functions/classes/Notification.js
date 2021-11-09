const db = require('../conn');
const groupFunctions = require('../groupFunctions')

class Notification {
    constructor(notificationID) {
        this.notificationID = notificationID;
    }

	//Method A1: Create Group Notification
	static async createGroupNotification(notification) {
		const connection = db.getConnection(); 
        const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const groupUsers = notification.notificationTo;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = notification.notificationLink;
		const notificationType = notification.notificationType;
		const groupID = notification.groupID;
        console.log(groupUsers);
   
		//Get Group Users 
        for(let i = 0; i < groupUsers.length; i++) {
			let notificationTo =  groupUsers[i];
            if(notificationTo != notificationFrom) {
                const queryString = "INSERT INTO notifications (master_site, group_id, notification_from, notification_to, notification_message, notification_type, notification_link) VALUES (?, ?, ?, ?, ?, ?, ?)"

                connection.query(queryString, [masterSite, groupID, notificationFrom, notificationTo, notificationMessage, notificationType, notificationLink], (err, results) => {                  
                    if (!err) {
                        console.log("notification for " + notificationTo + " Worked!")
                    } else {
                        console.log("Failed to insert new Post: " + err);
                    } 
                })
            }
    	}
	}

    //Method A2: Create Single Notification
	static async createSingleNotification(notification) {
        
    }

    static testCreateGroupNotification(notification) {
        console.log(notification);
        console.log("TEST GROUP")
    }
}

module.exports = Notification;