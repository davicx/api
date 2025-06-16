const db = require('./../conn');
const functions = require('./../functions');
const groupFunctions = require('./../groupFunctions');

/*
METHODS A: Group RELATED
    1) Method A1: Create a Group
    2) Method A2: Add Single User to Group (Accepts cleaned data they are not in the group already)
    3) Method A3: Add Group Users 
    4) Method A4: Get Group Users
    5) Method A5: Accept Group Invite
    6) Method A6: Leave Group
    7) Method A9: Update Group Information
*/

class Group {
    constructor(groupID) {
        this.groupID = groupID;
    }

    //Method A1: Create a Group
    static async createGroup(currentUser, groupName, groupType, groupPrivate, groupImage)  {
        const connection = db.getConnection(); 
        var groupID = 0;
        var groupImage = "the_shire.jpg"; 



        var groupOutcome = {
            outcome: 0,
            groupID: groupID,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO shareshare.groups (group_type, created_by, group_name, group_image, group_private) VALUES (?, ?, ?, ?, ?)"

                connection.query(queryString, [groupType, currentUser, groupName, groupImage, groupPrivate], (err, results) => {
                    if (!err) {
                        groupOutcome.outcome = 1;
                        groupOutcome.groupID = results.insertId
                        //console.log("You created a new Group with ID " + results.insertId);        
                    } else {  
                        //console.log(err);
                        groupOutcome.errors.push(err);
                    }  
                    resolve(groupOutcome);
                })   
            } catch(err) {
                console.log("REJECTED " + err);
                reject(groupOutcome);
            } 
        });
    }

    //Method A2: Add Single User to Group (Accepts cleaned data they are not in the group already)
    static async addGroupUser(groupID, groupUser)  {
        const connection = db.getConnection(); 
        var addGroupUserStatus = {
            userAdded: 0,
            userName: groupUser
        }

        return new Promise(async function(resolve, reject) {
            try {
                const activeMember = 0;
                const queryString = "INSERT INTO group_users (group_id, user_name, active_member) VALUES (?, ?, ?)"
    
                connection.query(queryString, [groupID, groupUser, activeMember], (err, results) => {
                    if (!err) {
                        //console.log("You added " + groupUser)
                        addGroupUserStatus.userAdded = 1;
                        resolve(addGroupUserStatus);
                    } else {
                        addGroupUserStatus.userAdded = 0;
                        resolve(addGroupUserStatus);
                    }
                })  
            } catch(err) {
                reject(addGroupUserStatus);
            } 
        });
    }

    //Method A3: Add Group Users 
    static async addNewGroupUsers(groupID, groupUsers, groupCreator)  {
        const connection = db.getConnection(); 
        var groupUsersOutcome = {
            outcome: 1,
            addedUsers: [],
            pendingUsers: [],
            errors: []
        }
		const groupUserStatus = await groupFunctions.checkUserGroupStatus(groupUsers, groupID);
        const newGroupUsers = groupUserStatus.newUsers;

        return new Promise(async function(resolve, reject) {
            try {
                for(let i = 0; i < newGroupUsers.length; i++) {
                    let newGroupUser = newGroupUsers[i];

                    //Part 2: Set Active Status
                    let activeMember = 0;

                    if(newGroupUser.toLowerCase() == groupCreator.toLowerCase()) {
                        activeMember = 1;
                    } else {
                        activeMember = 0;      
                    }   

                    console.log("We are now adding " + newGroupUser + " as " + activeMember)
                    groupUsersOutcome.addedUsers.push(newGroupUser)
                    if(activeMember != 1) {
                        groupUsersOutcome.pendingUsers.push(newGroupUser)
                    }
                    
                    //Part 3: Add them into the group 
                    const queryString = "INSERT INTO group_users (group_id, user_name, active_member) VALUES (?, ?, ?)"

                    connection.query(queryString, [groupID, newGroupUser, activeMember], (err, results) => {
                        if (err) {
                            console.log(err);
                            groupUsersOutcome.outcome = 500;
                            groupUsersOutcome.errors.push(err);
                        } 
                    })  
                }       

                resolve(groupUsersOutcome); 

            } catch(err) {
                groupUsersOutcome.outcome = 200;
                console.log("REJECTED " + err);
                reject(groupUsersOutcome);
            } 
        });
    }

    //Method A4: Get Group Users
    static async getGroupUsers(groupID) {
        console.log("CLASS GROUP " + groupID)
        const connection = db.getConnection(); 
        const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ?";
        
        var groupUsersSet = new Set();
        var pendingGroupUsersSet = new Set();
        var groupUsersResponse = {
            status: 500,
            groupUsers: [],
            pendingGroupUsers: [],
            errors: [],
        }

        return new Promise(async function(resolve, reject) {
            try {
                
                connection.query(queryString, [groupID], (err, rows) => {
                    
                    if (!err) {
                        rows.map((row) => {
                            if(row.active_member == 1) {
                                groupUsersSet.add(row.user_name) 
                            } else {
                                pendingGroupUsersSet.add(row.user_name) 
                            }
                        }); 
                        groupUsersResponse.status = 200;
                        groupUsersResponse.groupUsers = Array.from(groupUsersSet);    
                        groupUsersResponse.pendingGroupUsers = Array.from(pendingGroupUsersSet);    
                    } else {
                        console.log("error getting group users")    
                        groupUsersResponse.outcome = "no worky"
                        groupUsersResponse.errors.push(err);
                    } 
                    
                    resolve(groupUsersResponse);
                }) 
                
            } catch(err) {
                groupUsersResponse.outcome = "rejected";
                console.log("REJECTED ");
                reject(groupUsersResponse);
            } 
        });
    } 

    //Method A5:: Get All Groups User is In 
    static async getGroupsUserIsIn(userName) {
        const connection = db.getConnection(); 
        const queryString = "SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1"; 

        var userGroupsResponse = {
            status: 500,
            groupIDs: [],
            errors: [],
        }

        return new Promise(async function(resolve, reject) {
            try {
                
                connection.query(queryString, [userName], (err, rows) => {
                    
                    if (!err) {
                        rows.map((row) => {
                            userGroupsResponse.groupIDs.push(row.group_id) 
                        }); 
                        userGroupsResponse.status = 200; 
                    } else {
                        console.log("error getting group users")    
                        userGroupsResponse.outcome = "no worky"
                        userGroupsResponse.errors.push(err);
                    } 
                    
                    resolve(userGroupsResponse);
                }) 
                
            } catch(err) {
                userGroupsResponse.outcome = "rejected";
                console.log("REJECTED ");
                reject(userGroupsResponse);
            } 
        });

        //NEW
        /*

        //Move to Groups Class
        connection.query(queryString, [currentUser], (err, rows) => {
            if (!err) {
                var groupList = [];
                rows.map((row) => {
                    let currentGroup = {
                        groupID: row.group_id,
                        groupName: row.group_name
                    }

                    groupList.push(currentGroup);
                });

                res.json({groups: groupList} );

            } else {
                console.log("Failed to Select Post")
                console.log(err)
                res.sendStatus(500)
                return
            }
        })

        */
        //ORIGINAL
        /*

        


        */
    } 

    //Method A6: Accept Group Invite
    static acceptGroupInvite(groupID, currentUser, requestID) {
        const connection = db.getConnection(); 
        console.log("Yay! " + groupID + " " + currentUser + " " + requestID)

        //PART 1: Update group user status 
        const queryString = "UPDATE group_users SET active_member = '1' WHERE group_id = ? AND user_name = ?"

        connection.query(queryString, [groupID, currentUser], (err, results) => {
            if (!err) {
                console.log("worky! ")
                console.log(results);

                //PART 2: Update Notification 
                const notificationQuery = "UPDATE notifications SET notification_seen = '1' WHERE group_id = ? AND notification_to = ? AND notification_type = 'group_invite'"

                connection.query(notificationQuery, [groupID, currentUser], (err, results) => {
                    if (!err) {
                        console.log("notification worky! ")
                        console.log(results);
                    } else {
                        console.log(err);
                    }
                }) 

                //PART 3: Update Request
                const requestQuery = "UPDATE pending_requests SET request_is_pending = '0' WHERE request_id = ? AND group_id = ? AND sent_to = ? AND (request_type = 'new_group' OR request_type = 'group_invite')"

                connection.query(requestQuery, [requestID, groupID, currentUser], (err, results) => {
                    if (!err) {
                        console.log("request worky! ")
                        console.log(results);
                    } else {
                        console.log(err);
                    }
                }) 

            } else {
                console.log(err);
            }
        })  
    }
    
    //Method A7: Leave Group
    static async leaveGroup(currentUser, groupID)  {
        const connection = db.getConnection(); 

        var leaveGroupStatus = {
            userName: currentUser,
            userRemoved: false,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const activeMember = 0;
                const queryString = "DELETE FROM group_users WHERE group_id = ? AND user_name = ?"
    
                connection.query(queryString, [groupID, currentUser], (err, results) => {
                    if (!err) {
                        //console.log(results)
                        if(results.affectedRows > 0) {
                            leaveGroupStatus.userRemoved = true;
                        }
                        resolve(leaveGroupStatus);
                    } else {
                        leaveGroupStatus.error.push(err)
                        resolve(leaveGroupStatus);
                    }
                })  
            } catch(err) {
                leaveGroupStatus.error.push(err)

                reject(leaveGroupStatus);
            } 
        });
    }
   
    //Method A8: Get Group Information
    static async getGroupInformation(groupID) {
        console.log("CLASS GROUP: getting Group Information for " + groupID);
        const connection = db.getConnection(); 
        const queryString = "SELECT group_id, group_image, group_name FROM shareshare.groups WHERE group_id = ?";
        
        var groupInfoResponse = {
            status: 500,
            groupID: 0,
            groupImage: "",
            groupName: "",
            errors: [],
        };
    
        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [groupID], (err, rows) => {
                    if (!err && rows.length > 0) {
                        let row = rows[0];
                        groupInfoResponse.status = 200;
                        groupInfoResponse.groupID = row.group_id;
                        groupInfoResponse.groupImage = row.group_image;
                        groupInfoResponse.groupName = row.group_name;
                    } else {
                        console.log("Error retrieving group information or group not found");
                        groupInfoResponse.errors.push(err || "Group not found");
                    }
                    resolve(groupInfoResponse);
                });
            } catch(err) {
                groupInfoResponse.errors.push(err);
                console.log("REJECTED");
                reject(groupInfoResponse);
            }
        });
    }
        
    //Method A9: Update Group Information
    static async updateGroup(groupID, groupName, groupType, groupPrivate, groupImage) {
        const connection = db.getConnection();
        var updateOutcome = {
            status: 500,
            groupID: groupID,
            errors: [],
        };
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "UPDATE shareshare.groups SET group_name = ?, group_type = ?, group_private = ?, group_image = ? WHERE group_id = ?";
                connection.query(queryString, [groupName, groupType, groupPrivate, groupImage, groupID], (err, results) => {
                    if (!err) {
                        updateOutcome.status = 200;
                    } else {
                        updateOutcome.errors.push(err);
                    }
                    resolve(updateOutcome);
                });
            } catch(err) {
                updateOutcome.errors.push(err);
                reject(updateOutcome);
            }
        });
    }
}

