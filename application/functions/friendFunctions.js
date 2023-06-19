const db = require('./conn');
const userFunctions = require('./userFunctions');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Friends
	1) Function A1: Get all User Friends
    2) Function A2: Get a List of Friends You have Requested (They must accept)
    3) Function A3: Get a List of Friend Invites (You can Accept)
    4) Function A4: Get a Single Friend Invite

*/


//FUNCTIONS A: All Functions Related to Friends
//Function A1: Get all User Friends
async function getUserFriends(userName) {
    const connection = db.getConnection(); 


    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            //const queryString = "SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND user_profile.account_active = 1"
            //const queryString = "SELECT * FROM friends WHERE user_name = ?"
            const queryString = "SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND user_profile.account_active = 1"

            connection.query(queryString, [userName], (err, rows) => {

                const friendsArray = rows.map((row) => {
                    return {
                        friendUserName: row.friend_user_name,
                        friendID: row.friend_id,
                        friendUserImage: row.image_name,
                        friendshipPending: row.request_pending
                        
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

//Function A2: Get a List of Friend You have Requested (They must accept)
async function getPendingFriendRequests(sentBy, userName) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            //const queryString = "SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = ?) AND (user_name != ?)"
            const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name AS friend_user_name, user_profile.image_name AS friend_image_name, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to  WHERE friends.request_pending = 1 AND (friends.sent_by = ?) AND (friends.user_name != ?) AND user_profile.account_active = 1"

            connection.query(queryString, [sentBy, userName], (err, rows) => {
                const friendsArray = rows.map((row) => {
                    return {
                        friendUserName: row.friend_user_name,
                        friendImage: row.friend_image_name,                        
                    }
                });
                
                userFriendsOutcome.success = true;
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

//Function A3: Get a List of Friend Invites (You can Accept)
async function getPendingFriendInvites(currentUser) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            //const queryString = "SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = ?) AND (user_name != ?)"
            const queryString = "SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to WHERE friends.request_pending = 1 AND (friends.sent_to = ?) AND (friends.user_name != ?)AND user_profile.account_active = 1"

            connection.query(queryString, [currentUser, currentUser], (err, rows) => {
                const friendInvites = rows.map((row) => {
                    return {
                        sentTo: row.sent_to,
                        sentBy: row.sent_by,                        
                        sentByImage: row.friend_image_name                      
                    }
                });
                
                userFriendsOutcome.success = true;
                userFriendsOutcome.friendInvites = friendInvites;

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

//Function A4: Get a Single Friend Invite (Only used by logged in user? there the only ones who can accept)
async function getSingleInvite(currentUser, friendRequestFrom) {
    const connection = db.getConnection(); 
    console.log(currentUser, friendRequestFrom)
    
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






//Function A1: Check if Users are Friends
//Status
/*
1: Currently Friends
2: Friendship Pending
3: Not Friends
4: No Data
*/ 
async function checkFriendshipStatus(currentUser, userFriend) {
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
                        
                        //console.log(rows[0])
			
                    } else {
                        friendshipOutcome.friendshipStatus = 3
						//friendshipOutcome.errors.push("We couldn't find anything " + requestID);
					}
                    //console.log(friendshipOutcome)
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


module.exports = { checkFriendshipStatus, getUserFriends, getPendingFriendRequests, getPendingFriendInvites, getSingleInvite, getAllUsers };
