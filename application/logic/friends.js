const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions');
const requestFunctions = require('../functions/requestFunctions');
const notifications = require('./notifications');
const Friend = require('../functions/classes/Friend');


/*
FUNCTIONS A: All Functions Related to Friends 
	1) Function A1: Get All Site Users	
	2) Function A2: Get Your Friends	
	3) Function A3: Get All Your Friends (Active and Pending)	
	4) Function A4: Get your Pending Friends Requests (They accept)	
	5) Function A5: Get your Pending Friends Invites (You can accept)
	6) Function A6: Get a list of someones friends with Friendship Status
	7) Function A7: Get all Site Users with Friendship Status 

FUNCTIONS B: All Functions Related to Friends
	1) Function B1: Request a Friend	
	2) Function B2: Cancel a Friend	Request	
	3) Function B3: Accept Friend Request 
	4) Function B4: Decline Friend Request
	5) Function B4: Remove a Friend

*/


//FUNCTIONS A: All Functions Related to Friends 
//Function A1: Get All Site Users
async function getAllUsers(req, res) {
    const userName = req.params.user_name;

	var usersOutcome = await friendFunctions.getAllUsers()
    res.json(usersOutcome)

}

//Function A2: Get Your Friends (Active only)
async function getActiveFriends(req, res) {
    const userName = req.params.user_name;

	var currentUserfriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: userName
	}

	//var friendsOutcome = await friendFunctions.getUserFriends(userName)
	var friendsOutcome = await friendFunctions.getActiveFriends(userName)
 
	currentUserfriendsOutcome.data = friendsOutcome.friendsArray;
	currentUserfriendsOutcome.message = "We got your friends!"
	currentUserfriendsOutcome.success = true
	currentUserfriendsOutcome.statusCode = 200

    res.json(currentUserfriendsOutcome)
	
}

//Function A3: Get All Your friends (Active and Pending Requests and Pending Invites)
async function getAllFriends(req, res) {
    const userName = req.params.user_name;

	var currentUserfriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: userName
	}

	//var friendsOutcome = await friendFunctions.getUserFriends(userName)
	var friendsOutcome = await friendFunctions.getAllUserFriends(userName)
	currentUserfriendsOutcome.data = friendsOutcome.friendsArray;
	currentUserfriendsOutcome.message = "We got your friends!"
	currentUserfriendsOutcome.success = true
	currentUserfriendsOutcome.statusCode = 200

    res.json(currentUserfriendsOutcome)
	
}

//Function A4: Get your Pending Friends Requests (They accept)
async function getPendingFriendRequests(req, res) {
	const currentUser = req.params.user_name;

	var pendingFriendRequestOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

	var pendingFriends = await friendFunctions.getPendingFriendRequests(currentUser, currentUser)
	pendingFriendRequestOutcome.data = pendingFriends

    res.json(pendingFriendRequestOutcome);

}

//Function A5: Get your Pending Friends Invites (You can accept)
async function getPendingFriendInvites(req, res) {
    const currentUser = req.params.user_name;

	var pendingFriendsInvites = await friendFunctions.getPendingFriendInvites(currentUser)

	var pendingFriendInvitesOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}
	pendingFriendInvitesOutcome.data = pendingFriendsInvites.friendInvites

    res.json(pendingFriendInvitesOutcome);


}

