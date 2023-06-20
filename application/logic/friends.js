const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions');
const requestFunctions = require('../functions/requestFunctions');
const Friend = require('../functions/classes/Friend');


/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get All Site Users 	
	2) Function A2: Get User Friends	
	3) Function A3: Get a list of someones friends		
	4) Function A4: Get your Pending Friends Requests (They accept)	
	5) Function A5: Get your Pending Friends Invites (You can accept)

FUNCTIONS B: All Functions Related to Friends
	1) Function B1: Request a Friend	
	2) Function B2: Accept Friend Request 
	3) Function B3: Cancel a Friend	Request
	4) Function B4: Decline Friend Request

*/

/*

var newGroupOutcome = {
	groupData: {},
	message: "", 
	success: false,
	statusCode: 500,
	errors: [], 
	currentUser: req.body.currentUser
}

{
    "currentUser": "davey",
    "friendList": "sam",
    "message": "davey is looking at sam's list of friends",
    "friendsArray": [
        {
            "friendUserName": "davey",
            "friendID": 39,
            "friendUserImage": "frodo.jpg",
            "friendshipPending": 1,
            "friendStatusMessage": "This is you",
            "friendStatus": true
        }
    ]
}
*/

//FUNCTIONS A: All Functions Related to Friends 
//Function A1: Get All Site Users
async function getAllUsers(req, res) {
    const userName = req.params.user_name;

	var usersOutcome = await friendFunctions.getAllUsers()
    res.json(usersOutcome)

}


//Function A2: Get Your Friends	
async function getYourFriends(req, res) {
    const userName = req.params.user_name;

	var friendsOutcome = await friendFunctions.getUserFriends(userName)

    res.json(friendsOutcome)

}

//Function A3: Get a list of someones friends	
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

//Function A4: Get your Pending Friends Requests (They accept)
async function getPendingFriendRequests(req, res) {
	const userName = req.params.user_name;

	var pendingFriendRequestOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	var pendingFriends = await friendFunctions.getPendingFriendRequests(userName, userName)
	pendingFriendRequestOutcome.data = pendingFriends

    res.json(pendingFriendRequestOutcome.data = pendingFriends
)

}

//Function A5: Get your Pending Friends Invites (You can accept)
async function getPendingFriendInvites(req, res) {
    const userName = req.params.user_name;
	var pendingFriendsInvites = await friendFunctions.getPendingFriendInvites(userName)

    res.json(pendingFriendsInvites)

}

//Function A6: Get all Site Users with Friendship Status 
async function getAllUsersWithFriendship(req, res) {
    const userName = req.params.user_name;

	var allUsersOutcome = await friendFunctions.getAllUsers()
	var yourFriendsOutcome = await friendFunctions.getUserFriends(userName);
	
	var allUsersArray = allUsersOutcome.userArray;
	var yourFriendsArray = yourFriendsOutcome.friendsArray;

	//STEP 1: Create a Set of your friends
	var yourFriendsSet = new Set();

	for (let i = 0; i < yourFriendsArray.length ; i++) {
		yourFriendsSet.add(yourFriendsArray[i].friendUserName.toLowerCase())
	}	


	//STEP 2: Check this set for friend Matches
	for (let i = 0; i < allUsersArray.length ; i++) {
		let tempUser = allUsersArray[i].userName.toLowerCase();

		//TYPE 1: Currently Friends 
		if(yourFriendsSet.has(tempUser)) { 
			allUsersArray[i].friendStatusMessage = "friends";
			allUsersArray[i].friendStatus = 1;
		
			//Determine pending status

		//TYPE 4: Not Friends
		} else {
			allUsersArray[i].friendStatusMessage = "not friends";
			allUsersArray[i].friendStatus = 4;
		}

		//TYPE 1: Currently Friends 
		//TYPE 2: Friendship Request Pending (them)
		//TYPE 3: Friendship Invite Pending (you)
		//TYPE 4: Not Friends
		//TYPE 5: No Data

	}


/*
		let userName = allUsersArray[i].userName.toLowerCase();

		if(yourFriendsSet.has(userName)) {
			allUsersArray[i].friendStatusMessage = "friends";
			allUsersArray[i].friendStatus = true;

			//When they match get their friend status
			const friendPendingStatus = getFriendStatus(userName, yourFriendsArray);

			//TYPE 1: Friends
			if(friendPendingStatus.friendshipPending == 0) {
				allUsersArray[i].friendStatusMessage = "You are friends";
				allUsersArray[i].friendStatus = "friends";

			} else {

				//TYPE 1: Request Pending (You invited them and it is pending their request)
				if(friendPendingStatus.sentBy.localeCompare(userName) == 0) {
					allUsersArray[i].friendStatusMessage = "Request Pending (You invited them and it is pending their request)";
					allUsersArray[i].friendStatus = "friends_request_pending_them";

				//TYPE 2: Invite Pending (They requested you and you can accept)	
				} else {
					allUsersArray[i].friendStatusMessage = "Invite Pending (They requested you and you can accept)";
					allUsersArray[i].friendStatus = "friends_request_pending_you";
				}

			}

		} else if(userName.toLowerCase().localeCompare(allUsersArray[i].userName.toLowerCase()) == 0 ) {
			allUsersArray[i].friendStatusMessage = "This is you";
			allUsersArray[i].friendStatus = "not_friends";
		}
		else {
			allUsersArray[i].friendStatusMessage = "not friends";
			allUsersArray[i].friendStatus = "not_friends";
		}
	}

	*/
	res.json(allUsersArray)

}

