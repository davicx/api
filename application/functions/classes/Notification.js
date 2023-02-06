const db = require('../conn');

class Notification {
    constructor(notificationID) {
        this.notificationID = notificationID;
    }

    //Method: Example of Simple Promise
    /*
        static async addGroupUser(groupID, groupUser)  {
        const connection = db.getConnection(); 
        var addGroupUserStatus = {
            userAdded: 0,
            userName: groupUser
        }

        return new Promise(async function(resolve, reject) {
            try {
                const activeMember = 0;
                const queryString = "INSERT INTO group_users (group_id, user_name, active_member) VALUES (?, ?, ?)"
    
                connection.query(queryString, [groupID, groupUser, activeMember], (err, results) => {
                    if (!err) {
                        //console.log("You added " + groupUser)
                        addGroupUserStatus.userAdded = 1;
                        resolve(addGroupUserStatus);
                    } else {
                        addGroupUserStatus.userAdded = 0;
                        resolve(addGroupUserStatus);
                    }
                })  
            } catch(err) {
                reject(addGroupUserStatus);
            } 
        });
    }
    */
    
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
        console.log("worked!!")
        console.log(notification)
    }

    //Method A3: Temp Method 
    static newNotification(notification)  {
        console.log("worked!!")
        console.log(notification)
    }

}


module.exports = Notification;