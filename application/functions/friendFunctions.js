const db = require('./conn');
const userFunctions = require('./userFunctions');
const functions = require('./functions');
const Friend = require('./classes/Friend');
const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');

//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to getting Friends 
	1) Function A1: Get all Users
    2) Function A2: Get Your Friends
    3) Function A3: Get All Your Friends (Active, Pending, Requested)
	4) Function A4: Get your Pending Friends Requests (They accept)	
	5) Function A5: Get your Pending Friends Invites (You can accept)

FUNCTIONS B: All Functions Related to Friends  
	1) Function B1: Compare a group of users with your friends 
	2) Function B2: Get a Single Friend Invite
	3) Function B3: Get Friendship Status


FUNCTIONS C: All Functions Related to Following  
	1) Function C1: Check if you are following a user 
	2) Function C2: Compare your followers with a list of someone elses followers

*/

//TYPE 1: You are Currently Friends - "friends"
//TYPE 2: Friendship Invite Pending (you) - "invite_pending"
//TYPE 3: Friendship Request Pending (them) - "request_pending"
//TYPE 4: Not Friends - "not_friends"
//TYPE 5: This is you - "you"

//FUNCTIONS C: All Functions Related to Following  
//Function C1: Check if you are following a user 
//Function C2: Compare your followers with a list of someone elses followers


//FUNCTIONS A: All Functions Related to getting Friends 
//Function A1: Get all Users
async function getAllUsers() {
    const connection = db.getConnection(); 
    const accountActive = 1

    var allUsersOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT * FROM user_profile WHERE account_active = ?"	
            
            connection.query(queryString, [accountActive], (err, rows) => {
                const userArray = rows.map((row) => {
                    return {
                        friendName: row.user_name,
                        userName: row.user_name,
                        imageName: row.image_name,
                        firstName: row.first_name,
                        lastName: row.last_name,
                        biography: row.biography
                    }
                });
                
                allUsersOutcome.userArray = userArray;

                if (!err) {
                    resolve(allUsersOutcome); 

                } else {
                    allUsersOutcome.outcome = 500;
                    resolve(allUsersOutcome);
                }
            })
        } catch(err) {
            allUsersOutcome.outcome = 500;
            reject(allUsersOutcome);
        } 
    })
}

//Function A2: Get a users Active Friends
async function getActiveFriends(currentUser) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.image_url, user_profile.first_name, user_profile.last_name , user_profile.biography FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1 AND friends.request_pending = 0"
            connection.query(queryString, [currentUser], (err, rows) => {
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}

                    currentFriend.friendID = rows[i].friend_id;
                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_url;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;
                    currentFriend.friendBiography = rows[i].biography;
                    currentFriend.requestPending = rows[i].request_pending;;
                    currentFriend.requestSentBy = rows[i].sent_by;
                    currentFriend.friendshipKey = "friends"

                    friendsArray.push(currentFriend)

                  } 

                if (!err) {
                    //console.log(err)
                    userFriendsOutcome.friendsArray = friendsArray
                    resolve(userFriendsOutcome); 

                } else {
                    userFriendsOutcome.outcome = 500;
                    resolve(userFriendsOutcome);
                }
            })
        } catch(err) {
            //console.log(err)
            userFriendsOutcome.outcome = 500;
            reject(userFriendsOutcome);
        } 
    })
    
}

//Function A3: Get All Your Friends (Active, Pending, Requested)
async function getAllUserFriends(currentUser) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.image_url, user_profile.first_name, user_profile.last_name, user_profile.biography FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1"
            connection.query(queryString, [currentUser], (err, rows) => {
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}

                    currentFriend.friendID = rows[i].friend_id;
                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_url;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;
                    currentFriend.friendBiography = rows[i].biography;
                    currentFriend.requestPending = rows[i].request_pending;
                    currentFriend.requestSentBy = rows[i].sent_by;
                    
                    let friendshipKey = getFriendshipKey(currentUser, rows[i].sent_by, rows[i].request_pending, rows[i].user_name);
                    currentFriend.friendshipKey = friendshipKey;
                    currentFriend.alsoYourFriend = 1;

                    friendsArray.push(currentFriend)
                    
                  } 

                userFriendsOutcome.friendsArray = friendsArray;

                if (!err) {
                    //console.log(err)
                    resolve(userFriendsOutcome); 

                } else {
                    userFriendsOutcome.outcome = 500;
                    resolve(userFriendsOutcome);
                }
            })
        } catch(err) {
            //console.log(err)
            userFriendsOutcome.outcome = 500;
            reject(userFriendsOutcome);
        } 
    })
}