function getFriendStatus(friendName, yourFriendsArray) {
	for (let i = 0; i < yourFriendsArray.length ; i++) {
     	//console.log(yourFriendsArray[i].friendUserName + " | " +  friendName)
		if(yourFriendsArray[i].friendUserName.localeCompare(friendName) == 0) {
			return yourFriendsArray[i];
		}
	}

}

//FUNCTIONS B: All Functions Related to Friends Actions
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
    const sentBy = req.body.currentUser;
    const sentTo = req.body.addFriendName;

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
		let friendOutcomeOne = await Friend.inviteFriend(sentBy, sentTo, currentUser, currentUserID, friendName, friendUserID);
		let friendOutcomeTwo = await Friend.inviteFriend(sentBy, sentTo, friendName, friendUserID, currentUser, currentUserID);

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

//Function B2: Accept Friend Request 
async function acceptFriendRequest(req, res) {
    const connection = db.getConnection(); 
    const masterSite = req.body.masterSite;
    const currentUser = req.body.userName;
    const friendName = req.body.friendName;

    var acceptFriendOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}
	//STEP 1: Confirm there is a Pending Request
	var requestStatus = await requestFunctions.getRequestStatus(friendName, currentUser, "friend_request");
	console.log("STEP 1: Confirm there is a Pending Request")
	console.log(requestStatus)

	//STEP 2: Confirm there is a Friendship Pending
	var inviteStatus = await friendFunctions.getSingleInvite(currentUser, friendName);
	console.log("STEP 2: Confirm there is a Friendship Pending")
	console.log(inviteStatus)
	
	//If there is a request 
	if(inviteStatus.inviteExists == true) {

		//STEP 3: Update Friendship
		let friendshipAddedOutcome = await Friend.acceptFriendInvite(currentUser, friendName) 
		console.log("STEP 3: Update Friendship")
		console.log(friendshipAddedOutcome)

		//STEP 4: Update Request
		var updateRequestStatus = await requestFunctions.updateRequestStatus("friend_request", friendName, currentUser);
		console.log("STEP 4: Update Request");
		console.log(updateRequestStatus);

		//STEP 5: Create a New Notification
		const notification = {
			masterSite: "kite",
			notificationFrom: currentUser,
			notificationMessage: currentUser + " accepted your friend request!",
			notificationTo: friendName,
			notificationLink: "req.body.notificationLink",
			notificationType: "friend_request",
			groupID: 0
		}

		Notification.createSingleNotification(notification);

		//STEP 6: Mark original Notification as Seen
		Notification.removeNotification("friend_request", currentUser, friendName);

		acceptFriendOutcome.message = currentUser + " accepted a friend request from " + friendName;
		acceptFriendOutcome.success = true
		acceptFriendOutcome.statusCode = 200

	} else {
		acceptFriendOutcome.success = true
		acceptFriendOutcome.statusCode = 200
		acceptFriendOutcome.message = "The friendship was already accepted"
	}
	console.log(acceptFriendOutcome)
    res.json(acceptFriendOutcome)
}

//Function B3: Cancel a Friend	Request
//Function B4: Decline Friend Request










//ORGANIZE

//Function A3: Get a list of friend Requests (You can accept)


//Function A4: Get A list of all the people you have invited to be your friend (They accept)



//Function A3: Get User Friends
//http://localhost:3003/user/davey/friend/sam



//FUNCTIONS B: All Functions Related to Friends
//Function B1: Request a Friend	
//Function B2: Accept Friend Request
//Function B3: Cancel a Friend	Request
//Function B4: Decline Friend Request

//Function B1: Request a Friend	


//Function B1: Accept a Friend	


module.exports = { getAllUsers, getYourFriends, getPendingFriendInvites, getPendingFriendRequests, getUserFriends, getAllUsersWithFriendship, addFriend, acceptFriendRequest};






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