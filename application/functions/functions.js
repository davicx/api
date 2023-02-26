const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');



//LOGIN FUNCTIONS

/* FUNCTIONS 
FUNCTIONS A: User Functions
	1) Function A1: 

FUNCTIONS B: Group Functions 
	1) Function H1: Get All User Groups

FUNCTIONS D: Login Functions 
	1) Function D1: Create Access Token  
	2) Function D2: Verify a refresh token is in the database  
	3) Function D3: Logout a user 
	4) Function D4: Check Token Time

//FUNCTIONS E: Post Functions 
    1) Get all Posts
    2) Get all Post Comments
    3) Get all Post Likes 

*/

//FUNCTIONS D: Login Functions 
//Function D1: Create Access Token 
async function generateAccessToken(currentUser, accessTokenLength) {
    //Minute
     //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '60s'}); 
 
     //5 Minutes
     //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '300s'}); 
     
     //Hour
     //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '3600s'}); 
     
     //From Input 
     return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: accessTokenLength}); 
     
 }

//Function D2: Verify a refresh token is in the database 
async function verifyRefreshTokenInDatabse(refreshToken, userName) {
    const connection = db.getConnection(); 

    var refreshTokenStatus = {
		userName: userName,
		validRefreshToken: false,
        messages: [],
		errors: []
    }

    //console.log("INSIDE FUNCTION verifyRefreshTokenInDatabse " + userName)

    return new Promise(async function(resolve, reject) {
        try {         
            var refresh_tokens = [];
            const queryString = "SELECT * FROM refresh_tokens WHERE refresh_token = ? AND user_name = ?";		
            
            //Database Call
            connection.query(queryString, [refreshToken, userName], (err, rows) => {
                if (!err) {
                    refresh_tokens = rows.map((row) => {
                        return {
                            refreshTokenID: row.token_id,
                            userName: row.user_name,
                            refreshToken: row.refresh_token,
                        }
                    });

                    if(refresh_tokens.length > 0) {
                        refreshTokenStatus.messages.push("The token was found in the database and matched for " + userName)
                        refreshTokenStatus.validRefreshToken = true;
                    } else {
                        refreshTokenStatus.messages.push("The token was NOT found in the database " + userName)
                        refreshTokenStatus.validRefreshToken = false;
                    }

                    resolve(refreshTokenStatus); 
                
                } else {
                    refreshTokenStatus.errors.push("There was an error trying to get the refresh token from the database ")
                    refreshTokenStatus.errors.push(err);
                    refreshTokenStatus.validRefreshToken = false;
                    reject(refreshTokenStatus);
                }
            })

        //Catch all other error  
        } catch(err) {
            refreshTokenStatus.errors.push(err);
            refreshTokenStatus.validRefreshToken = false;
            reject(refreshTokenStatus);
        } 
    })

}

//Function D3: Logout a user 
async function logoutUser(userName) {
    const connection = db.getConnection(); 

    //STEP 1: Remove Access Tokens
    res.cookie('accessToken', "noAccessToken", {maxAge: 1, httpOnly: true})
    res.cookie('loggedInUser', "notLoggedIn",{maxAge: 1, httpOnly: true})
    res.cookie('refreshToken', "notLoggedIn", {maxAge: 1, path: '/refresh', httpOnly: true})

    //STEP 2: Remove all Access Tokens for User 
    const queryString = "DELETE FROM refresh_tokens WHERE user_name= ?;"			
              
    connection.query(queryString, [userName], (err, rows) => {
        if (!err) {
            console.log("Removed user's refresh token from the database")
            return "success"
        } else {
            console.log("There was an error trying to remove the user")
            console.log(err)
            return "error"
        }
    })  
}