//Function A4: Get your Pending Friends Requests (They accept)	
async function getPendingFriendRequests(sentBy, userName) {
    const connection = db.getConnection(); 

    var friendRequestOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
           const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name AS friend_user_name, user_profile.image_name AS friend_image_name, user_profile.first_name, user_profile.last_name, user_profile.biography, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to  WHERE friends.request_pending = 1 AND (friends.sent_by = ?) AND (friends.user_name != ?) AND user_profile.account_active = 1"

            connection.query(queryString, [sentBy, userName], (err, rows) => {
                const friendsArray = rows.map((row) => {
                    return {
                        friendUserName: row.friend_user_name,
                        friendImage: row.friend_image_name,  
                        firstName: row.first_name,
                        lastName: row.last_name,
                        friendBiography: row.biography,
                        requestPending: row.request_pending,
                        requestSentBy: row.sent_by,
                        friendshipKey: "request_pending"
             
                    }
                });
                
                friendRequestOutcome.success = true;
                friendRequestOutcome.friendsArray = friendsArray;

                if (!err) {
                    resolve(friendRequestOutcome); 

                } else {
                    friendRequestOutcome.outcome = 500;
                    resolve(friendRequestOutcome);
                }
            })
        } catch(err) {
            friendRequestOutcome.outcome = 500;
            reject(friendRequestOutcome);
        } 
    })
}

//Function A5: Get your Pending Friends Invites (You can accept)
async function getPendingFriendInvites(currentUser) {
    const connection = db.getConnection(); 

    var pendingFriendInvitesOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            //const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active, user_profile.first_name, user_profile.last_name, user_profile.biography, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to WHERE friends.request_pending = 1 AND (friends.sent_to = ?) AND (friends.user_name != ?)AND user_profile.account_active = 1"
            const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active, user_profile.first_name, user_profile.last_name, user_profile.biography, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_by WHERE friends.request_pending = 1 AND (friends.sent_to = ?) AND (friends.user_name != ?) AND user_profile.account_active = 1"

            connection.query(queryString, [currentUser, currentUser], (err, rows) => {
                const friendInvites = rows.map((row) => {
                    return {
                        //sentTo: row.sent_to,
                        //sentBy: row.sent_by,                        
                        //sentByImage: row.friend_image_name     
                        friendUserName: row.friend_user_name,
                        friendImage: row.friend_image_name,  
                        firstName: row.first_name,
                        lastName: row.last_name,
                        friendBiography: row.biography,
                        requestPending: row.request_pending,
                        requestSentBy: row.sent_by,
                        friendshipKey: "request_pending"
                    }
                });
                
                pendingFriendInvitesOutcome.success = true;
                pendingFriendInvitesOutcome.friendInvites = friendInvites;

                if (!err) {
                    resolve(pendingFriendInvitesOutcome); 

                } else {
                    pendingFriendInvitesOutcome.outcome = 500;
                    resolve(pendingFriendInvitesOutcome);
                }
            })
        } catch(err) {
            pendingFriendInvitesOutcome.outcome = 500;
            reject(pendingFriendInvitesOutcome);
        } 
    })
}

