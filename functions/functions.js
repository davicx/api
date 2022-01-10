const db = require('./conn');
//https://stackoverflow.com/questions/40141332/node-js-mysql-error-handling

//USER FUNCTIONS
//GROUP FUNCTIONS
//Method B1: Check if users are already in the group
async function checkUserGroupStatus(invitedUsers, groupID)  {
    const connection = db.getConnection(); 

    var groupUserStatus = {
        outcome: 200,
		existingUsers: [],
		newUsers: []
    }
    return new Promise(async function(resolve, reject) {
        const existingUsersSet = new Set();
        try {
            
            const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ?"			
            
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {
                    for(let i = 0; i < rows.length; i++) {
                        const userName = rows[i].user_name.toLowerCase();
                        existingUsersSet.add(userName)
                    }

                    let existingUsers = Array.from(existingUsersSet);
                    groupUserStatus.existingUsers = existingUsers;
                    groupUserStatus.newUsers = invitedUsers.filter(item=>existingUsers.indexOf(item)==-1);

                    resolve(groupUserStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupUserStatus);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            reject(groupUserStatus);
        } 
    })

}

//Method B2: Check if Group exists (by ID)
async function checkGroupExists(groupID)  {
    const connection = db.getConnection(); 

    var groupExistsStatus = {
        outcome: 500,
		groupExists: 0,
        createdBy: "",
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT created_by FROM groups WHERE group_id = ?"			
            
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
                        groupExistsStatus.outcome = 200;
                        groupExistsStatus.groupExists = rows.length;
                        groupExistsStatus.createdBy = rows[0].created_by
                    } 

                    resolve(groupExistsStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupExistsStatus);
                }
            })
        } catch(err) {
            groupExistsStatus.outcome = 500;
            reject(groupExistsStatus);
        } 
    })

}

//METHODS: General 
//Method D1: Remove duplicate values from array
function removeArrayDuplicates(fullArray) {
    let uniqueSet = [...new Set(fullArray)];
    let uniqueArray = Array.from(uniqueSet);  
    return uniqueArray;
}

//Method D2: Convert elements in array to lowercase
function convertElementsLowercase(stringArray) {
    var lowerCaseArray = [];

    for(let i = 0; i < stringArray.length; i++) {
        const lowerCaseItem = stringArray[i].toLowerCase();
        lowerCaseArray.push(lowerCaseItem)
    }
    return lowerCaseArray;

}


module.exports = { checkUserGroupStatus, checkGroupExists, removeArrayDuplicates, convertElementsLowercase }





/*
async function checkUserGroupStatusORIGINAL(invitedUsers, groupID)  {
    const connection = db.getConnection(); 
    var groupUserStatus = {
        outcome: 200,
		existingUsers: [],
		newUsers: []
    }
    return new Promise(async function(resolve, reject) {
        const existingUsersSet = new Set();
        try {
            
            const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ?"			
            
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {
                    for(let i = 0; i < rows.length; i++) {
                        const userName = rows[i].user_name;
                        existingUsersSet.add(userName)
                    }

                    let existingUsers = Array.from(existingUsersSet);
                    groupUserStatus.existingUsers = existingUsers;
                    groupUserStatus.newUsers = invitedUsers.filter(item=>existingUsers.indexOf(item)==-1);

                    resolve(groupUserStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    console.log("REJECTED " + err);
                    reject(groupUserStatus);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            console.log("REJECTED " + err);
            reject(groupUserStatus);
        } 
    })

}


*/

/*
function learningStuff(invitedUsers, groupID)  {
    const connection = db.getConnection(); 

    try {
            
        const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ?"			
        
        connection.query(queryString, [groupID], (err, rows) => {
            if(!err) {
                for(let i = 0; i < rows.length; i++) {
                    const userName = rows[i].user_name;
                    console.log(userName);
                }
                console.log("_______________")
            } else {
                console.log("error!!!!!")
            }

        })

    } catch(error) {
        console.log("error!")
    } 
}
*/



/*
async function checkUserGroupStatus(groupUsers, groupID)  {
    const connection = db.getConnection(); 
    var groupUserStatus = {
        outcome: 200,
        newUsers: [],
        currentUsers: []
    }
    for(let i = 0; i < groupUsers.length; i++) {
        const queryString = "SELECT COUNT(*) AS requestCount FROM group_users WHERE user_name = ? AND group_id = ?"

        connection.query(queryString, [groupUsers[i], groupID], (err, rows) => {
            if (!err) {
                console.log(groupUsers[i] + " " + rows[0].requestCount) 
                groupUserStatus.currentUsers.push(groupUsers[i]);
            } else {    
                console.log("error")
            } 
        }) 
    }

    return new Promise(async function(resolve, reject) {
        try {
     
            resolve(groupUserStatus);
        } catch(err) {
            groupUserStatus.outcome = "rejected";
            reject(groupUserStatus);
        } 
    });

    /*

    var groupUserStatus = {
        outcome: 200,
        newUsers: [],
        currentUsers: []
    }
    

    return new Promise(async function(resolve, reject) {
        try {

            for(let i = 0; i < groupUsers.length; i++) {
                let groupUser = groupUsers[i];
                const queryString = "SELECT COUNT(*) AS requestCount FROM group_users WHERE user_name = ? AND group_id = ?"			
                
                connection.query(queryString, [groupUser, groupID], (err, rows) => {
                    if (!err) {
                        //groupUserStatus.currentUsers.push("test");
                        const groupUserCount = rows[0].requestCount;	
                        groupUserStatus.currentUsers.push("test");
                        //They are not in this group already 
                        if(groupUserCount == 0) {
                            console.log("Add them! " + groupUser + " Group ID " + groupID);
                            groupUserStatus.newUsers.push(groupUser);
                        } else {
                            console.log("Yo man there in the group " + groupUser + " Group ID " + groupID);
                            groupUserStatus.currentUsers.push(groupUser);
                            groupUserStatus.currentUsers.push("test");
                        }
                        
                    } else {
                        groupUserStatus.currentUsers.push("error");
                        groupUserStatus = 500;
                    }
                })
            }
    
            resolve(groupUserStatus); 
    
        } catch(err) {
            groupUserStatus.outcome = 500;
            console.log("REJECTED " + err);
            reject(groupUserStatus);
        } 
    });
    *//*
}
*/

/////


/////


//POST FUNCTIONS


