const db = require('./../conn');
const functions = require('./../functions');
const groupFunctions = require('./../groupFunctions');

/*
METHODS A: Friend Related
    1) Method A1: Invite a new Friend
    2) Method A2: Accept Friend Invite
    3) Method A3: Remove a Friend

METHODS B: Following Related     
    1) Method B1: Get your Following
    2) Method B2: Follow a User
    3) Method B3: Unfollow a User
*/


class Friend {
    constructor(groupID) {
        this.groupID = groupID;
    }

    //Method A1: Invite a new Friend
    static async inviteFriend(sentBy, sentTo, currentUser, currentUserID, friendName, friendUserID) {
        const requestPending = 1;
        const friendKey = currentUser + "" + friendName;
        console.log("Add a Friend! " + currentUser, currentUserID, friendName, friendUserID)

        const connection = db.getConnection(); 
        var addFriendStatus = {
            userAdded: false,
            friendShipKey: "Not Added",
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                
                const activeMember = 0;
                const queryString = "INSERT INTO friends (sent_by, sent_to, user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?,?,?,?,?,?,?,?)"

                connection.query(queryString, [sentBy, sentTo, currentUser, currentUserID, friendName, friendUserID, requestPending, friendKey], (err, results) => {
                    if (!err) {
                        addFriendStatus.userAdded = true;
                        addFriendStatus.friendShipKey = currentUser + "" + friendName;
                        resolve(addFriendStatus);
                    } else {
                        addFriendStatus.errors.push(err);
                        resolve(addFriendStatus);
                    }
                })  
            } catch(err) {
                addFriendStatus.errors.push(err);
                reject(addFriendStatus);
            } 
        });
    }

    //Method A2: Accept a Friend Invite
    static async acceptFriendInvite(currentUser, friendName) {
        const connection = db.getConnection(); 

        var addFriendStatus = {
            friendshipAdded: false,
            friendShipKey: "Not Added",
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "UPDATE friends SET request_pending = 0 WHERE (user_name = ? AND friend_user_name = ?) OR (user_name = ? AND friend_user_name = ?)" 

                connection.query(queryString, [currentUser, friendName, friendName, currentUser], (err, results) => {
                    if (!err) {
                        addFriendStatus.friendshipAdded = true;
                        addFriendStatus.friendShipKey = currentUser + " is friends with" + friendName;
                        resolve(addFriendStatus);
                    } else {
                        addFriendStatus.errors.push(err);
                        resolve(addFriendStatus);
                    }
                })  
            } catch(err) {
                addFriendStatus.errors.push(err);
                reject(addFriendStatus);
            } 
        });
        
    }

    //Method A3: Remove a Friend 
    static async deleteFriend(currentUser, friendName) {
        const connection = db.getConnection(); 

        var removeFriendStatus = {
            friendRemoved: false,
            currentUser: currentUser,
            friendName: friendName,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "DELETE FROM friends WHERE user_name = ? AND friend_user_name = ?"

                connection.query(queryString, [currentUser, friendName], (err) => {
                    if (!err) {
                        removeFriendStatus.friendRemoved = true;

                        resolve(removeFriendStatus);
                    } else {
                        console.log(err)
                        removeFriendStatus.errors.push(err);
                        resolve(removeFriendStatus);
                    }
                })  
            } catch(err) {
                console.log(err)
                removeFriendStatus.errors.push(err);
                reject(removeFriendStatus);
            } 
        });
    }
    

    // Method B1: Follow a User
    static async followUser(currentUser, followName, currentUserID, followUserID) {
        const connection = db.getConnection(); 
        var followingKey = currentUser + "_" + followName;

        var followStatus = {
            userFollowed: false,
            followKey: currentUser + "_" + followName,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO following (following_key, user_name, user_id, following_user, following_user_id) VALUES (?, ?, ?, ?, ?)";

                connection.query(queryString, [followingKey, currentUser, currentUserID, followName, followUserID], (err, results) => {
                    if (!err) {
                        followStatus.userFollowed = true;
                        resolve(followStatus);
                    } else {
                        followStatus.errors.push(err);
                        resolve(followStatus);
                    }
                })  
            } catch(err) {
                followStatus.errors.push(err);
                reject(followStatus);
            } 
        });
    }

    // Method B2: Unfollow a User
    static async unfollowUser(currentUser, unfollowName) {
        const connection = db.getConnection(); 

        var unfollowStatus = {
            userUnfollowed: false,
            currentUser: currentUser,
            unfollowed: unfollowName,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "DELETE FROM following WHERE user_name = ? AND following_user = ?";

                connection.query(queryString, [currentUser, unfollowName], (err) => {
                    if (!err) {
                        unfollowStatus.userUnfollowed = true;
                        resolve(unfollowStatus);
                    } else {
                        unfollowStatus.errors.push(err);
                        resolve(unfollowStatus);
                    }
                })  
            } catch(err) {
                unfollowStatus.errors.push(err);
                reject(unfollowStatus);
            } 
        });
    }

    // Method B1: Get Your Following
static async getUserFollowing(currentUser) {
	const connection = db.getConnection();

	const result = {
		currentUser: currentUser,
		followingList: [],
		errors: [],
		success: false
	};

	return new Promise((resolve, reject) => {
		const query = `
			SELECT 
				u.user_name,
				u.image_name,
				u.first_name,
				u.last_name
			FROM following f
			JOIN user_profile u ON f.following_user = u.user_name
			WHERE f.user_name = ?
		`;

		connection.query(query, [currentUser], (err, rows) => {
			if (err) {
                
				result.errors.push(err);
				return resolve(result);
			}

            console.log(rows)
			result.followingList = rows;
			result.success = true;
			resolve(result);
		});
	});
}


}

module.exports = Friend;



/*
2) Method A2: Get List of all User Friends 
3) Method A3: Get Pending Requests *Not Done 
4) Method A4: Request a Friend	
5) Method A5: Cancel a Sent Friend Request
6) Method A6: Remove a Friend
7) Method A7: Update User Info
*/