//Function A6: Check if Users are Friends (Used for adding a friend)
//NEEDS FIX
async function checkFriendshipStatus(currentUser, userFriend) {
    //TYPE 1: You are Currently Friends - "friends"
    //TYPE 2: Friendship Invite Pending (you) - "invite_pending"
    //TYPE 3: Friendship Request Pending (them) - "request_pending"
    //TYPE 4: Not Friends - "not_friends"
    //TYPE 5: This is you - "you"
    //Status
    /*
    1: Currently Friends
    2: Friendship Invite Pending
    3: Friendship Request Pending
    4: Not Friends
    5: This is you
    */ 
    var friendKey = currentUser + "" + userFriend;
    var friendKeyTwo = userFriend + "" + currentUser;
   
    //var friendKey = "vasquezdmatt";
    //var friendKeyTwo = "vasquezdmat";
    
    const connection = db.getConnection();

    var friendshipOutcome = {
        currentFriendship: "",
        friendshipStatus: 4,
		errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT * FROM friends WHERE friend_key = ? OR friend_key = ?"			
            
            connection.query(queryString, [friendKey, friendKeyTwo], (err, rows) => {
                if (!err) {  
                    
                    //Determine friendship status
                    if(rows.length >= 1){
                        if(rows[0].request_pending > 0) {
                            //A Request or an Invite is Pending
                            if(functions.compareStrings(currentUser,rows[0].sent_by) == true){
                                friendshipOutcome.currentFriendship = "invite_pending"
                                friendshipOutcome.friendshipStatus = 2
                            } else {
                                friendshipOutcome.currentFriendship = "request_pending"
                                friendshipOutcome.friendshipStatus = 3
                            }
                        } else {
                            //friendshipOutcome.friendshipStatus = 1
                            friendshipOutcome.currentFriendship = "friends"
                            friendshipOutcome.friendshipStatus = 1
                        }

                    //No friendship found in database
                    } else {
                        friendshipOutcome.currentFriendship = "not_friends"
                        friendshipOutcome.friendshipStatus = 4
					}

                    //Check if this is you
                    if(functions.compareStrings(currentUser,userFriend) == true){
                        friendshipOutcome.currentFriendship = "you"
                        friendshipOutcome.friendshipStatus = 5
                    }
                
                    resolve(friendshipOutcome); 
                } else {
                    friendshipOutcome.errors.push(err)
                    resolve(friendshipOutcome);
                }
            })
        } catch(err) {
            friendshipOutcome.errors.push(err)
            reject(friendshipOutcome);
        } 
    })
    
}

//FUNCTIONS B: All Functions Related to Friends  
//Function B1: Compare a group of users with your friends 
async function compareUsersWithYourFriends(currentUser, yourFriendsArray, theirFriendsArray) {
    //TYPE 1: You are Currently Friends - "friends"
    //TYPE 2: Friendship Invite Pending (you) - "invite_pending"
    //TYPE 3: Friendship Request Pending (them) - "request_pending"
    //TYPE 4: Not Friends - "not_friends"
    //TYPE 5: This is you - "you"
    
    //STEP 1: Create a Set of your friends
	var yourFriendsSet = new Set();

	for (let i = 0; i < yourFriendsArray.length ; i++) {
        //console.log(yourFriendsArray[i].userName)
		yourFriendsSet.add(yourFriendsArray[i].friendName.toLowerCase())
	}	

    //STEP 2: Check this set for friend Matches
	for (let i = 0; i < theirFriendsArray.length ; i++) {
		let tempUser = theirFriendsArray[i].friendName.toLowerCase();

        //This will find friend overlap
        if(yourFriendsSet.has(tempUser) || currentUser.localeCompare(tempUser) == 0) { 
            theirFriendsArray[i].alsoYourFriend = 1;
            //theirFriendsArray[i].friendshipKey = "friends";
            //console.log("Trying to find friendship status for " + currentUser + " with the user " + tempUser)
            let friendStatus = getFriendStatus(currentUser, tempUser, yourFriendsArray)
            theirFriendsArray[i].friendshipKey = friendStatus;
            //console.log(friendStatus)

        } else {
            theirFriendsArray[i].alsoYourFriend = 0;
            theirFriendsArray[i].friendshipKey = "not_friends";
        }
        
    }

    return theirFriendsArray;
}

//Function B2: Get a Single Friend Invite
async function getSingleInvite(requestSentBy, requestSentTo) {
    const connection = db.getConnection(); 

    var friendInviteOutcome = {
        inviteExists: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT * FROM friends WHERE request_pending = 1 AND sent_by = ? AND sent_to = ?"
            connection.query(queryString, [requestSentBy, requestSentTo], (err, rows) => {
                 console.log(rows)
               if(rows.length > 0) {
                    friendInviteOutcome.inviteExists = true;
                }

                if (!err) {
                    resolve(friendInviteOutcome); 
                } else {
                    friendInviteOutcome.errors.push(err)
                    resolve(friendInviteOutcome);
                }
            })
        } catch(err) {
            friendInviteOutcome.errors.push(err)
            reject(friendInviteOutcome);
        } 
    })

  
}

