const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');


/* FUNCTIONS 
FUNCTIONS A: Array and Validation Functions 
	1) Function A1: Clean a Username 
	2) Function A2: Clean a Username Array
	3) Function A3: Remove duplicate values from array
    4) Function A4: Convert an Array to a Set

//FUNCTIONS B: String Functions
    1) Function B1: Compare two Strings


//FUNCTIONS C: Cloud Functions
    1) Function C1: Get Environments


*/

//FUNCTIONS A: Validation Functions 
//Function A1: Clean a Username 
function cleanUserName(userName) {

    //STEP 1: Clean whitespace from name
    userName = userName.trim()

    //STEP 2: Create all lowercase
    userName = userName.toLowerCase()

    return userName;

}

//Function A2: Clean a Username Array
function cleanUserNameArray(usernameArray) {
    let newArray = []
    
    //STEP 1: Clean whitespace from name and convert to lowercase 
    for(let i = 0; i < usernameArray.length; i++) {
        let cleanUsername = usernameArray[i].toLowerCase().trim();
        newArray.push(cleanUsername)

    }

    return newArray;
}

//Method A3: Remove duplicate values from array
function removeArrayDuplicates(fullArray) {
    let uniqueSet = [...new Set(fullArray)];
    let uniqueArray = Array.from(uniqueSet);  
    return uniqueArray;
}

//Function A4: Convert an Array to a Set

//FUNCTIONS B: String Functions
//Function B1: Compare two Strings
function compareStrings(stringOneRaw, stringTwoRaw) {
    let stringOne = String(stringOneRaw);
    let stringTwo = String(stringTwoRaw);

    if(stringOne.toUpperCase().localeCompare(stringTwo.toUpperCase()) == 0) {
        return true;
    } else {
        return false;
    }
}



//FUNCTIONS C: Cloud Functions
//Function C1: Get Environments
function getCloudEnvironments(appLocation, fileLocation) {
    let cloud_type = "local_local"

    //Type 1: Local to Local 
	if(compareStrings(appLocation, "local") && compareStrings(fileLocation, "local")) {
		console.log("Post Router: Type 1: Local to Local")
        cloud_type = "local_local"

	//Type 2: Local to AWS 	
	} else if (compareStrings(appLocation, "local") && compareStrings(fileLocation, "aws")) {
		console.log("Post Router: Type 2: Local to AWS")
        cloud_type = "local_aws"

	//Type 3: AWS to AWS	
	} else if(compareStrings(appLocation, "aws") && compareStrings(fileLocation, "aws")) {
		console.log("Post Router: Type 3: AWS to AWS")
        cloud_type = "aws_aws"
	} else {
		cloud_type = "local_local"
	}

    return cloud_type
    
}










////