//Function A6: Get a list of someones friends with Friendship Status
async function getAnotherUsersFriends(req, res) {
    const currentUser = req.params.user_name;
    const friendName = req.params.friend_name;
	console.log(currentUser + " " + friendName)

	var userFriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}
	

	//STEP 1: Get your Friends
	var yourFriendsOutcome = await friendFunctions.getAllUserFriends(currentUser)
	var yourFriendsArray = yourFriendsOutcome.friendsArray;
	//console.log("yourFriendsArray")
	//console.log(yourFriendsArray)
	//console.log("_________________")

	//STEP 2: Get their Active Friends
	var theirFriendsOutcome = await friendFunctions.getActiveFriends(friendName)
	var theirFriendsArray = theirFriendsOutcome.friendsArray;
	//console.log("theirFriendsArray")
	//console.log(theirFriendsArray)
	//console.log("_________________")

	//STEP 3: Compare Friends (MAKE THIS FUNCTION WORK FOR ANY TWO LISTS OF USERS)
	var theirFriends = await friendFunctions.compareUsersWithYourFriends(currentUser, yourFriendsArray, theirFriendsArray);
	//console.log("theirFriends")
	//console.log(theirFriends)
	//console.log("_________________")
	
	/*

	//LIKE
	"postLikeID": 93,
	"postID": 72,
	"likedByUserName": "sam",
	"likedByImage": "sam.jpg",
	"likedByFirstName": "sam gamgee",
	"likedByLastName": "sam gamgee",
	//ADD: "friendshipKey"
	"timestamp": "2023-02-21T00:42:33.000Z"

	*/	

	userFriendsOutcome.data = theirFriends;
	userFriendsOutcome.message = "We got their friends!"
	userFriendsOutcome.success = true
	userFriendsOutcome.statusCode = 200
	
	//res.json({theirFriends: theirFriends, yourFriends: yourFriends, theirFriends: theirFriends})
	res.json(userFriendsOutcome)

}

//Function A7: Get all Site Users with Friendship Status
async function getAllUsersWithFriendship(req, res) {
    const currentUser = req.params.user_name;
	var userFriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}
	
	//STEP 1: Get your Friends
	var yourFriendsOutcome = await friendFunctions.getAllUserFriends(currentUser)
	var yourFriendsArray = yourFriendsOutcome.friendsArray;
	//console.log("yourFriendsArray")
	//console.log(yourFriendsArray)
	//console.log("_________________")

	//STEP 2: Get all Users 
	var usersOutcome = await friendFunctions.getAllUsers()
	var allUsersArray = usersOutcome.userArray;
	//console.log("allUsersArray")
	//console.log(allUsersArray)
	//console.log("_________________")

	//STEP 3: Compare Friends (MAKE THIS FUNCTION WORK FOR ANY TWO LISTS OF USERS)
	var allUsersWithFriendStatus = await friendFunctions.compareUsersWithYourFriends(currentUser, yourFriendsArray, allUsersArray);
	
	userFriendsOutcome.data = allUsersWithFriendStatus;
	userFriendsOutcome.message = "We got their friends!"
	userFriendsOutcome.success = true
	userFriendsOutcome.statusCode = 200

	res.json(userFriendsOutcome)
	


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

	//NEED TO RETURN THE ADDED FRIEND FOR REACT TO UPDATE 
    const connection = db.getConnection(); 
    const masterSite = req.body.masterSite;
    const currentUserBody = req.body.currentUser;
	const currentUser = req.authorizationData.currentUser;
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


	//STEP 1: Get user IDs for both Users 
	var currentUserIdFull = await userFunctions.getUserID(currentUser)
	var friendUserIdFull = await userFunctions.getUserID(friendName)

    var currentUserID = currentUserIdFull.userID
    var friendUserID = friendUserIdFull.userID

	//Check if these match
	console.log("CURRENT USER FROM POST " + currentUserBody)
	console.log("CURRENT USER FROM TOKEN " + currentUser)
	console.log("STEP 1: Get user IDs for both Users")

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
			currentUser: currentUser,
			currentUserID: currentUserID,
			friendName: friendName,
			friendUserID: friendUserID,
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

//Function B2: Cancel a Friend Request (You sent this)
async function cancelFriendRequest(req, res) {
    const masterSite = req.body.masterSite;
    const currentUser = req.body.currentUser;
    const friendName = req.body.friendName;
	var removeFriendRequest = {}

	var removeFriendRequest = await friendFunctions.removeFriend(currentUser, friendName);
	console.log(removeFriendRequest)
	
	var cancelFriendRequestOutcome = {
		data: {},
		message: currentUser + " removed the friend request to " + friendName, 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: req.body.currentUser
	}


	cancelFriendRequestOutcome.data = removeFriendRequest.removeRequest

	res.json(cancelFriendRequestOutcome)
}

