const db = require('../functions/conn');




//APPENDIX
/*
FUNCTIONS A: All User Related Functions
	1) Function A1: Add a Friend
	2) Function A2: Cancel Pending Friend Request
	3) Function A3: Remove a Friend
	4) Function A4: Accept Friend Request
	5) Function A5: Decline Friend Request	
	6) Function A6: Accept Group Request
	7) Function A7: Decline Group Request
	
FUNCTIONS B: USER ACCOUNT 	
	1) Function B1: Edit User Profile
	2) Function B2: Upload New User Image	
	3) Function B3: Delete User
	4) Function B4: Request Username  
	5) Function B5: Request Password Send Email (Part 1)
	5) Function B5: Request Password Send Email (Part 1)
	6) Function B6: Request Password Update to New Password (Part 2)
	7) Function B7: Check Password Length *No PHP	
	8) Function B8: Check that both Passwords are the same *No PHP	

	

//FUNCTIONS A: All User Related Functions
//Function A1: Add a Friend
if (isset($_POST["add_friend_id"]) && (!empty($_POST["logged_in_user"]))) {
	$logged_in_user     = $_POST["logged_in_user"];
	$master_site     	= $_POST["master_site"];
	$add_friend_id   	= $_POST["add_friend_id"];
	$add_friend_name   	= getUserName($add_friend_id);
	$current_date 		= date("Y-m-d H:i:s");
	
	//STEP 1: Call Method A4 Request a Friend
	$Current_User = new User($logged_in_user);
	echo $Current_User->addFriend($logged_in_user, $add_friend_name);	
	
	//STEP 2: Create a Notification
	$notification_from = $logged_in_user;
	$notification_to = $add_friend_name;

	$notification_message =  "requested to be friends";
	$notification_link = "#";
	$notification_type = "friend_request";
	$Current_Notification = new Notifications($logged_in_user);	
	$Current_Notification->createNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type);
}


//Function A2: Cancel Pending Friend Request
if (isset($_POST["cancel_friend_request_id"]) && (!empty($_POST["cancel_friend_request_id"]))) {
	$logged_in_user    			= $_POST["logged_in_user"];
	$master_site     			= $_POST["master_site"];
	$cancel_friend_request_id   = $_POST["cancel_friend_request_id"];
	$cancel_friend_request_name = getUserName($cancel_friend_request_id);
	
	//STEP 1: Cancel Sent Request 
	$Current_User = new User($logged_in_user);
	$Current_User->cancelPendingRequest($logged_in_user, $cancel_friend_request_name);	
	
	//STEP 2: Cancel Notification 
}


//Function A3: Remove a Friend
if (isset($_POST["remove_friend_id"]) && (!empty($_POST["logged_in_user"]))) {
	$logged_in_user     = $_POST["logged_in_user"];
	$remove_friend_id   = $_POST["remove_friend_id"];
	$remove_friend_name  = getUserName($remove_friend_id);

	$Current_User = new User($logged_in_user);
	$Current_User->removeFriend($logged_in_user, $remove_friend_name);

}


//Function A4: Accept Friend Request
if (isset($_POST["accept_friend_request_id"]) && (!empty($_POST["logged_in_user"]))) {
	$logged_in_user    			 = $_POST["logged_in_user"];
	$master_site     			 = $_POST["master_site"];	
	$accept_friend_request_id    = $_POST["accept_friend_request_id"];
	$accept_friend_request_name  = getUserName($accept_friend_request_id);
	$request_from  				 = $accept_friend_request_name;
	$current_friendship_status   = checkUserFriendshipStatus($accept_friend_request_name, $logged_in_user);
	

	//STEP 1: Accept Request
	$Current_User = new User($logged_in_user);
	$Current_User->acceptFriendRequest($request_from, $logged_in_user);
 
	//STEP 2: Create Notification User Accepted your Request
	$notification_from = $logged_in_user;
	$notification_to = $request_from;
	$notification_message =  "accepted your Friend Request";
	$notification_type =  "friend_request_accepted";
	$notification_link = "#";
	$Current_Notification = new Notifications($logged_in_user);	
	$Current_Notification->createNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type);	

	//echo $accept_friend_request_id;
}


//Function A5: Decline Friend Request
if (isset($_POST["decline_friend_request_id"]) && (!empty($_POST["logged_in_user"]))) {
	ob_clean();	
	
	$logged_in_user    			 = $_POST["logged_in_user"];
	$master_site     			 = $_POST["master_site"];	
	$decline_friend_request_id   = $_POST["decline_friend_request_id"];
	$request_from 				 = getUserName($decline_friend_request_id); 

	//STEP 1: Decline Request
	$Current_User = new User($logged_in_user);
	$Current_User->declineFriendRequest($request_from, $logged_in_user);
	
	//STEP 2: Delete Notification 
	
}
*/