const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions');
const Friend = require('../functions/classes/Friend');


/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get All Site Users 	
	2) Function A2: Get User Friends	

FUNCTIONS B: All Functions Related to Friends
	1) Function B1: Request a Friend	
	2) Function B2: Cancel a Friend	Request
	3) Function B3: Accept Friend Request
	4) Function B4: Decline Friend Request

*/
/*
    var newGroupOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

*/

//FUNCTIONS A: All Functions Related to Friends 
//Function A1: Get All Site Users 	
async function getAllUsers(req, res) {
    const userName = req.params.user_name;

	var usersOutcome = await friendFunctions.getAllUsers()

    res.json(usersOutcome)

}

//Function A2: Get User Friends
async function getYourFriends(req, res) {
    const userName = req.params.user_name;

	var friendsOutcome = await friendFunctions.getUserFriends(userName)

    res.json(friendsOutcome)

}

//Function A3: Get User Friends
//http://localhost:3003/user/davey/friend/sam
async function getUserFriends(req, res) {
    const userName = req.params.user_name;
    const friendName = req.params.friend_name;

	friendOutcome = {
		currentUser: userName,
		friendList: friendName,
		message: userName + " is looking at " + friendName + "'s list of friends",
	}

	var yourFriendsOutcome = await friendFunctions.getUserFriends(userName);
	var userFriendsOutcome = await friendFunctions.getUserFriends(friendName);
	var yourFriendsOutcomeArray = yourFriendsOutcome.friendsArray;
	var userFriendsOutcomeArray = userFriendsOutcome.friendsArray;


	//STEP 1: Create a Set of your friends
	const yourFriendsSet = new Set();
	for (let i = 0; i < yourFriendsOutcomeArray.length ; i++) {
		console.log(yourFriendsOutcomeArray[i].friendUserName.toLowerCase());
		yourFriendsSet.add(yourFriendsOutcomeArray[i].friendUserName.toLowerCase())
	}	

	//STEP 2: Check this set for friend Matches
	for (let i = 0; i < userFriendsOutcomeArray.length ; i++) {
		if(yourFriendsSet.has(userFriendsOutcomeArray[i].friendUserName.toLowerCase())) {
			userFriendsOutcomeArray[i].friendStatusMessage = "friends";
			userFriendsOutcomeArray[i].friendStatus = true;
		} else if(userName.toLowerCase().localeCompare(userFriendsOutcomeArray[i].friendUserName.toLowerCase()) == 0 ) {
			userFriendsOutcomeArray[i].friendStatusMessage = "This is you";
			userFriendsOutcomeArray[i].friendStatus = true;
		}
		else {
			userFriendsOutcomeArray[i].friendStatusMessage = "not friends";
			userFriendsOutcomeArray[i].friendStatus = false;
		}
	}

	var friendShipStatus = await friendFunctions.checkFriendshipStatus(userName, friendName);

	//Also send the current Profile maybe or this could be on being on their page..
	console.log(friendShipStatus)


	friendOutcome.friendsArray = userFriendsOutcomeArray;

    res.json(friendOutcome)

}





//FUNCTIONS B: All Functions Related to Friends
//Function B1: Request a Friend	
//Function B2: Cancel a Friend	Request
//Function B3: Accept Friend Request
//Function B4: Decline Friend Request

//Function B1: Request a Friend	
async function addFriend(req, res) {
	//Status
	/*
	1: Currently Friends
	2: Friendship Pending
	3: Not Friends
	4: No Data
	*/ 
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


	//CHECK HERE NO USER YO DOG CANT BE FRIENDS 
	var currentUserIdFull = await userFunctions.getUserID(currentUser)
	var friendUserIdFull = await userFunctions.getUserID(friendName)

    var currentUserID = currentUserIdFull.userID
    var friendUserID = friendUserIdFull.userID

	//console.log(currentUserIdFull,currentUserID, friendUserIdFull, friendUserID)
	//STEP 2: Check if they are friends	
    var friendShipStatus = await friendFunctions.checkFriendshipStatus(currentUser, friendName);

    //STEP 3: Add Friendship to Friends Table 
	//Status 1: Currently Friends
	if(friendUserIdFull.userFound == false) {
		newFriendOutcome.message = "Status: No user found";

	} else if(friendShipStatus.friendshipStatus == 1){
		newFriendOutcome.message = "Status 1: Currently Friends";

	//Status 2: Friendship Pending	
	} else if(friendShipStatus.friendshipStatus == 2){
		newFriendOutcome.message = "Status 2: Friendship Pending";	

	//Status 3: Not currently Friends so add Friend	
	} else if(friendShipStatus.friendshipStatus == 3) {
		newFriendOutcome.statusCode = 200;
		newFriendOutcome.success = true;
		newFriendOutcome.message = "Status 3: Adding your friend!";	

		//Add Friendship One
		let friendOutcomeOne = await Friend.inviteFriend(currentUser, currentUserID, friendName, friendUserID);
		let friendOutcomeTwo = await Friend.inviteFriend(friendName, friendUserID, currentUser, currentUserID);

		//Add Friendship Two
	 	newFriendOutcome.data = {
			friendOutcomeOne: friendOutcomeOne,
			friendOutcomeTwo: friendOutcomeTwo
		}

		if(friendOutcomeOne.userAdded == true && friendOutcomeTwo.userAdded == true) {

			//STEP 4: Add the Notification
			notification = {
				masterSite: "kite",
				notificationFrom: currentUser,
				notificationMessage: currentUser + " added you as a friend!",
				notificationTo: friendName,
				notificationLink: "req.body.notificationLink",
				notificationType: "friend_request",
				groupID: 0
			}
	
			Notification.createSingleNotification(notification);
	

			//STEP 5: Add the Request
			const newRequest = {
				requestType: "friend_request",
				requestTypeText: currentUser + " invited you to be friends",
				sentBy: currentUser,
				sentTo: friendName,
				groupID: 0
			}
	
			Requests.newSingleRequest(newRequest) 

		}

	//Status 4: No data or error	
	} else { 
		newFriendOutcome.message = "Status 4: Somethin wrong dude!";
	}

    res.json(newFriendOutcome)
}

module.exports = { getAllUsers, getYourFriends, getUserFriends, addFriend};


/*
function temp() {
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


}
*/