//Function B3: Accept Friend Invite (They sent this you accepted
async function acceptFriendInvite(req, res) {
    const connection = db.getConnection(); 
    const masterSite = req.body.masterSite;
    const currentUser = req.body.currentUser;
    const friendName = req.body.friendName;
	console.log(currentUser + " acceptFriendInvite from " + friendName)

    var acceptFriendOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
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
		
		let notificationExists = await notifications.checkNotificationStatus("friend_request", friendName, currentUser);
		
		Notification.createSingleNotification(notification);

		//STEP 6: Mark original Notification as Seen
		Notification.setNotificationSeen("friend_request", friendName, currentUser);

		acceptFriendOutcome.data.currentUser = currentUser
		acceptFriendOutcome.data.friendName = friendName

		acceptFriendOutcome.message = currentUser + " accepted a friend request from " + friendName;
		acceptFriendOutcome.success = true
		acceptFriendOutcome.statusCode = 200

	} else {
		acceptFriendOutcome.success = true
		acceptFriendOutcome.statusCode = 200
		acceptFriendOutcome.message = "Their is no friendship or it was already accepted"
	}
	
	console.log(acceptFriendOutcome)
    res.json(acceptFriendOutcome)
}

//Function B4: Decline Friend Invite (They sent this but you declined)
async function declineFriendInvite(req, res) {
    const masterSite = req.body.masterSite;
    const currentUser = req.body.currentUser;
    const friendName = req.body.friendName;

	var declineFriendRequestOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

	//STEP 1: Confirm there is a Pending Request
	var requestStatus = await requestFunctions.getRequestStatus(friendName, currentUser, "friend_request");
	console.log("STEP 1: Confirm there is a Pending Request")
	//console.log(requestStatus)

	//STEP 2: Confirm there is a Friendship Pending
	var inviteStatus = await friendFunctions.getSingleInvite(currentUser, friendName);
	console.log("STEP 2: Confirm there is a Friendship Pending")
	//console.log(inviteStatus)

		//If there is a request 
		if(inviteStatus.inviteExists == true) {

			//STEP 3: Decline the Request 
			var declineFriendRequest = await friendFunctions.declineFriendRequest(currentUser, friendName);
			declineFriendRequestOutcome.success = true
			declineFriendRequestOutcome.statusCode = 200
			declineFriendRequestOutcome.data.currentUser = currentUser
			declineFriendRequestOutcome.data.friendName = friendName
			declineFriendRequestOutcome.message = currentUser + " declined the friendship request from " + friendName;


		} else {
			declineFriendRequestOutcome.success = true
			declineFriendRequestOutcome.statusCode = 200
			declineFriendRequestOutcome.message = "Their is no friendship to decline"
			console.log("STEP 2: Their is no friendship to decline")
		}
	
	console.log(declineFriendRequestOutcome)
	res.json(declineFriendRequestOutcome)

}
    //Status
    /*
    1: Currently Friends
    2: Friendship Pending
    3: Not Friends
    4: No Data
    */ 

//Function B4: Decline Friend Invite (They sent this but you declined)
async function removeFriend(req, res) {
    const masterSite = req.body.masterSite;
    const currentUser = req.body.currentUser;
    const friendName = req.body.removeFriendName;

	var removeFriendRequestOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}
	
	//STEP 1: Confirm there is a Friendship
	let friendStatus = await friendFunctions.checkFriendshipStatus(currentUser, friendName);

	//Friendship Found
	if(friendStatus.friendshipStatus == 1 || friendStatus.friendshipStatus == 2) {
		let removeFriendOutcomeOne = await Friend.deleteFriend(currentUser, friendName)
		let removeFriendOutcomeTwo = await Friend.deleteFriend(friendName, currentUser)

		//Success
		if(removeFriendOutcomeOne.friendRemoved == true && removeFriendOutcomeTwo.friendRemoved == true) {
			let friendship = {
				currentUser: currentUser,
				friendName: friendName
			}
			removeFriendRequestOutcome.data = friendship;
			removeFriendRequestOutcome.success = true;
			removeFriendRequestOutcome.statusCode = 200;
			removeFriendRequestOutcome.message = "Friendship removed for " + currentUser + " and " + friendName;
		//Error
		} else {
			removeFriendRequestOutcome.message = "Friendship found for " + currentUser + " and " + friendName + " but error removing";
			removeFriendRequestOutcome.errors = removeFriendOutcomeOne.errors;
		}
 
	//No Friendship
	} else {
		removeFriendRequestOutcome.message = "No friends found for " + currentUser + " and " + friendName;
	}
	
	res.json(removeFriendRequestOutcome)

}


