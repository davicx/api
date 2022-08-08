const db = require('./conn');
const bcrypt = require('bcrypt')
//https://stackoverflow.com/questions/40141332/node-js-mysql-error-handling

//LOGIN FUNCTIONS
//Method A1: Check if User Exists
async function checkIfUserExists(userName) {
    const connection = db.getConnection(); 

    var userExistsStatus = {
        outcome: 500,
		userExists: 1,
        userID: 0,
        messages: [],
		errors: []
    }

    //console.log("checkIfUserExists " + userName)

    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT user_id FROM user_login WHERE user_name = ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    if(rows.length < 1){
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userExists = 0;
                    } else {
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userID = rows[0].user_id;
                        userExistsStatus.messages.push("There is already a user with the name " + userName)
                    }

                    resolve(userExistsStatus); 

                } else {
                    userExistsStatus.outcome = 500;
                    resolve(userExistsStatus);
                }
            })
        } catch(err) {
            userExistsStatus.outcome = 500;
            reject(userExistsStatus);
        } 
    })

}

//Method A2: Login User (Validate username and password)
async function getUserPassword(userName) {
    const connection = db.getConnection(); 
    console.log("Function: loginUser")

    var loginUserStatus = {
        outcome: 500,
        hashedPassword: '',
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT password FROM user_login WHERE user_name = ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    //console.log("_________ROWS_________");
                    //console.log(rows);
                    //console.log("_________ROWS_________");

                    //const userHashedPassword = "temp";
                    const userHashedPassword = rows[0].password;
                    loginUserStatus.hashedPassword = userHashedPassword;

                    resolve(loginUserStatus); 

                } else {
                    loginUserStatus.errors.push(err);
                    resolve(loginUserStatus);
                }
            })
        } catch(err) {
            loginUserStatus.errors.push(err);
            reject(loginUserStatus);
        } 
    })

    /*
      try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      res.send('Success')
    } else {
      res.send('Not Allowed')
    }
  } catch {
    res.status(500).send()
  }
  */
}

//Method A3: Remove User from Login Table 
async function removeUserFromLoginTable(userName)  {
    const connection = db.getConnection(); 

    var removeStatus = {
        outcome: 500,
        message: "",
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {			
            const queryString = "DELETE FROM user_login WHERE user_name= ?;"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    removeStatus.outcome = 200
                    removeStatus.message = userName + " removed from Login Table"
                    resolve(removeStatus); 
                } else {
                    removeStatus.errors.add(err)
                    resolve(removeStatus);
                }
            })
        } catch(err) {
            removeStatus.errors.add(err)
            reject(removeStatus);
        } 
    })
}

//Method A4: Remove User from Profile Table 
async function removeUserFromProfileTable(userName)  {
    const connection = db.getConnection(); 

    var removeStatus = {
        outcome: 500,
        message: "",
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {	
            const queryString = "DELETE FROM user_profile WHERE user_name= ?;"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    removeStatus.outcome = 200
                    removeStatus.message = userName + "removed from Profile Table"
                    resolve(removeStatus); 
                } else {
                    removeStatus.errors.add(err)
                    resolve(removeStatus);
                }
            })
        } catch(err) {
            removeStatus.errors.add(err)
            reject(removeStatus);
        } 
    })
}

//Method A5: Update User to not active in the User Profile Table 
//*** I JUST MADE THIS DONT KNOW IF IT WORKS = )
async function makeUserNotActiveInProfileTable(userName)  {
    const connection = db.getConnection(); 

    var activeStatus = {
        outcome: 500,
        message: "",
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {	
            const queryString = "UPDATE user_profile SET active_member = '0' WHERE user_name = ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    activeStatus.outcome = 200
                    activeStatus.message = userName + "User is no longer active in the Profile Table"
                    resolve(activeStatus); 
                } else {
                    activeStatus.errors.add(err)
                    resolve(activeStatus);
                }
            })
        } catch(err) {
            activeStatus.errors.add(err)
            reject(activeStatus);
        } 
    })
}

async function makeUserNotActiveInLoginTable(userName)  {
}

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


module.exports = { checkIfUserExists, getUserPassword, checkUserGroupStatus, checkGroupExists, removeArrayDuplicates, convertElementsLowercase, removeUserFromLoginTable, removeUserFromProfileTable }





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


