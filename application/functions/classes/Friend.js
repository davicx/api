const db = require('./../conn');
const functions = require('./../functions');
const groupFunctions = require('./../groupFunctions');

/*
METHODS A: Friend RELATED
    1) Method A1: Invite a new Friend
    2) Method A2: Accept Friend Invite
    3) Method A3: Remove a Friend
*/

/*
2) Method A2: Get List of all User Friends 
3) Method A3: Get Pending Requests *Not Done 
4) Method A4: Request a Friend	
5) Method A5: Cancel a Sent Friend Request
6) Method A6: Remove a Friend
7) Method A7: Update User Info
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
    


}

module.exports = Friend;