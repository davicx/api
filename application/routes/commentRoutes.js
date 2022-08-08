const express = require('express')
const commentRouter = express.Router(); 
const commentFunctions = require('../../functions/commentFunctions')
const cors = require('cors');
commentRouter.use(cors())


//COMMENT ROUTES
//Route A1: Make a New Comment 
commentRouter.post('/comment', function(req, res) {
    commentFunctions.postComment(req, res);
})



//Route A3: Delete a User 
module.exports = commentRouter;

/*
if (isset($_POST["logged_in_user"]) && (!empty($_POST["new_comment"]))) {
	$logged_in_user	  	 = $_POST["logged_in_user"]; 
	$post_id	  		 = $_POST["post_id"]; 
	$comment_is_child  	 = 0; 
	$comment		  	 = $_POST["new_comment"]; 
	$comment_from	  	 = $_POST["logged_in_user"]; 

 	//Step 1: Insert into comments table 	
	$stmt = $conn->prepare("INSERT INTO comments(post_id, comment_is_child, comment, comment_from, updated, created) 
		VALUES (?,?,?,?, NOW(), NOW())");
	$stmt->bind_param("iiss", $post_id, $comment_is_child, $comment, $comment_from);

	if ($stmt->execute()) {
		echo "New record created successfully";
		
		//STEP 4: Add New Post Notifications 
		$notification_from    = $post_from;

		$Current_Notification = new Notifications($logged_in_user);
		$notification_to_array = getActiveGroupMembers($group_id);
		$notification_to_count = count($notification_to_array);

		//Loop Through all Group Member and Send them a Notification 
		for($x = 0; $x < $notification_to_count; $x++) {
			$notification_to = $notification_to_array[$x];				
			$Current_Notification->createGroupNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type, $group_id);
		}	
		
	} else {
		echo "Error: " . $sql . "<br>" . mysqli_error($conn);
	}
	$stmt->close();
} 

FUNCTIONS C: All Functions Related to Commenting on a Post 
	1) Function C1: Make a New Comment 
	2) Function C2: Edit a Comment
	3) Function C3: Delete a Comment 
*/