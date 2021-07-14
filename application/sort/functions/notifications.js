const mysql = require('mysql')
let user = require('./user');


/*
FUNCTIONS A: NOTIFICATION RELATED
	1) Function A1: Create a New Notification

*/


//Function A1: Create a New Notification
//function createNotification(masterSite, notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType) {
function createNotification(notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType) {
    console.log("NOTIFICATION: " + notificationFrom + " " + notificationTo + " " + notificationTo + " " + notificationMessage + " " + notificationType + " " + notificationLink);
	user.getActiveGroupMembers(321);

}


//Function A2: 
function createGroupNotification(groupID, notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType) {
    console.log("GROUP NOTIFICATION: " + groupID + " " + notificationFrom + " " + notificationTo + " " + notificationTo + " " + notificationMessage + " " + notificationType + " " + notificationLink);
	
	const groupMembers = user.getActiveGroupMembers(321);

	/*
	const queryString = "INSERT INTO user_profile (user_name, first_name, last_name) VALUES (?, ?, ?)"
	getConnection().query(queryString, [firstName, firstName, lastName], (err, results, fields) => {
		if (err) {
		console.log("Failed to insert new user: " + err)
		res.sendStatus(500)
		return
		}
		var newUserID = results.insertId;
		console.log("Inserted a new user with id: ", results.insertId);
	
		res.end()
	*/

	const connection = getConnection();
    const queryString = "SELECT DISTINCT user_name FROM group_users WHERE group_id = ? AND active_member = 1";

	//INSERT INTO notifications (master_site, notification_from, notification_to, notification_time, 
	//notification_message, notification_type, link_url, full_link, group_id, from_logged_in_user, notification_count, status_unseen) 
	//VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)")

    connection.query(queryString, [groupID], (err, rows) => {
        if (err) {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
        }
    }) 
}
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

 
module.exports = { createNotification, createGroupNotification };

//Create Connection Pool 
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})

//Functions: Get Connection
function getConnection() {
    return pool;
}


/*
$post_type = "text";
$notification_message = "made a comment "; 
$notification_type = "new_post_text"; 
$notification_link = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

$post_type = "text";
$notification_message = "made a comment "; 
$notification_type = "new_post_text"; 
$notification_link = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";


	public function createNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type) {
		global $conn;
		
		//Notification Variables 
		$status_unseen = 1;

		//See if notification is from the logged in user 
		if ($notification_from == $notification_to) {	
			$from_logged_in_user = 1;	
		} else {
			$from_logged_in_user = 0;				
		}

		$stmt = $conn->prepare("INSERT INTO notifications (master_site, notification_from, notification_to, notification_time, 
			notification_message, notification_type, link_url, full_link, from_logged_in_user, status_unseen) 
			VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)");
		
		$stmt->bind_param("sssssssii", $master_site, $notification_from, $notification_to, 
			$notification_message, $notification_type, $notification_link, $notification_link, $from_logged_in_user, $status_unseen);

		if ($stmt->execute()) {
			//echo "success";
			echo "normal";	
		} else {
			echo "Error: <br>" . mysqli_error($conn);
		}
		$stmt->close();				
	}	
    
*/