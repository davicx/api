const db = require('../conn');

//Need to work on this maybe add more stuff and types of notifications
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
        var postID = 0;
        if (notification.postID) {
            postID = notification.postID
        }

        console.log("Step 4A: Notification: Creating New Group Notifications")
   
		//Get Group Users 
        for(let i = 0; i < groupUsers.length; i++) {
			let notificationTo =  groupUsers[i];
            if(notificationTo != notificationFrom) {
                const queryString = "INSERT INTO notifications (master_site, group_id, post_id, notification_from, notification_to, notification_message, notification_type, notification_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"

                connection.query(queryString, [masterSite, groupID, postID, notificationFrom, notificationTo, notificationMessage, notificationType, notificationLink], (err, results) => {                  
                    if (!err) {
                        console.log("Step 4B: notification for " + notificationTo + " Worked!")
                    } else {
                        console.log("Step 4B: Failed to insert new Notification: ");
                        console.log(err)
                    } 
                })
            }
    	}
	}

    //Method A2: Create Group Notification with Wait
    static async createGroupNotificationWait(notification) {
        const connection = db.getConnection(); 
        const masterSite = notification.masterSite;
        const notificationFrom = notification.notificationFrom;
        const groupUsers = notification.notificationTo;
        const notificationMessage = notification.notificationMessage;
        const notificationLink = notification.notificationLink;
        const notificationType = notification.notificationType;
        const groupID = notification.groupID;
        const postID = notification.postID || 0;
    
        console.log("Step 4A: Notification: Creating New Group Notifications");
    
        // Helper to wrap DB query in a Promise
        function insertNotification(notificationTo) {
            return new Promise((resolve, reject) => {
                const queryString = `
                    INSERT INTO notifications (
                        master_site, group_id, post_id,
                        notification_from, notification_to,
                        notification_message, notification_type, notification_link
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
                connection.query(queryString, [
                    masterSite, groupID, postID,
                    notificationFrom, notificationTo,
                    notificationMessage, notificationType, notificationLink
                ], (err, results) => {
                    if (err) {
                        console.log("Step 4B: Failed to insert new Notification for", notificationTo);
                        console.log(err);
                        return reject(err);
                    }
                    console.log("Step 4B: notification for " + notificationTo + " Worked!");
                    resolve();
                });
            });
        }
    
        // Use for...of loop so we can await inside
        for (const notificationTo of groupUsers) {
            if (notificationTo !== notificationFrom) {
                await insertNotification(notificationTo);
            }
        }
    }
    
    // Method A1: Create Group Notification
    static async createGroupNotificationWaitComplex(notification) {
        const connection = db.getConnection();

        var notificationOutcome = {
            success: false,
            message: "",
            notificationsCreated: [],
            errors: []
        };

        const masterSite = notification.masterSite;
        const notificationFrom = notification.notificationFrom;
        const groupUsers = notification.notificationTo;
        const notificationMessage = notification.notificationMessage;
        const notificationLink = notification.notificationLink;
        const notificationType = notification.notificationType;
        const groupID = notification.groupID;
        const postID = notification.postID || 0;

        console.log("Step 4A: Notification: Creating New Group Notifications");

        return new Promise(async function (resolve, reject) {
            try {
                const queryString = "INSERT INTO notifications (master_site, group_id, post_id, notification_from, notification_to, notification_message, notification_type, notification_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

                let insertPromises = [];

                for (let i = 0; i < groupUsers.length; i++) {
                    let notificationTo = groupUsers[i];

                    if (notificationTo !== notificationFrom) {
                        insertPromises.push(
                            new Promise((resolveInsert) => {
                                connection.query(queryString, [masterSite, groupID, postID, notificationFrom, notificationTo, notificationMessage, notificationType, notificationLink], (err, results) => {
                                    if (!err) {
                                        console.log("Step 4B: Notification for " + notificationTo + " Worked!");
                                        notificationOutcome.notificationsCreated.push(notificationTo);
                                        resolveInsert(true);
                                    } else {
                                        console.log("Step 4B: Failed to insert new Notification: " + err);
                                        notificationOutcome.errors.push({ user: notificationTo, error: err });
                                        resolveInsert(false);
                                    }
                                });
                            })
                        );
                    }
                }

                // Wait for all notifications to be inserted
                const results = await Promise.all(insertPromises);

                if (results.includes(true)) {
                    notificationOutcome.success = true;
                    notificationOutcome.message = "Group notifications processed successfully.";
                } else {
                    notificationOutcome.message = "Failed to insert all notifications.";
                }

                resolve(notificationOutcome);
            } catch (err) {
                notificationOutcome.message = "REJECTED";
                notificationOutcome.errors.push(err);
                console.log("REJECTED " + err);
                reject(notificationOutcome);
            }
        });
    }

    
	static async createSingleNotification(notification) {
        const connection = db.getConnection(); 

        var notificationOutcome = {
            success: false,
            message: "",
            notificationTo: notification.notificationTo,
            errors: []
        }

        const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const notificationTo = notification.notificationTo;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = notification.notificationLink;
		const notificationType = notification.notificationType;
		const groupID = notification.groupID;

        console.log("New Single Notification")
      
        if(notificationTo != notificationFrom) {
            return new Promise(async function(resolve, reject) {
                try {
                    const queryString = "INSERT INTO notifications (master_site, group_id, notification_from, notification_to, notification_message, notification_type, notification_link) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    
                    connection.query(queryString, [masterSite, groupID, notificationFrom, notificationTo, notificationMessage, notificationType, notificationLink], (err, results) => {                  
                        if (!err) {
                            notificationOutcome.success = true
                            notificationOutcome.message = "notification for " + notificationTo + " Worked!"

                            console.log("notification for " + notificationTo + " Worked!")
                        } else {
                            notificationOutcome.message = "Failed to insert new Post: " + err
                            notificationOutcome.errors.push(err)

                            console.log("Failed to insert new Post: " + err);
                        } 
                        resolve(notificationOutcome);
                    })
                    
                } catch(err) {
                    registerUserProfileOutcome.message = "REJECTED";
                    notificationOutcome.errors.push(err)
                    console.log("REJECTED " + err);

                    reject(notificationOutcome);
                } 
            });
        } else {
            console.log("Your logged in so wont do one for " + notificationTo)
        }
    }

    //Method A2: Create Single Notification
	static async createSingleNotificationWORKS(notification) {
        const connection = db.getConnection(); 
        const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const notificationTo = notification.notificationTo;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = notification.notificationLink;
		const notificationType = notification.notificationType;
		const groupID = notification.groupID;
        console.log("New Single Notification")
      
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

    //Method A3: Create Post Notification (Maybe group under single)
	static async createPostNotification(notification) {
		const connection = db.getConnection(); 
        const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const groupUsers = notification.notificationTo;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = notification.notificationLink;
		const notificationType = "post";
		const groupID = notification.groupID;
        //console.log(groupUsers);
   
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

    //Method A4: Create Comment Notification (Maybe group under single)
	static async createCommentNotification(notification) {
		const connection = db.getConnection(); 
        const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const groupUsers = notification.notificationTo;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = "notification.notificationLink";
		const notificationType = notification.notificationType;
		const groupID = notification.groupID;
		const postID = notification.postID;
		const commentID = notification.commentID;
        console.log(groupUsers);
   
		//Get Group Users 
        for(let i = 0; i < groupUsers.length; i++) {
			let notificationTo =  groupUsers[i];
            if(notificationTo != notificationFrom) {
                const queryString = "INSERT INTO notifications (master_site, group_id, post_id, comment_id, notification_from, notification_to, notification_message, notification_type, notification_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"

                connection.query(queryString, [masterSite, groupID, postID, commentID, notificationFrom, notificationTo, notificationMessage, notificationType, notificationLink], (err, results) => {                  
                    if (!err) {
                        console.log("notification for " + notificationTo + " Worked!")
                    } else {
                        console.log("Failed to insert new Post: " + err);
                    } 
                })
            }
    	}
        
	}

    //Method A5: Set a Notification to seen
    static async setNotificationSeen(notificationType, notificationFrom, notificationTo) {
        const connection = db.getConnection(); 
        
        if(notificationTo != notificationFrom) {
            const queryString = "UPDATE notifications SET notification_seen = 1 WHERE notification_type = ? AND notification_from = ? AND notification_to = ?"
            connection.query(queryString, [notificationFrom, notificationTo, notificationType], (err, results) => {                  
                if (!err) {
                    console.log("notification for " + notificationTo + " Worked!")
                } else {
                    console.log("Failed to insert new Post: " + err);
                } 
            })
        }

    }

    //Method A6: Delete a Notification (Remove from Database) 
    static async deleteNotification(notificationType, notificationFrom, notificationTo) {
        const connection = db.getConnection(); 

        var removeNotificationStatus = {
            notificationRemoved: false,
            notificationType: notificationType,
            notificationFrom: notificationFrom,
            notificationTo: notificationTo,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "DELETE FROM notifications WHERE notification_type = ? AND notification_from = ? AND notification_to = ?"

                connection.query(queryString, [notificationType, notificationFrom, notificationTo], (err) => {
                    if (!err) {
                        removeNotificationStatus.notificationRemoved = true;

                        resolve(removeNotificationStatus);
                    } else {
                        console.log(err)
                        removeNotificationStatus.errors.push(err);
                        resolve(removeNotificationStatus);
                    }
                })  
            } catch(err) {
                console.log(err)
                removeNotificationStatus.errors.push(err);
                reject(removeNotificationStatus);
            } 
        });

    }





}


module.exports = Notification;

//APPENDIX
/*

    static async deleteSeen(notificationType, notificationFrom, notificationTo) {
        console.log("Notification!")
        console.log(commentID, currentUser, comment_type);
      
		//Get Group Users 
        if(notificationTo != notificationFrom) {
            const queryString = "UPDATE notifications SET notification_seen = 1 WHERE notification_type = ? AND notification_from = ? AND notification_to = ?"
            connection.query(queryString, [notificationFrom, notificationTo, notificationType], (err, results) => {                  
                if (!err) {
                    console.log("notification for " + notificationTo + " Worked!")
                } else {
                    console.log("Failed to insert new Post: " + err);
                } 
            })
        }

    }

*/

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