module.exports = { getAllUsers, getActiveFriends, getAllFriends, getPendingFriendRequests, getPendingFriendInvites, addFriend, acceptFriendInvite, cancelFriendRequest, declineFriendInvite, removeFriend, getAnotherUsersFriends, getAllUsersWithFriendship }











//APPENDIX
//module.exports = { getAllUsers, getAllYourFriends, getYourFriends, getPendingFriendInvites, getPendingFriendRequests, getUserFriends, getAllUsersWithFriendship, addFriend, acceptFriendRequest};
//module.exports = { getAllUsers, getYourActiveFriends, getAllYourFriends, getPendingFriendRequests, getPendingFriendInvites, getBasicUserFriends, getAnotherUsersFriends, getAllUsersWithFriendship, addFriend, acceptFriendRequest, cancelFriendRequest, declineFriendRequest};

/*

//Function A7: Get all Site Users with Friendship Status 
async function getAllUsersWithFriendship(req, res) {
    const currentUser = req.params.user_name;
    const friendName = "sam";

	var allUsersOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

	
	//STEP 1: Get your Friends
	var yourFriendsOutcome = await friendFunctions.getAllUserFriends(currentUser)
	var yourFriendsArray = yourFriendsOutcome.friendsArray;

	//STEP 2: Get their Friends
	var theirFriendsOutcome = await friendFunctions.getUserFriends(friendName)
	var theirFriendsArray = theirFriendsOutcome.friendsArray;

	console.log("theirFriendsArray")
	console.log(theirFriendsArray)

	var AllUsersRaw = await friendFunctions.getAllUsers()
	var allUsersArray = AllUsersRaw.userArray;

	console.log("allUsersArray")
	console.log(allUsersArray)

	//STEP 3: Compare Friends
	var allUsersWithFriendshipStatus = await friendFunctions.compareUsersWithYourFriends(currentUser, yourFriendsArray, allUsersArray);
	
	allUsersOutcome.data = allUsersWithFriendshipStatus;
	allUsersOutcome.message = "We got everyone!!"
	allUsersOutcome.success = true
	allUsersOutcome.statusCode = 200
	
	//res.json({theirFriends: theirFriends, yourFriends: yourFriends, theirFriends: theirFriends})
	res.json(allUsersOutcome)

	
    const userName = req.params.user_name;

	var allUsersOutcome = await friendFunctions.getAllUsers()
	var yourFriendsOutcome = await friendFunctions.getUserFriends(userName);
	
	var allUsersArray = allUsersOutcome.userArray;
	var yourFriendsArray = yourFriendsOutcome.friendsArray;

	//var usersOutcome = await friendFunctions.compareUsersWithYourFriends(userName, yourFriendsArray, allUsersArray)
	var usersOutcome = {}

	res.json(usersOutcome)
	
	

}
*/