//Function B3: Get Friendship Status
function getFriendStatus(currentUser, friendName, yourFriendsArray) {
    if(!currentUser.toLowerCase().localeCompare(friendName.toLowerCase())) {
        return "you";
    } 

	for (let i = 0; i < yourFriendsArray.length ; i++) {
        let currentArrayFriend = yourFriendsArray[i].friendName.toLowerCase();
		if(currentArrayFriend.localeCompare(friendName.toLowerCase()) == 0) {
			return yourFriendsArray[i].friendshipKey;
		}
	}

}

//Function B4: Get Friendship Key
function getFriendshipKey(currentUser, requestSentBy, requestPending, friendName) {
    var friendKey = "not_friends"
    //TYPE 1: You are Currently Friends - "friends"
    //TYPE 2: Friendship Invite Pending (you) - "invite_pending"
    //TYPE 3: Friendship Request Pending (them) - "request_pending"
    //TYPE 4: Not Friends - "not_friends"
    //TYPE 5: This is you - "you"

    //TYPE 1: You are Currently Friends - "friends"
    if(requestPending == 0) {
        friendKey = "friends";

    } else {

        //TYPE 2: Friendship Invite Pending (you) - "invite_pending"
        if(currentUser.toLowerCase().localeCompare(requestSentBy.toLowerCase())) {
            friendKey = "invite_pending";
        //TYPE 3: Friendship Request Pending (them) - "request_pending"
        } else {
            friendKey = "request_pending";
        }

    }

    //TYPE 4: Not Friends - "not_friends"
    //This is the default 

    //TYPE 5: This is you - "you"
    if(!currentUser.toLowerCase().localeCompare(friendName.toLowerCase())) {
        friendKey = "you";
    } 

    return friendKey;


}


//Function B5: Remove a Friend 
async function removeFriend(currentUser, friendName) {
    //const connection = db.getConnection(); 
    requestType = "friend_request"
    var removeFriendOutcome = {}

    //STEP 1: Remove both friendships
    let friendRemoveOne = await Friend.deleteFriend(currentUser, friendName)
    let friendRemoveTwo = await Friend.deleteFriend(friendName, currentUser)

    //STEP 2: Remove any Requests
    let removeRequest = await Requests.deleteSingleRequest(requestType, currentUser, friendName);

    //STEP 3: Remove any Notifications
    let removeNotificationRequest = await Notifications.deleteNotification(requestType, currentUser, friendName);

    removeFriendOutcome.friendRemoveOne = friendRemoveOne;
    removeFriendOutcome.friendRemoveTwo = friendRemoveTwo;
    removeFriendOutcome.removeRequest = removeRequest;
    removeFriendOutcome.removeNotificationRequest = removeNotificationRequest;

    return removeFriendOutcome;


}

//Function B6: Decline Friend Request
async function declineFriendRequest(currentUser, friendName) {
    requestType = "friend_request"
    var removeFriendOutcome = {}

    //STEP 1: Remove both friendships
    let friendRemoveOne = await Friend.deleteFriend(currentUser, friendName)
    let friendRemoveTwo = await Friend.deleteFriend(friendName, currentUser)

    //STEP 2: Remove any Requests
    let removeRequest = await Requests.deleteSingleRequest(requestType, friendName, currentUser);

    removeFriendOutcome.friendRemoveOne = friendRemoveOne;
    removeFriendOutcome.friendRemoveTwo = friendRemoveTwo;
    removeFriendOutcome.removeRequest = removeRequest;

    return removeFriendOutcome;


}


//Function C1: Check if you are following a user 
async function checkFollowingStatus(currentUser, followName) {
    const connection = db.getConnection();

    var followOutcome = {
        isFollowing: false,
        status: "not_following", // "following", "not_following", or "self"
        errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT * FROM following WHERE user_name = ? AND following_user = ?";

            connection.query(queryString, [currentUser, followName], (err, rows) => {
                if (!err) {
                    if (functions.compareStrings(currentUser, followName)) {
                        followOutcome.status = "self";
                    } else if (rows.length > 0) {
                        followOutcome.isFollowing = true;
                        followOutcome.status = "following";
                    }

                    resolve(followOutcome);
                } else {
                    followOutcome.errors.push(err);
                    resolve(followOutcome);
                }
            })
        } catch(err) {
            followOutcome.errors.push(err);
            reject(followOutcome);
        } 
    });
}


module.exports = { getAllUsers, getActiveFriends, getAllUserFriends, getPendingFriendRequests, getPendingFriendInvites, checkFriendshipStatus, compareUsersWithYourFriends, getSingleInvite, getFriendStatus,removeFriend, declineFriendRequest, checkFollowingStatus };


