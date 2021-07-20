const db = require('./conn');
const Notification = require('./classes/Notifications');
/*
FUNCTIONS A: All Functions Related to Making a Post
	1) Function A1: Post Text  
	2) Function A2: Post a Photo
	3) Function A3: Post a Video
	4) Function A4: Post an Article
	5) Function A5: Post a File 
*/



//Function A1: Post Text 
function postText(req, res) {

    //STEP 1: Insert into posts table
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
    const connection = db.getConnection(); 
    //console.log("POST DATA: " + postFrom + " " + postTo + " " + postCaption);
	//let myNotification = new Notification(postFrom);
	const newNotification = {
		notificationFrom: postFrom,
		notificationTo: postTo
	}
	Notification.createNotification(newNotification);
	res.send("POST DATA: " + postFrom + " " + postTo + " " + postCaption)
	//WORKS
	/*
    const queryString = "INSERT INTO posts (post_from, post_to, post_caption) VALUES (?, ?, ?)"
    
    connection.query(queryString, [postFrom, postTo, postCaption], (err, results, fields) => {
        if (!err) {
			
			//STEP 2: Create Notifications
			console.log("You created a new Post with ID " + results.insertId);
            
			res.send("LAST: It worked " + results.insertId);
        } else {
			console.log("Failed to insert new Post: " + err)
            res.sendStatus(500)
            return
        } 
    }) 
	*/
}

/*
	//STEP 2: Add New Text Notifications 
	$notification_message = $_POST["notification_message"];
	$notification_link    = $_POST["notification_link"];	
	$notification_type    = $_POST["notification_type"];	
	$notification_from    = $post_from;
	
	$Current_Notification = new Notifications($logged_in_user);
	$notification_to_array = getActiveGroupMembers($group_id);
	$notification_to_count = count($notification_to_array);

	//Loop Through all Group Member and Send them a Notification 
	for($x = 0; $x < $notification_to_count; $x++) {
		$notification_to = $notification_to_array[$x];				
		$Current_Notification->createGroupNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type, $group_id);
	}		
	
*/


module.exports = { postText };