/*
async function temp() {
	const currentUser = req.params.user_name;
    const friendName = req.params.friend_name;
	console.log(currentUser + " " + friendName)

	var userFriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}
	

	//STEP 1: Get your Friends
	var yourFriendsOutcome = await friendFunctions.getAllUserFriends(currentUser)
	var yourFriendsArray = yourFriendsOutcome.friendsArray;
	//console.log("yourFriendsArray")
	//console.log(yourFriendsArray)
	//console.log("_________________")

	//STEP 2: Get their Active Friends
	var theirFriendsOutcome = await friendFunctions.getActiveFriends(friendName)
	var theirFriendsArray = theirFriendsOutcome.friendsArray;
	//console.log("theirFriendsArray")
	//console.log(theirFriendsArray)
	//console.log("_________________")

	//STEP 3: Compare Friends (MAKE THIS FUNCTION WORK FOR ANY TWO LISTS OF USERS)
	var allUsersWithFreindStatus = await friendFunctions.compareUsersWithYourFriends(currentUser, yourFriendsArray, theirFriendsArray);
	//console.log("theirFriends")
	//console.log(theirFriends)
	//console.log("_________________")
	

	userFriendsOutcome.data = allUsersWithFreindStatus;
	userFriendsOutcome.message = "We got their friends!"
	userFriendsOutcome.success = true
	userFriendsOutcome.statusCode = 200
	
	//res.json({theirFriends: theirFriends, yourFriends: yourFriends, theirFriends: theirFriends})
	res.json(userFriendsOutcome)

}
*/
//Function A6: Get a list of someones friends 
/*
async function getBasicUserFriends(req, res) {
    const userName = req.params.friend_name;

	var currentUserfriendsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: userName
	}

	//var friendsOutcome = await friendFunctions.getUserFriends(userName)
	var friendsOutcome = await friendFunctions.getUserFriends(userName)
	currentUserfriendsOutcome.data = friendsOutcome.friendsArray;
	currentUserfriendsOutcome.message = "We got their friends!"
	currentUserfriendsOutcome.success = true
	currentUserfriendsOutcome.statusCode = 200

    res.json(currentUserfriendsOutcome)
	
}
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

      {
            "friendName": "pippin",
            "friendImage": "frodo.jpg",
            "firstName": "Pippin Brandybuck",
            "lastName": "Pippin Brandybuck",
            "friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
			"friendType": 1
			"friendStatus": "friends"
			"friendStatusMessage": "You are Currently Friends" 
        },

*/
/*
//TYPE 1: You are Currently Friends - "friends"
//TYPE 2: Friendship Request Pending (them) - "request_pending"
//TYPE 3: Friendship Invite Pending (you) - "invite_pending"
//TYPE 4: Not Friends - "not_friends"
//TYPE 5: This is you - "you"

*/
/*
"userName": "vasquezd",
"imageName": "12.jpg",
"firstName": "David",
"lastName": "Vasquez",
"biography": "My Biography"

"friendName": "Frodo",
"friendImage": "Frodo.jpg",
"firstName": "frodo v",
"lastName": "frodo v",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
"requestPending": 1,
"requestSentBy": "frodo"


"friendName": "pippin",
"friendImage": "frodo.jpg",
"firstName": "Pippin Brandybuck",
"lastName": "Pippin Brandybuck",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
"friendType": 1
"friendStatus": "friends"
"friendStatusMessage": "You are Currently Friends" 


*/
/*
//TYPE 1: You are Currently Friends - "friends"
//TYPE 2: Friendship Request Pending (them) - "request_pending"
//TYPE 3: Friendship Invite Pending (you) - "invite_pending"
//TYPE 4: Not Friends - "not_friends"
//TYPE 5: This is you - "you"
*/