//CLEAN BELOW
////
/*
FUNCTIONS B: Login Functions 
	1) Function D1: Create Access Token  
	2) Function D2: Verify a refresh token is in the database  
	3) Function D3: Logout a user 
	4) Function D4: Check Token Time
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

//Method A1: Check if User Exists
async function checkIfUserExists(userName) {
    const connection = db.getConnection(); 

    var userExistsStatus = {
        outcome: 500,
		userExists: 1,
		userName: userName,
        userID: 0,
        messages: [],
		errors: []
    }

    //console.log("INSIDE FUNCTION checkIfUserExists " + userName)
    //console.log("INSIDE FUNCTION checkIfUserExists " + userName)
    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT user_id, user_name FROM user_login WHERE user_name = ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                //console.log(err)

                if (!err) {
                    if(rows.length < 1){
                       //console.log("IF")
                        //console.log("IF")
                        //console.log("IF")
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userExists = 0;
                    } else {
                        //console.log("ELSE")
                        //console.log("ELSE")
                        //console.log("ELSE")
                        //console.log("rows[0].user_name")
                        //console.log(userName)
                        //console.log(rows[0].user_name)
                        //console.log("rows[0].user_name")
                        userExistsStatus.outcome = 200;
                        userExistsStatus.userName = rows[0].user_name; 
                        userExistsStatus.userID = rows[0].user_id; 
                        userExistsStatus.messages.push("There is already a user with the name " + userName)
                        //console.log(rows)
                    }

                    resolve(userExistsStatus); 

                } else {
                    console.log("ERROR")
                    console.log(err)
                    userExistsStatus.outcome = 500;
                    resolve(userExistsStatus);
                }
            })
        } catch(err) {
            console.log("ERROR CATCH")
            console.log(err)
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


module.exports = { cleanUserName, cleanUserNameArray, getCloudEnvironments, removeArrayDuplicates, compareStrings, logoutUser, verifyRefreshTokenInDatabse, generateAccessToken, checkIfUserExists, getUserPassword, removeArrayDuplicates, removeUserFromLoginTable, removeUserFromProfileTable, checkRemainingTokenTime }


//APPENDIX

/*
function getAllPostsPagination(req, res) {
	const connection = db.getConnection(); 	

	const page = parseInt(req.query.page);
	const limit = parseInt(req.query.limit);
	const maxPages = "include this in the query"

	if(isNaN(page)|| isNaN(limit)) {
		
	} else {
		console.log("page " + page + " limit " + limit)
		console.log("page " + page + " limit " + limit)

		const startIndex = (page - 1) * limit
		const endIndex = page * limit 
	
		console.log("startIndex " + startIndex + " endIndex " + endIndex)
	
		//Start and End 
		var results = {}
			
		//Check this is less then total amount
		//if(endIndex < )
		results.next = {
			page: page + 1,
			limit: limit
		}
	
		if(startIndex > 0) {
			results.previous = {
				page: page - 1,
				limit: limit
			}
		}	
	
		//const queryString = "SELECT * FROM posts WHERE post_id = ?";
		//const queryString = "SELECT * FROM posts ORDER BY post_id DESC LIMIT ? OFFSET ?";
		const queryString = "SELECT * FROM posts ORDER BY post_id LIMIT ? OFFSET ?";
	
		connection.query(queryString, [limit, startIndex], (err, rows) => {
			 if (!err) {
	 
				 //Return Object 
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
	 
				 //res.json({posts:posts});
				 results.posts = posts
				 res.json(results);
	 
			 } else {
				 console.log("Failed to Select Posts" + err)
				 res.sendStatus(500)
				 return
			 }
		})
	}


 }

 function paginatedResults(model) {
	return (req, res, next) => {
		const page = parseInt(req.query.page);
		const limit = parseInt(req.query.limit);
	
		console.log("page " + page + " limit " + limit)
	
		const startIndex = (page - 1) * limit
		const endIndex = page * limit 
	
		var results = {}
		
		//Check this is less then total amount
		//if(endIndex < )
		results.next = {
			page: page + 1,
			limit: limit
		}
	
		if(startIndex > 0) {
			results.previous = {
				page: page - 1,
				limit: limit
			}
		}
	res.paginatedResults = results
	}
 }
 */

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


 /*
    var commentOutcome = {
        success: false,
        comments: []
    }

    //COMMENT
    const queryString =	"SELECT comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comments INNER JOIN user_profile ON comments.comment_from = user_profile.user_name WHERE comments.post_id = ?"


    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [postID], (err, rows) => {
                if (!err) {
                    const comments = rows.map((row) => {
                        return {
                            postID: row.post_id,
                            commentCaption: row.comment,
                            commentFrom: row.comment_from,
                            commentType: row.comment_type,	
                            userName: row.user_name,	
                            imageName: row.image_name,	
                            firstName: row.first_name,	
                            lastName: row.last_name,	
                            commentLikes: [],
                            created: row.created
                        }
                    });
                    commentOutcome.comments = comments;
                    commentOutcome.success = true;

                    resolve(commentOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(commentOutcome);
                }
           })
            
        } catch(err) { 
            reject(commentOutcome);
        } 
    })
    */
    

/*
async function getPostCommentsNOTNEEDED(postID)  {
    const connection = db.getConnection(); 

    const queryString = "SELECT comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comments INNER JOIN user_profile ON comments.comment_from = user_profile.user_name WHERE comments.post_id = ?"
    var commentsOutcome = {
        success: false,
        comments: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [postID], (err, rows) => {
                if (!err) {
    
                    commentsArray = rows.map((row) => {
                        console.log(row)
                        
                        return {
                            postID: row.post_id,
                            commentCaption: row.comment,
                            commentFrom: row.comment_from,
                            commentType: row.comment_type,	
                            userName: row.user_name,	
                            imageName: row.image_name,	
                            firstName: row.first_name,	
                            lastName: row.last_name,	
                            commentLikes: [],
                            created: row.created
                        }
                    });
                    
                    commentsOutcome.success = true;
                    commentsOutcome.comments = commentsArray;
                    
                    
                    resolve(commentsOutcome);
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(commentsOutcome);
                }
            })
            
        } catch(err) { 
            reject(commentsOutcome);
        } 
    })
   
}

*/