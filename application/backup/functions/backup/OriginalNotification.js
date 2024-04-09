const groupFunctions = require('../groups')
const db = require('../conn');

class Notification {
	constructor(notificationFrom) {
	  this.notificationFrom = notificationFrom;
	}

	static createNotification() {
		console.log("created!")
	}

}

module.exports = Notification;

/*
class NotificationOriginal {
    constructor(notificationTo) {
        this._notificationTo = notificationTo;

    }


	getPostInfo() {
        console.log("notification");
	}

	//Method A1: Create a Single Notification
	static async createNotification(req) {
		const connection = db.getConnection(); 
		const masterSite = req.body.masterSite;
		const notificationFrom = req.body.postFrom;
		//const notificationTo = notificationTo;
		const notificationMessage = req.body.notificationMessage;
		const notificationLink = req.body.notificationLink;
		const notificationType = req.body.notificationType;
		const groupID = req.body.groupID;

		const queryString = "INSERT INTO notifications (master_site, group_id, notification_from, notification_to, notification_message, notification_type) VALUES (?, ?, ?, ?, ?)"

		connection.query(queryString, [masterSite, groupID, notificationFrom, notificationTo, notificationMessage, notificationType], (err, results) => {
			
			if (!err) {
				console.log("notification for " + notificationTo + " Worked!")
			} else {
				console.log("Failed to insert new Post: " + err);
			} 
		})
		
	}

	//Method A1: Create Group Notification
	static async createGroupNotification(req) {
		const connection = db.getConnection(); 
		const masterSite = notification.masterSite;
		const notificationFrom = notification.notificationFrom;
		const notificationMessage = notification.notificationMessage;
		const notificationLink = notification.notificationLink;
		const notificationType = notification.notificationType;
		const groupID = notification.groupID;
	
		//Get Group Users 
		const groupUsersObject = await groupFunctions.getGroupUsers(groupID);
		const groupUsers = groupUsersObject.groupUsers;

		//Create Notification for Each of Them
		for(let i = 0; i < groupUsers.length; i++) {
			let notificationTo =  groupUsers[i];
			const queryString = "INSERT INTO notifications (master_site, group_id, notification_from, notification_to, notification_message, notification_type) VALUES (?, ?, ?, ?, ?, ?)"

			connection.query(queryString, [masterSite, groupID, notificationFrom, notificationTo, notificationMessage, notificationType], (err, results) => {
				
				if (!err) {
					console.log("notification for " + notificationTo + " Worked!")
				} else {
					console.log("Failed to insert new Post: " + err);
				} 
			})
		}
	
	}


}




*/
































//APPENDIX



		/*
		connection.query(queryString, [newNotification.masterSite, newNotification.notificationFrom, newNotification.notificationTo, 
			newNotification.notificationMessage, newNotification.notificationType], (err, results) => {
			
			if (!err) {
				console.log("notification for " + newNotification.notificationTo + " Worked!")
			} else {
				console.log("Failed to insert new Post: " + err);
			} 
		})
		*/
		
/*
   //Method A1: Create a Single Notification
    static async createPostNotificationOLD(newNotification) {
        //console.log("create Notification, yay! it works! " + newNotification.notificationFrom + " " + newNotification.notificationTo);
		const groupID = newNotification.groupID;

		//Create the Notification to an indivual user
		if(groupID == 0) {
			console.log("Single User notification!");	
		
		//This post was made to a group so sent notifications to everyone in the group 		
		} else {
			console.log("GROUP notification!");	
					
			const groupUserResponse = await groupFunctions.getGroupUsers(groupID);
			const groupUsers = groupUserResponse.data;
			for (let i = 0; i < groupUsers.length; i++) {

			}
			
		} 
    }
	*/

				/*
				const queryString = "INSERT INTO notifications (master_site, notification_from, notification_to, notification_message, notification_type) VALUES (?, ?, ?, ?, ?)"

				connection.query(queryString, [newNotification.masterSite, newNotification.notificationFrom, newNotification.notificationTo, 
					newNotification.notificationMessage, newNotification.notificationType], (err, results) => {
					
					if (!err) {
						console.log("notification for " + newNotification.notificationTo + " Worked!")
					} else {
						console.log("Failed to insert new Post: " + err)
						//res.sendStatus(500)
						//return
					} 
				})
				*/


				/*
				var somevar = false;
var PTest = function () {
    return new Promise(function (resolve, reject) {
        if (somevar === true)
            resolve();
        else
            reject();
    });
}
var myfunc = PTest();
myfunc.then(function () {
     console.log("Promise Resolved");
}).catch(function () {
     console.log("Promise Rejected");
});*/
		
				//console.log("New Notification to " + groupUsers[i] + " " + newNotification.notificationMessage);
				//console.log(newNotification.notificationFrom + " " + groupUsers[i]);

/*
console.log("Group Users")
console.log("_____________")
console.log(groupUserResponse.data);
console.log("_____________")
console.log(newNotification.notificationTo)
console.log(newNotification.notificationFrom)
console.log(newNotification.notificationMessage)
console.log(newNotification.groupID)
console.log("_____________")
*/




/*
	//METHOD 4: Create Regular Notification to a Group
	public function createGroupNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type, $group_id) {
		global $conn;
		
		//Notification Variables 
		$status_unseen = 1;

		//If notification is from the logged in user don't notify them 
		if ($notification_from == $notification_to) {	
			$from_logged_in_user = 1;	
			
		//Create a Notification 	
		} else {
			$from_logged_in_user = 0;
			$notification_count  = 1;
			
			$stmt = $conn->prepare("INSERT INTO notifications (master_site, notification_from, notification_to, notification_time, 
				notification_message, notification_type, link_url, full_link, group_id, from_logged_in_user, notification_count, status_unseen) 
				VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)");
			
			$stmt->bind_param("sssssssiiii", $master_site, $notification_from, $notification_to, 
				$notification_message, $notification_type, $notification_link, $notification_link, $group_id, $from_logged_in_user, $notification_count, $status_unseen);

			if ($stmt->execute()) {
				//echo "success";
				//echo "normal";	
			} else {
				//echo "Error: <br>" . mysqli_error($conn);
			}
			$stmt->close();					
		}		
	}	
	*/

	
	/*
		if(groupID == 0) {
		Notification.createNotification(newNotification);
		res.send(newNotification);

	//This post was made to a group so sent notifications to everyone in the group 		
	} else {
		Notification.createGroupNotification(newNotification);
		res.send(newNotification);
	}
	*/

	/*
    //Method A2: Create a Group Notification 
    static createGroupNotification(newNotification) {
        console.log("create Group Notification, yay! it works! " + newNotification.notificationFrom + " " + newNotification.notificationTo);
    
    }
	*/