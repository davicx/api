const db = require('./conn');
const userFunctions = require('./userFunctions');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Friends
	1) Function A1: Get all User Friends

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
            const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.friend_id, friends.request_pending, user_login.user_name, user_login.user_id, user_login.account_deleted FROM user_login INNER JOIN friends ON user_login.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND user_login.account_deleted = 0"	
            
            connection.query(queryString, [userName], (err, rows) => {

                const friendsArray = rows.map((row) => {
                    return {
                        postID: row.user_name,
                        postType: row.friend_user_name,
                        groupID: row.friend_id,
                        listID: row.user_id
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


module.exports = { checkFriendshipStatus, getUserFriends };