module.exports = Group;

























//APPENDIX
//STEP 1: Create New Group 
//Part 1: Create new group and insert into groups table 
/*

    //Method A3: Add Group Users 
    static async addNewGroupUsers(groupID, groupUsers, groupCreator)  {
        const connection = db.getConnection(); 
        var groupUsersOutcome = {
            outcome: 1,
            addedUsers: [],
            errors: []
        }
		const groupUserStatus = await functions.checkUserGroupStatus(groupUsers, groupID);
        console.log("_________________")
        console.log(groupUserStatus)
        console.log("_________________")
        const newGroupUsers = groupUserStatus.newUsers;

        return new Promise(async function(resolve, reject) {
            try {
                for(let i = 0; i < newGroupUsers.length; i++) {
                    let newGroupUser = groupUsers[i];
                    var groupUserCount = 100;

                    //Part 1: Check if they are already in this group
            
                    const queryString = "SELECT COUNT(*) AS requestCount FROM group_users WHERE user_name = ? AND group_id =?"			
                    var groupUserCount = 100;

                    connection.query(queryString, [newGroupUser, groupID], (err, rows) => {
                        if (!err) {
                            //Step 2: Insert Record if it is new 
                            console.log(rows[0])
                            groupUserCount = rows[0].requestCount;	
                            console.log(newGroupUser + " GROUP USER COUNT " + groupUserCount);
                        }
                    })
          
                    if(groupUserCount == 0) {
                        console.log("OK TO ADD " + newGroupUser);
                
                        //Part 2: Set Active Status
                        let activeMember = 0;
                        if(newGroupUser.toLowerCase() == groupCreator.toLowerCase()) {
                            activeMember = 1;
                        } else {
                            activeMember = 0;      
                        }    
                        console.log(groupUsers[i] + " " + activeMember)
    
                        //Part 3: Add them into the group 
                        const queryString = "INSERT INTO group_users (group_id, user_name, active_member) VALUES (?, ?, ?)"
    
                        connection.query(queryString, [groupID, newGroupUser, activeMember], (err, results) => {
                            if (err) {
                                console.log(err);
                                groupUsersOutcome.outcome = 500;
                                groupUsersOutcome.errors.push(err);
                            } else {
                                groupUsersOutcome.addedUsers.push(newGroupUser);
                            }
                        })  
                      } else {

                      }
         
                    }

                resolve(groupUsersOutcome); 

            } catch(err) {
                groupUsersOutcome.outcome = 200;
                console.log("REJECTED " + err);
                reject(groupUsersOutcome);
            } 
        });
    }


*/