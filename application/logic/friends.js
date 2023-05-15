const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notifications = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions')


/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get User Friends	


FUNCTIONS B: All Functions Related to Friends
	1) Function B1: Request a Friend	
	2) Function B2: Cancel a Friend	Request
	3) Function B3: Accept Friend Request
	4) Function B4: Decline Friend Request

*/

//FUNCTIONS A: All Functions Related to Friends 
//Function A1: Get User Friends	
async function getUserFriends(req, res) {
    const userName = req.params.userName;

    console.log(req.params);
    res.json({hi:"hi"})

}

function temp() {
/*

	//Method A4: Request a Friend
	public function addFriend($requestFrom, $requestTo) {
		global $conn;
		$request_type			= "friend";
		$request_type_text		= "Wants to be Friends";
		$request_sent_from 		= $requestFrom;
		$request_sent_from_id 	= getUserID($requestFrom);
		
		$request_sent_to 		= $requestTo;
		$request_sent_to_id 	= getUserID($requestTo);
		$request_key 			= $request_sent_from . $request_sent_to;
		$request_status 		= 1;
		$add_friend_status  	= 0;

		//STEP 1: Check if these users are already friends (1 they are friends, 0 they are not)
		$friendship_status = checkUserFriendshipStatus($request_sent_from, $request_sent_to);

		//They are friends		
		if($friendship_status > 0) {
			$add_friend_status  = $add_friend_status + 1;
		} 
		
		//STEP 2: Check that a request is not already pending
		$check = mysqli_query($conn,"SELECT * FROM pending_requests WHERE request_key = '$request_key' AND request_is_pending = 1 ");
		$request_sent_count = $check->num_rows; 
	
		//Request was already sent and is pending 	
		if($request_sent_count > 0) {
			$add_friend_status  = $add_friend_status + 1;
		} 

		//STEP 3: Request is not pending and they are not friends already so create request 
		if($add_friend_status == 0) {
			
			//Part 1: Add Request to Pending Table
			$insert = $conn->prepare("INSERT INTO pending_requests (request_type, request_type_text, sent_by, sent_to, request_key, request_is_pending) 
				VALUES (?,?,?,?,?,?) ");
			$insert->bind_param('sssssi', $request_type, $request_type_text, $request_sent_from, $request_sent_to, $request_key, $request_status);
			
			//Part 2: Add Friendship to Friendship table with Pending Status
			if ($insert->execute()) {
							
				//Insert Friendship 1	
				$insert_friend_one = $conn->prepare("INSERT INTO friends(user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?, ?,?,?,?,?) ");
				$insert_friend_one->bind_param('sisiis', $request_sent_from, $request_sent_from_id, $request_sent_to, $request_sent_to_id, $request_status, $request_key);
				if ($insert_friend_one->execute()) {
					//echo "success f1";
				} else {
					$this->addFriendOutcome = 0;
					//echo "fail f1";		
				}

				//Insert Friendship 2			
				$request_key_two = $request_sent_to . $request_sent_from;
				$insert_friend_one = $conn->prepare("INSERT INTO friends(user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?, ?,?,?,?,?) ");
				$insert_friend_one->bind_param('sisiis', $request_sent_to, $request_sent_to_id, $request_sent_from, $request_sent_from_id, $request_status, $request_key_two);
				if ($insert_friend_one->execute()) {
					//echo "success f2";
				} else {
					$this->addFriendOutcome = 0;
					//echo "fail f2";		
				}
							
			//Handle Error						
			} else {
				$this->addFriendOutcome = 0;
				//echo "error";
			}	
			
			$this->addFriendOutcome = 1;	
			$this->addFriendMessage = "Friendship was added!";		
			
		//Handle Error	
		} else {
			$this->addFriendOutcome = 0;
			$this->addFriendMessage = "Request already exists or you are friends";
			//echo "Request already exists or you are friends";	
		}

		
	} 

*/
}

//Function A1: Create a New Group
async function addFriend(req, res) {
    const connection = db.getConnection(); 
    const masterSite = req.body.masterSite;
    const currentUser = req.body.currentUser;
    const friendName = req.body.addFriendName;

    var newFriendOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

    //STEP 1: Check if they are friends	
    var currentUserIdFull = await userFunctions.getUserID(currentUser)
    var friendUserIdFull = await userFunctions.getUserID(friendName) 
    var currentUserID = currentUserIdFull.userID
    var friendUserID = friendUserIdFull.userID

    var friendShipStatus = await friendFunctions.checkFriendshipStatus(currentUser, friendName);

    //STEP 2: Add Friendship to Friends Table 
    //STEP 3: Add the Notification
    //STEP 4: Add the Request

    res.json(friendShipStatus)
}

module.exports = { getUserFriends, addFriend};