//Function D4: Check Token Time
function checkRemainingTokenTime(token) {
    var decoded = jwt_decode(token);
    const tokenCreated = decoded.exp;
    const tokenFinished = decoded.iat;
    const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)

    var tokenTimeRemaining = {
        stillGood: false,
        tokenCreated: decoded.exp,
        tokenFinished: decoded.iat,
        minutesRemaining: 0,
        secondsRemaining: 0,
        tokenGoodTellDate: dateTokenIsGoodTell
    }

    //current date in seconds since epoch
    var d = new Date();
    var currentSecondsSinceEpoch = Math.round(d.getTime() / 1000);
    const tokenLifeSeconds = (tokenCreated - tokenFinished);
    const tokenLifeMinutes = tokenLifeSeconds / 60;

    tokenTimeRemaining.tokenLifeMinutes = tokenLifeMinutes
    //tokenTimeRemaining.minutesRemaining = tokenLifeMinutes
    tokenTimeRemaining.secondsRemaining = tokenLifeSeconds + (tokenFinished - currentSecondsSinceEpoch)
    tokenTimeRemaining.minutesRemaining = tokenLifeSeconds + (tokenFinished - currentSecondsSinceEpoch) / 60

    //console.log("STEP 4: Token life minutes: " + tokenLifeMinutes + " seconds: " + tokenLifeSeconds);
    if(tokenFinished - tokenCreated) {
        tokenTimeRemaining.stillGood = true
    } else {
        tokenTimeRemaining.stillGood = true
    }

    return tokenTimeRemaining;
}




////
//CLEAN BELOW
////




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

    console.log("INSIDE FUNCTION checkIfUserExists " + userName)

    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT user_id FROM user_login WHERE user_name = ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                console.log(err)

                if (!err) {
                    if(rows.length < 1){
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userExists = 0;
                    } else {
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userID = rows[0].user_id;
                        userExistsStatus.messages.push("There is already a user with the name " + userName)
                        console.log(rows)
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
    //console.log("Function: getUserPassword")

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
            
            const queryString = "SELECT created_by FROM shareshare.groups WHERE group_id = ?"			
            
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

//FUNCTIONS E: Post Functions 
//Get all Posts
async function getAllPosts()  {
    const connection = db.getConnection(); 
    console.log("Yoo!! GET ALL POSTS")

    const queryString = "SELECT * FROM posts ORDER BY post_id DESC";
    var postsOutcome = {
        success: false,
        posts: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, (err, rows) => {
                if (!err) {
                    const posts = rows.map((row) => {
                        return {
                            postID: row.post_id,
                            postType: row.post_type,
                            groupID: row.group_id,
                            listID: row.list_id,
                            postFrom: row.post_from,
                            postTo: row.post_to,
                            postCaption: row.post_caption,
                            fileName: row.file_name,
                            fileNameServer: row.file_name_server,
                            fileUrl: row.file_url,
                            videoURL: row.video_url,
                            videoCode: row.video_code,
                            created: row.created
                        }
                    });
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
    
}

//Get all Post Comments
//Get all Post Likes 
async function getPostLikes(postID)  {
    const connection = db.getConnection(); 

    
    const queryString = "SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name,  user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_id = ?"

    var postLikesOutcome = {
        success: false,
        postLikes: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [postID], (err, rows) => {
                if (!err) {
                    console.log(rows)
                    /*
                    postLikes = rows.map((row) => {
                        return {
                            postLikeID: row.post_like_id,
                            postID: row.post_id,
                            likedBy: row.liked_by,
                            likedByName: row.liked_by_name,
                            timestamp: row.timestamp
                        }
                    });
                    postLikesOutcome.success = true;
                    postLikesOutcome.postLikes = postLikes;
                    */
                    resolve(postLikesOutcome);
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postLikesOutcome);
                }
            })
            
        } catch(err) { 
            reject(postLikesOutcome);
        } 
    })
}





module.exports = { logoutUser, verifyRefreshTokenInDatabse, generateAccessToken, checkIfUserExists, getUserPassword, checkUserGroupStatus, checkGroupExists, removeArrayDuplicates, convertElementsLowercase, removeUserFromLoginTable, removeUserFromProfileTable, checkRemainingTokenTime, getPostLikes, getAllPosts }




/*
//Function A: Create a new Access Token from a Refresh Token 
async function generateTokenFromRefreshToken(currentUser, refreshToken, accessTokenLength) {

    return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: accessTokenLength}); 
    
}
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