/*
var currentUserfriendsOutcome = {
	data: {},
	message: "", 
	success: false,
	statusCode: 500,
	errors: [], 
	currentUser: userName
}

var friendsOutcome = await friendFunctions.getUserFriends(userName)



//MODIFY WITH THIS 
//Standard Function?
//CLEAN THIS 
let friendsArray = friendsOutcome.friendsArray
for (let i = 0; i < friendsArray.length; i++) {
	console.log(friendsArray[i])
	if(friendsArray[i].requestPending == 0) {
		friendsArray[i].friendType = 1;
		friendsArray[i].friendStatus = "friends";
		friendsArray[i].friendStatusMessage = "You are Currently Friends";

	} else if(friendsArray[i].requestPending == 1){
		
		//TYPE 2: Friendship Request Pending (them)
	
		if(friendsArray[i].requestSentBy.toLowerCase().localeCompare(userName.toLowerCase()) == 0) {
			friendsArray[i].friendType = 2
			friendsArray[i].friendStatusMessage = "Friendship Request Pending (them)";
			friendsArray[i].friendStatusCode = "request_pending";

		//TYPE 3: Friendship Invite Pending (you)
		} else {
			friendsArray[i].friendStatus = 3;
			friendsArray[i].friendStatusMessage = "They invited you: Friendship Invite Pending (you)";
			friendsArray[i].friendStatusCode = "invite_pending";
			
		}


	} else {

	}
}

currentUserfriendsOutcome.data = friendsOutcome.friendsArray;
currentUserfriendsOutcome.message = "We got your friends!"
currentUserfriendsOutcome.success = true
currentUserfriendsOutcome.statusCode = 200

*/

/*

	var friendsOutcome = await friendFunctions.getCurrentUserFriends(userName)

	//MODIFY WITH THIS 
	//Standard Function?
	//CLEAN THIS 
	let friendsArray = friendsOutcome.friendsArray
	for (let i = 0; i < friendsArray.length; i++) {
		console.log(friendsArray[i])
		if(friendsArray[i].requestPending == 0) {
			friendsArray[i].friendType = 1;
			friendsArray[i].friendStatus = "friends";
			friendsArray[i].friendStatusMessage = "You are Currently Friends";

		} else if(friendsArray[i].requestPending == 1){
			
			//TYPE 2: Friendship Request Pending (them)
		
			if(friendsArray[i].requestSentBy.toLowerCase().localeCompare(userName.toLowerCase()) == 0) {
				friendsArray[i].friendType = 2
				friendsArray[i].friendStatusMessage = "Friendship Request Pending (them)";
				friendsArray[i].friendStatusCode = "request_pending";
	
			//TYPE 3: Friendship Invite Pending (you)
			} else {
				friendsArray[i].friendStatus = 3;
				friendsArray[i].friendStatusMessage = "They invited you: Friendship Invite Pending (you)";
				friendsArray[i].friendStatusCode = "invite_pending";
				
			}


		} else {

		}
	}

	currentUserfriendsOutcome.data = friendsOutcome.friendsArray;
	currentUserfriendsOutcome.message = "We got your friends!"
	currentUserfriendsOutcome.success = true
	currentUserfriendsOutcome.statusCode = 200


    res.json(currentUserfriendsOutcome)

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

//Function A6: Get a list of someones friends 
async function getUserFriendsOLD(req, res) {
    const userName = req.params.user_name;
    const friendName = req.params.friend_name;


	//Get Someone's friends
	//Find out the status of if they are your friend

	
	/*
	friendOutcome = {
		currentUser: userName,
		friendList: friendName,
		message: userName + " is looking at " + friendName + "'s list of friends",
	}



	var userFriendsOutcome = await friendFunctions.getUserFriends(friendName);
	var userFriendsArray = userFriendsOutcome.friendsArray;
	console.log(userFriendsArray)

	var yourFriendsOutcome = await friendFunctions.getUserFriends(userName);
	var yourFriendsArray = yourFriendsOutcome.friendsArray;
	console.log(yourFriendsArray)

	var usersOutcome = await friendFunctions.compareUsersWithYourFriends(userName, yourFriendsArray, userFriendsArray)
	*/


	/*
	var yourFriendsOutcome = await friendFunctions.getUserFriends(userName);
	var yourFriendsArray = yourFriendsOutcome.friendsArray;

	var userFriendsOutcome = await friendFunctions.getUserFriends(friendName);
	var userFriendsArray = userFriendsOutcome.friendsArray;

	var userFriendsOutcome = await friendFunctions.compareUsersWithYourFriends(userName, yourFriendsArray, userFriendsArray)
	*/


	/*

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
	*/


	//friendOutcome.friendsArray = userFriendsOutcome;

    res.json(userFriendsOutcome)

}
