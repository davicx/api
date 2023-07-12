const db = require('./conn');
const userFunctions = require('./userFunctions');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Friends
	1) Function A1: Get all Users
    2) Function A2: Get Your Friends
    3) Function A3: Get All Your Friends (Active, Pending, Requested)
	4) Function A4: Get your Pending Friends Requests (They accept)	
	5) Function A5: Get your Pending Friends Invites (You can accept)
    6) Function A6: Check if Users are Friends (Used for adding a friend)



*/

//FUNCTIONS A: All Functions Related to Friends
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

//Function A2: Get Your Friends (Active)
async function getUserFriends(currentUser) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1 AND friends.request_pending = 0"
            connection.query(queryString, [currentUser], (err, rows) => {
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}
                    
                
                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_name;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;
                    currentFriend.friendBiography = rows[i].biography;
                    currentFriend.requestPending = rows[i].request_pending;
                    currentFriend.requestSentBy = rows[i].sent_by;
                 
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

//Function A3: Get All Your Friends (Active, Pending, Requested)
async function getAllUserFriends(currentUser) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1"
            connection.query(queryString, [currentUser], (err, rows) => {
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}
                    
                
                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_name;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;
                    currentFriend.friendBiography = rows[i].biography;
                    currentFriend.requestPending = rows[i].request_pending;
                    currentFriend.requestSentBy = rows[i].sent_by;
                 
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
           const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name AS friend_user_name, user_profile.image_name AS friend_image_name, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to  WHERE friends.request_pending = 1 AND (friends.sent_by = ?) AND (friends.user_name != ?) AND user_profile.account_active = 1"

            connection.query(queryString, [sentBy, userName], (err, rows) => {
                const friendsArray = rows.map((row) => {
                    return {
                        friendUserName: row.friend_user_name,
                        friendImage: row.friend_image_name,                        
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
            const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to WHERE friends.request_pending = 1 AND (friends.sent_to = ?) AND (friends.user_name != ?)AND user_profile.account_active = 1"

            connection.query(queryString, [currentUser, currentUser], (err, rows) => {
                const friendInvites = rows.map((row) => {
                    return {
                        sentTo: row.sent_to,
                        sentBy: row.sent_by,                        
                        sentByImage: row.friend_image_name                      
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
async function checkFriendshipStatus(currentUser, userFriend) {
    //Status
    /*
    1: Currently Friends
    2: Friendship Pending
    3: Not Friends
    4: No Data
    */ 
    var friendKey = currentUser + "" + userFriend;
    var friendKeyTwo = userFriend + "" + currentUser;
   
    //var friendKey = "vasquezdmatt";
    //var friendKeyTwo = "vasquezdmat";
    
    const connection = db.getConnection();

    var friendshipOutcome = {
        friendshipStatus: 4,
		errors: []
    }


	return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT * FROM friends WHERE friend_key = ? OR friend_key = ?"			
            
            connection.query(queryString, [friendKey, friendKeyTwo], (err, rows) => {
                if (!err) {           
                    if(rows.length >= 1){
                        if(rows[0].request_pending > 0) {
                            friendshipOutcome.friendshipStatus = 2
                        } else {
                            friendshipOutcome.friendshipStatus = 1
                        }

                    } else {
                        friendshipOutcome.friendshipStatus = 3
						//friendshipOutcome.errors.push("We couldn't find anything " + requestID);
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

async function compareUsersWithYourFriends(userName, yourFriendsArray, usersArray) {
    const currentUser = userName.toLowerCase();
    //console.log(yourFriendsArray)

    //STEP 1: Create a Set of your friends
	var yourFriendsSet = new Set();

	for (let i = 0; i < yourFriendsArray.length ; i++) {
        //console.log(yourFriendsArray[i].userName)
		yourFriendsSet.add(yourFriendsArray[i].userName.toLowerCase())
	}	


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

    return yourFriendsArray;
}

function getFriendStatus(friendName, yourFriendsArray) {
	for (let i = 0; i < yourFriendsArray.length ; i++) {
		if(yourFriendsArray[i].friendUserName.localeCompare(friendName) == 0) {
			return yourFriendsArray[i];
		}
	}

}



//SORT
//SORT



//Function A4: Get a Single Friend Invite (Only used by logged in user? there the only ones who can accept)
async function getSingleInvite(currentUser, friendRequestFrom) {
    const connection = db.getConnection(); 
    //console.log(currentUser, friendRequestFrom)
    
    var friendInviteOutcome = {
        inviteExists: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT * FROM friends WHERE request_pending = 1 AND sent_by = ? AND sent_to = ?"
            connection.query(queryString, [friendRequestFrom, currentUser], (err, rows) => {
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




//Function A7: Add Your Friends to a list of Users 

//module.exports = { getAllUsers, getUserFriends, getPendingFriendRequests, getPendingFriendInvites, getSingleInvite, getAllUsers, compareUsersWithYourFriends };
module.exports = { getAllUsers, getUserFriends, getAllUserFriends, getPendingFriendRequests, getPendingFriendInvites, checkFriendshipStatus, compareUsersWithYourFriends };





//FUNCTIONS A: All Functions Related to Friends
//Function A1: Get all User Friends

//new working on 
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

//ALL BELOW FIX

//Function A2: Get a List of Friend You have Requested (They must accept)


//Function A3: Get a List of Friend Invites (You can Accept)

