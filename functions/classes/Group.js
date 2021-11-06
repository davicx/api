const db = require('./../conn');


class Group {
    constructor(groupID) {
        this.groupID = groupID;
    }


    
    //Method A5: Create a Group
    static leaveGroup(currentUser, groupID)  {
        console.log("LEAVE " + currentUser + " " + groupID)


    }

    //Method A4: Accept Group Invite
    static acceptGroupInvite(groupID, currentUser, requestID) {
        const connection = db.getConnection(); 
        console.log("Yay! " + groupID + " " + currentUser + " " + requestID)

        //Update Request
        const requestQuery = "UPDATE pending_requests SET request_is_pending = '0' WHERE request_id = ? AND group_id = ? AND sent_to = ? AND (request_type = 'new_group' OR request_type = 'group_invite')"
        //const requestQuery = "UPDATE pending_requests SET request_is_pending = '0' WHERE request_id = ?"

        connection.query(requestQuery, [requestID, groupID, currentUser], (err, results) => {
            if (!err) {
                console.log("request worky! ")
                console.log(results);
            } else {
                console.log(err);
            }
        }) 

        //Update Group 
        const queryString = "UPDATE group_users SET active_member = '1' WHERE group_id = ? AND user_name = ?"

        connection.query(queryString, [groupID, currentUser], (err, results) => {
            if (!err) {
                console.log("worky! ")
                console.log(results);
            } else {
                console.log(err);
            }
        })  
    }
    
        
    //Method A3: Get Group Users
    static getGroup(groupID) {
        this.sayHi();
        //Get Users
        //Get Name 
    }

    static sayHi() {
        console.log("hiya!!")
    }


    //Method A3: Get Group Users
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
    
        //GET GROUP USERS
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


    //Method A2: Create a Group
    static async addGroupUsers(groupID, groupUsers, groupCreator)  {
        const connection = db.getConnection(); 
        var groupUsersOutcome = {
            outcome: 1,
            errors: []
        }
       
        return new Promise(async function(resolve, reject) {
            try {
                for(let i = 0; i < groupUsers.length; i++) {
                    let currentUser = groupUsers[i];
                    let activeMember = 0;
                    if(currentUser.toLowerCase() == groupCreator.toLowerCase()) {
                        activeMember = 1;
                    } else {
                        activeMember = 0;      
                    }    
                    console.log(groupUsers[i] + " " + activeMember)

                    const queryString = "INSERT INTO group_users (group_id, user_name, active_member) VALUES (?, ?, ?)"

                    connection.query(queryString, [groupID, currentUser, activeMember], (err, results) => {
                        if (err) {
                            console.log(err);
                            groupUsersOutcome.outcome = 0;
                            groupUsersOutcome.errors.push(err);
                        } 
                    })  
                }
     
                resolve(groupUsersOutcome); 

            } catch(err) {
                groupUsersOutcome.outcome = 0;
                console.log("REJECTED " + err);
                reject(groupUsersOutcome);
            } 
        });
    }



    //Method A1: Create a Group
    static async createGroup(req)  {
        const connection = db.getConnection(); 
        var groupID = 0;
        const currentUser = req.body.currentUser; 
        const groupName = req.body.groupName; 
        const groupType = req.body.groupType; 
        const groupImage = "the_shire.jpg"; 
        const groupPrivate = req.body.groupPrivate; 

        var groupOutcome = {
            outcome: 0,
            groupID: groupID,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO groups (group_type, created_by, group_name, group_image, group_private) VALUES (?, ?, ?, ?, ?)"

                connection.query(queryString, [groupType, currentUser, groupName, groupImage, groupPrivate], (err, results) => {
                    if (!err) {
                        groupOutcome.outcome = 1;
                        groupOutcome.groupID = results.insertId
                        //console.log("You created a new Group with ID " + results.insertId);        
                        //res.json(groupOutcome);
                    } else {  
                        //console.log(err);
                        groupOutcome.errors.push(err);
                        //res.json({error: "ERROR MAN!"})  
                    }  
                    resolve(groupOutcome);
                })   
            } catch(err) {
                console.log("REJECTED " + err);
                reject(groupOutcome);
            } 
        });
    }

    //GET 
}

module.exports = Group;




//STEP 1: Create New Group 
//Part 1: Create new group and insert into groups table 



