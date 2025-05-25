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
    
    // Method B1: Get Your Following
    static async getCurrrentUserFollowing(currentUser) {
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
    
                // Add followStatus: 1 to each row
                const updatedRows = rows.map(user => ({
                    ...user,
                    followStatus: 1
                }));
    
                result.followingList = updatedRows;
                result.success = true;
                resolve(result);
            });
        });
    }
    
    // Method B2: Get Your Followers
    static async getCurrentUserFollowers(currentUser) {
        const connection = db.getConnection();
    
        const result = {
            currentUser: currentUser,
            followersList: [],
            errors: [],
            success: false
        };
    
        return new Promise((resolve, reject) => {
            // This query selects all users who are following the current user
            // and joins their user profile data.
            const query = `
                SELECT 
                    u.user_name,
                    u.image_name,
                    u.first_name,
                    u.last_name
                FROM following f
                JOIN user_profile u ON f.user_name = u.user_name
                WHERE f.following_user = ?
            `;
    
            connection.query(query, [currentUser], (err, rows) => {
                if (err) {
                    result.errors.push(err);
                    return resolve(result);
                }
    
                if (!rows || rows.length === 0) {
                    result.success = true;
                    return resolve(result);
                }
    
                // Now that we have the list of people who follow the current user,
                // we need to check if the current user is following them back.
                // First, get their usernames into a list
                const followerUsernames = rows.map(function(row) {
                    return row.user_name;
                });
    
                // Prepare a second query to check who the current user follows back
                const checkFollowingQuery = `
                    SELECT following_user FROM following
                    WHERE user_name = ? AND following_user IN (?)
                `;
    
                connection.query(checkFollowingQuery, [currentUser, followerUsernames], (err2, followBackRows) => {
                    if (err2) {
                        result.errors.push(err2);
                        return resolve(result);
                    }
    
                    // Create a Set of usernames that current user is following back
                    const followingBackSet = new Set();
                    for (let i = 0; i < followBackRows.length; i++) {
                        followingBackSet.add(followBackRows[i].following_user);
                    }
    
                    // Build final followersList with followStatus: 1 or 0
                    const finalList = [];
                    for (let i = 0; i < rows.length; i++) {
                        const follower = rows[i];
                        const isFollowingBack = followingBackSet.has(follower.user_name);
    
                        const userData = {
                            user_name: follower.user_name,
                            image_name: follower.image_name,
                            first_name: follower.first_name,
                            last_name: follower.last_name,
                            followStatus: isFollowingBack ? 1 : 0
                        };
    
                        finalList.push(userData);
                    }
    
                    result.followersList = finalList;
                    result.success = true;
                    resolve(result);
                });
            });
        });
    }
    
    // Method B3: Get Following other user
    static async getUserFollowers(currentUser, otherUser) {
        const connection = db.getConnection();

        const result = {
            currentUser: currentUser,
            otherUser: otherUser,
            followersList: [],
            errors: [],
            success: false
        };

        return new Promise((resolve, reject) => {
            // Step 1: Get users who are following 'otherUser'
            const query = `
                SELECT 
                    u.user_name,
                    u.image_name,
                    u.first_name,
                    u.last_name
                FROM following f
                JOIN user_profile u ON f.user_name = u.user_name
                WHERE f.following_user = ?
            `;

            connection.query(query, [otherUser], (err, rows) => {
                if (err) {
                    result.errors.push(err);
                    return resolve(result);
                }

                if (!rows || rows.length === 0) {
                    result.success = true;
                    return resolve(result);
                }

                // Step 2: Extract all follower usernames
                const followerUsernames = [];
                for (let i = 0; i < rows.length; i++) {
                    followerUsernames.push(rows[i].user_name);
                }

                // Step 3: Check if 'currentUser' follows each of these followers
                const checkFollowingQuery = `
                    SELECT following_user FROM following
                    WHERE user_name = ? AND following_user IN (?)
                `;

                connection.query(checkFollowingQuery, [currentUser, followerUsernames], (err2, followBackRows) => {
                    if (err2) {
                        result.errors.push(err2);
                        return resolve(result);
                    }

                    // Step 4: Build a Set of usernames the current user follows
                    const followingBackSet = new Set();
                    for (let i = 0; i < followBackRows.length; i++) {
                        followingBackSet.add(followBackRows[i].following_user);
                    }

                    // Step 5: Build followersList with followStatus
                    const finalList = [];
                    for (let i = 0; i < rows.length; i++) {
                        const follower = rows[i];

                        let followStatus = 0;

                        if (follower.user_name === currentUser) {
                            followStatus = 2; // The follower is the current user
                        } else if (followingBackSet.has(follower.user_name)) {
                            followStatus = 1; // Current user follows them back
                        }

                        const userData = {
                            user_name: follower.user_name,
                            image_name: follower.image_name,
                            first_name: follower.first_name,
                            last_name: follower.last_name,
                            followStatus: followStatus
                        };

                        finalList.push(userData);
                    }

                    result.followersList = finalList;
                    result.success = true;
                    resolve(result);
                });
            });
        });
    }

    // Method B4: Get users that otherUser is following
    static async getUserFollowingOtherUser(currentUser, otherUser) {
        const connection = db.getConnection();

        const result = {
            currentUser: currentUser,
            otherUser: otherUser,
            followingList: [],
            errors: [],
            success: false
        };

        return new Promise((resolve, reject) => {
            // Step 1: Get users that 'otherUser' is following
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

            connection.query(query, [otherUser], (err, rows) => {
                if (err) {
                    result.errors.push(err);
                    return resolve(result);
                }

                if (!rows || rows.length === 0) {
                    result.success = true;
                    return resolve(result);
                }

                // Step 2: Extract all usernames that otherUser is following
                const followingUsernames = [];
                for (let i = 0; i < rows.length; i++) {
                    followingUsernames.push(rows[i].user_name);
                }

                // Step 3: Check if currentUser is following each of these users
                const checkFollowingQuery = `
                    SELECT following_user FROM following
                    WHERE user_name = ? AND following_user IN (?)
                `;

                connection.query(checkFollowingQuery, [currentUser, followingUsernames], (err2, followBackRows) => {
                    if (err2) {
                        result.errors.push(err2);
                        return resolve(result);
                    }

                    // Step 4: Build a Set of usernames that currentUser follows
                    const currentUserFollowingSet = new Set();
                    for (let i = 0; i < followBackRows.length; i++) {
                        currentUserFollowingSet.add(followBackRows[i].following_user);
                    }

                    // Step 5: Build followingList with followStatus
                    const finalList = [];
                    for (let i = 0; i < rows.length; i++) {
                        const followedUser = rows[i];

                        let followStatus = 0;

                        if (followedUser.user_name === currentUser) {
                            followStatus = 2; // This is the current user
                        } else if (currentUserFollowingSet.has(followedUser.user_name)) {
                            followStatus = 1; // Current user also follows this user
                        }

                        const userData = {
                            user_name: followedUser.user_name,
                            image_name: followedUser.image_name,
                            first_name: followedUser.first_name,
                            last_name: followedUser.last_name,
                            followStatus: followStatus
                        };

                        finalList.push(userData);
                    }

                    result.followingList = finalList;
                    result.success = true;
                    resolve(result);
                });
            });
        });
    }

    
    // Method B5: Follow a User
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

    // Method B6: Unfollow a User
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

