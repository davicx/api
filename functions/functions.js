const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');

//LOGIN FUNCTIONS
//Function A: Validate User with a Token
async function currentUserStatus(req, res) {
    console.log("currentUserStatus ")
    var userName = null;
    var accessToken = ""
    var refreshToken = ""
    var userLoggedIn = false

    var loginStatus = {
        userName: userName,
        userLoggedIn: userLoggedIn,
        accessToken: accessToken,
        refreshToken, refreshToken
    }

    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;
    userLoggedIn = req.cookies.loggedInUser;
    

    /*
    //Part 1: Determine Auth Type 
    cookieToken = req.cookies.accessToken;
    const authHeader = req.headers['authorization'];
    headerToken = authHeader && authHeader.split(' ')[1]
    var tokenType = ""
    
    if(cookieToken != undefined) {
        tokenType = "cookie"
    } else if(headerToken != undefined) {
        tokenType = "header"
    } else {
        tokenType = null;
    }

    //Part 2: Get the Token
    if(tokenType == "cookie") {
        var token = req.cookies.accessToken;
    } else if(tokenType == "header") {
        var token = authHeader && authHeader.split(' ')[1]
    } else {
        var token = null;
    }

    console.log("_____________________________________")
    console.log("TOKEN TYPE: " + tokenType)
    console.log("TOKEN: " + token)
    console.log("_____________________________________")

    //Part 3: Verify the Token 
    if (token == null) {
        console.log("You didn't present a token, no beuno!")
        //return res.sendStatus(401)
    } 

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
            console.log("your good")
            req.authorizationData = authorizationData

        } else {
            console.log("Not Logged In")
            //return res.sendStatus(403)
        }
    })
    */

    return loginStatus

}



//Function A1: Create Access Token 
async function generateAccessToken(currentUser, accessTokenLength) {
    //var accessToken = jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET);
    //Minute
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '60s'}); 

    //5 Minutes
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '300s'}); 
    
    //Hour
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '3600s'}); 
    
    //From Input 
    return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: accessTokenLength}); 
    
}

//Function A: Create a new Access Token from a Refresh Token 
async function generateTokenFromRefreshToken(currentUser, refreshToken, accessTokenLength) {

    return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: accessTokenLength}); 
    
}

/*

//Refresh Token
app.post("/token", (req, res) => {
    const refreshToken = req.body.refreshToken;
    console.log(refreshTokens);
    console.log(refreshToken);

    //res.send(req.body);
    
    //NEW I Think we need to check the refresh token is in the database 

    if(refreshToken == null) {
        return res.sendStatus(401)
    }
    if(!refreshTokens.includes(refreshToken)) {
        return res.sendStatus(403)
    }
    console.log("USER");
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        console.log(user);
        if(err) {
            return res.sendStatus(403)
        }
        const accessToken = generateAccessToken(user)
        res.json({accessToken: accessToken})
    })

});

//Logout 
app.delete("/logout", (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204);
});


//Access Token
function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30s'});
}




*/

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
    console.log("Function: getUserPassword")

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


module.exports = { currentUserStatus, generateAccessToken, checkIfUserExists, getUserPassword, checkUserGroupStatus, checkGroupExists, removeArrayDuplicates, convertElementsLowercase, removeUserFromLoginTable, removeUserFromProfileTable }