//APPENDIX
/*

    //STEP 2: Check this set for friend Matches
	for (let i = 0; i < usersArray.length ; i++) {
		let tempUser = usersArray[i].userName.toLowerCase();
    	
        //STEP 3: Check if a user is friends with you 
		if(yourFriendsSet.has(tempUser)) { 
		    const friendPendingStatus = getFriendStatus(tempUser, yourFriendsArray);
            console.log(friendPendingStatus)

            //TYPE 1: Currently Friends 
            if(friendPendingStatus.friendshipPending == 0) {
                usersArray[i].friendStatusMessage = "friends";
                usersArray[i].friendStatusCode = "friends";
                usersArray[i].friendStatus = 1;

            } else {
                
                //TYPE 2: Friendship Request Pending (them)
                var requestSentBy = friendPendingStatus.requestSentBy.toLowerCase();

                if(requestSentBy.localeCompare(currentUser) == 0) {
                    usersArray[i].friendStatusMessage = "Friendship Request Pending (them)";
                    usersArray[i].friendStatusCode = "request_pending";
                    usersArray[i].friendStatus = 2;

                //TYPE 3: Friendship Invite Pending (you)
                } else {
                    usersArray[i].friendStatusMessage = "Friendship Invite Pending (you)";
                    usersArray[i].friendStatusCode = "invite_pending";
                    usersArray[i].friendStatus = 3;
                }
            }

		//TYPE 4: Not Friends
		} else {
			usersArray[i].friendStatusMessage = "not friends";
            usersArray[i].friendStatusCode = "not_friends";
			usersArray[i].friendStatus = 4;
		}
    }
    
    */

//FUNCTIONS A: All Functions Related to Friends
//Function A1: Get all User Friends

//Function A1: Get all User Friends
/*
async function getUserFriendsOLD(userName) {
    const connection = db.getConnection(); 


    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
          //const queryString = "SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1"

            connection.query(queryString, [userName], (err, rows) => {

                const friendsArray = rows.map((row) => {
                    return {
                        userName: row.user_name,
                        imageName: row.image_name,
                        firstName: row.first_name,
                        lastName: row.last_name,
                        biography: row.biography,
                        requestPending: row.request_pending,
                        requestSentBy: row.sent_by,
                        sentBy: row.sent_by,
                    }
                });
                
                userFriendsOutcome.friendsArray = friendsArray;

                if (!err) {
                    resolve(userFriendsOutcome); 

                } else {
                    userFriendsOutcome.outcome = 500;
                    resolve(userFriendsOutcome);
                }
            })
        } catch(err) {
            userFriendsOutcome.outcome = 500;
            reject(userFriendsOutcome);
        } 
    })
}
*/

 /*

    //STEP 2: Check this set for friend Matches
	for (let i = 0; i < usersArray.length ; i++) {
		let tempUser = usersArray[i].userName.toLowerCase();
    	
        //STEP 3: Check if a user is friends with you 
		if(yourFriendsSet.has(tempUser)) { 
		    const friendPendingStatus = getFriendStatus(tempUser, yourFriendsArray);
            console.log(friendPendingStatus)

            //TYPE 1: Currently Friends 
            if(friendPendingStatus.friendshipPending == 0) {
                usersArray[i].friendStatusMessage = "friends";
                usersArray[i].friendStatusCode = "friends";
                usersArray[i].friendStatus = 1;

            } else {
                
                //TYPE 2: Friendship Request Pending (them)
                var requestSentBy = friendPendingStatus.requestSentBy.toLowerCase();

                if(requestSentBy.localeCompare(currentUser) == 0) {
                    usersArray[i].friendStatusMessage = "Friendship Request Pending (them)";
                    usersArray[i].friendStatusCode = "request_pending";
                    usersArray[i].friendStatus = 2;

                //TYPE 3: Friendship Invite Pending (you)
                } else {
                    usersArray[i].friendStatusMessage = "Friendship Invite Pending (you)";
                    usersArray[i].friendStatusCode = "invite_pending";
                    usersArray[i].friendStatus = 3;
                }
            }

		//TYPE 4: Not Friends
		} else {
			usersArray[i].friendStatusMessage = "not friends";
            usersArray[i].friendStatusCode = "not_friends";
			usersArray[i].friendStatus = 4;
		}
    }
    
    */
