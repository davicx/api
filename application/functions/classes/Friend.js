const db = require('./../conn');
const functions = require('./../functions');
const groupFunctions = require('./../groupFunctions');

/*
METHODS A: Friend RELATED
    1) Method A1: Invite a new Friend
    2) Method A2: Accept Friend Invite
    3) Method A3: Remove a Friend
*/

class Friend {
    constructor(groupID) {
        this.groupID = groupID;
    }

    //Method A1: Invite a new Friend
    static async inviteFriend(currentUser, currentUserID, friendName, friendUserID) {
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
                const queryString = "INSERT INTO friends (user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?,?,?,?,?,?)"

                connection.query(queryString, [currentUser, currentUserID, friendName, friendUserID, requestPending, friendKey], (err, results) => {
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
                const queryString = "INSERT INTO friends (user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?,?,?,?,?,?)"

                connection.query(queryString, [currentUser, currentUserID, friendName, friendUserID, requestPending, friendKey], (err, results) => {
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

        //Method A3: Remove a Friend (NOT DONE)
        static async removeFriend(currentUser, currentUserID, friendName, friendUserID) {
            const requestPending = 1;
            const friendKey = currentUser + "" + friendName;
            console.log("Add a Friend! " + currentUser, currentUserID, friendName, friendUserID)
    
            const connection = db.getConnection(); 
            var removeFriendStatus = {
                userAdded: false,
                friendShipKey: "Not Added",
                errors: []
            }
    
            return new Promise(async function(resolve, reject) {
                try {
                    
                    const activeMember = 0;
                    const queryString = "INSERT INTO friends (user_name, user_id, friend_user_name, friend_id, request_pending, friend_key) VALUES (?,?,?,?,?,?)"
    
                    connection.query(queryString, [currentUser, currentUserID, friendName, friendUserID, requestPending, friendKey], (err, results) => {
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
    


}

module.exports = Friend;