const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');

const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
const Notifications = require('./classes/Notification')

/*
FUNCTIONS A: All Functions Related to User Login
	1) Function A1: Login User 
	2) Function A2: Logout User 
	3) Function A3: Register new User 
	4) Function A4: Login Status 
  5) Function A5: Delete a User 
  6) Function A6: Check if Cookie Expired 
	7) Function A7: Use Refresh Token to get New Access Token 
	8) Function A8: Get Token List 

FUNCTIONS B: All Helper Functions Related to User Login
	1) Function B1: Get New Access Token  
*/

//var tokenLength = '86000s'
var tokenLength = '3600s'
//var tokenLength = '12s'
//var tokenLength = '8s'

//FUNCTIONS A: All Functions Related to a User 
//Function A1: Login User 
async function userLogin(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  const userID = 1;
  const password = req.body.password;
  var loginSuccess = true;
  
  console.log("LOGIN USER: Logging in " + userName);

  var userExists = false;
  var passwordCorrect = false;
  var validUser = false;
  var refreshToken = "myRefreshToken";
  var accessToken = "myAccessToken";

  //STEP 1: Check if user Exists 
  const userExistsStatus = await Functions.checkIfUserExists(userName);
  console.log("THIS IS THE USERNAME TO USER " + userExistsStatus.userName)
  userExists = !!userExistsStatus.userExists;

  //STEP 2: Validate user and password
  if(userExists == true ) {
    
    console.log("STEP 1: User Exists PASS");
    const passwordOutcome = await Functions.getUserPassword(userName);
    const actualPassword = passwordOutcome.hashedPassword

    try {
      if(await bcrypt.compare(password, actualPassword)) {
        passwordCorrect = true;
        console.log("STEP 2: Valid Password PASS ");
      } else {
        console.log("STEP 2: Not a Valid Password");
      }
    } catch {
      console.log("CATCH error")
    }
  } else {
    console.log("STEP 1: Could not find user");
  }

  //STEP 3: Check for Valid User and Set Tokens 
  if(userExists == true && passwordCorrect == true) {
    validUser = true;
    loginSuccess = true;

    console.log("STEP 3: Valid User and password")

    //STEP 4: Generate Refresh and Access Tokens
    var accessToken = await Functions.generateAccessToken(userName, tokenLength) 
    var refreshToken = jwt.sign({currentUser: userName}, process.env.REFRESH_TOKEN_SECRET);
    console.log("STEP 4: Generated access and refresh tokens")

    //STEP 5: Add Refresh Token to Database
    //Await function new to database
    const clearQueryString = "DELETE FROM refresh_tokens WHERE user_name= ?;"		
    
    connection.query(clearQueryString, [userName], (err) => {
        if (!err) {
            console.log("Removed old refresh tokens " + userName);      
        } else {    
            console.log("Error Problem with the Database!")
            loginSuccess = false;
            console.log(err)
        } 
    }) 

    const queryString = "INSERT INTO refresh_tokens (refresh_token, user_name, user_id) VALUES (?,?,?)"
    
    connection.query(queryString, [refreshToken, userName, userID], (err, results) => {
        if (!err) {
            console.log("STEP 5: Added a refresh token to the database with ID " + results.insertId);      
        } else {    
            console.log("STEP 5: Error Problem with the Database!")
            loginSuccess = false;
            console.log(err)
        } 
    }) 

    //STEP 6: Set Cookies 
    loginSuccess = true;
    res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('refreshToken', refreshToken, {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})
    res.cookie('loggedInUser', userName,{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    console.log("STEP 6: Information was correct and cookies were set")
  
  //Login Information was not Correct   
  } else {
    loginSuccess = false;
    res.cookie('accessToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    //res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('refreshToken', "notLoggedIn", {maxAge: 60 * 1000 * 525600  , path: '/refresh', httpOnly: true})
    res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    console.log("STEP 6: Information was not correct and cookies are invalidated")
  }

  //STEP 7: Send login information 
  const loginObject = {
    loginSuccess: loginSuccess,
    loggedInUser: userExistsStatus.userName,
    validUser: validUser,
    passwordCorrect: passwordCorrect,
    accessToken: accessToken,
    refreshToken, refreshToken
  }


  //USE Temp change for swift below
  var loginOutcome = {
		data: loginObject,
		success: true,
		message: userName + "was succesfully logged in!", 
		statusCode: 200,
		errors: [], 
		currentUser: userExistsStatus.userName
	}
 
  console.log("STEP 7: Login information for user")
  console.log(loginOutcome);
  console.log("STEP 8: The User was succesfully logged in!")

  res.json(loginOutcome)
}

//Function A2: Logout User 
async function userLogout(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;

  //STEP 1: Remove all Access Tokens for User 
  const queryString = "DELETE FROM refresh_tokens WHERE user_name= ?;"			
            
  connection.query(queryString, [userName], (err, rows) => {
      if (!err) {
        //console.log(rows)
      } else {
        console.log(err)

      }
  })

  //STEP 2: Remove Access Tokens
  res.cookie('accessToken', "noAccessToken", {maxAge: 1, httpOnly: true})
  res.cookie('loggedInUser', "notLoggedIn",{maxAge: 1, httpOnly: true})
  res.cookie('refreshToken', "notLoggedIn", {maxAge: 1, path: '/refresh', httpOnly: true})

  res.json({logout: userName})
}

//Function A3: Register new User 
async function userRegister(req, res) {
  //const userName = req.body.userName.toLowerCase();
  const userName = req.body.userName;
  const fullName = req.body.fullName;
  const userEmail = req.body.email;
  const rawPassword = req.body.password
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.password, salt)
  var registerUserLoginOutcome = {}
  var registerUserProfileOutcome = {}

	const newUser = {
		userName: userName,
		fullName: fullName,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
	}

  let userName2 = "DA_Vid_"
  let userName3 = "david_"

  var areEqual = userName2.toUpperCase() === userName3.toUpperCase();
  /*
  var regexp = /^[a-zA-Z0-9-_-]+$/;
  var check = "checkme";

  if (userName.search(regexp) === -1)
      { console.log('invalid'); }
  else { 
    console.log('valid'); 
    }
*/
  //res.json({userName: areEqual})


  
  //STEP 1: Validate Information
  var registrationOutcome = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);
  registrationOutcome.UserRegistrationMessages = []
  registrationOutcome.userName = ""
  registrationOutcome.userID = 0

  //STEP 2: Check if Username is taken 
  const userExistsStatus = await Functions.checkIfUserExists(userName)
  console.log(userExistsStatus)

  //Step 1A: User Provided valid Information
  if(registrationOutcome.validUserRegistration == 1) {

      //Step 2A: Username is available 
      if(userExistsStatus.userExists == 0) {
        console.log("user name is good!")
        

        //STEP 3: Register the New User 
        registerUserLoginOutcome = await User.registerUserLogin(newUser)
        console.log("STEP 3A: registerUserLoginOutcome")
        console.log(registerUserLoginOutcome)
    
        const userID = registerUserLoginOutcome.userID
        newUser.userID = userID
        console.log("your new ID " + userID)

        registerUserProfileOutcome = await User.registerUserProfile(newUser)
        console.log("STEP 3B: registerUserProfileOutcome")
        console.log(registerUserProfileOutcome)     
        
        //Step 3A: User was sucesfully registered 
        if(registerUserLoginOutcome.outcome + registerUserProfileOutcome.outcome == 2) {
          console.log("EVERYTHING GOOD IN DATABSE")
          registrationOutcome.userName = userName
          registrationOutcome.userID = userID
          registrationOutcome.validUserRegistration = 1
          registrationOutcome.UserRegistrationMessages.push("you succesfully registered " + userName + " with the ID " + userID)
        } else {
          console.log("nope!")
        }
        
        res.json(registrationOutcome);

      //Step 2B: Username is taken 
      } else {
        console.log("user name is taken!")
        registrationOutcome.usernameStatus = 0
        registrationOutcome.usernameMessages = []
        registrationOutcome.usernameMessages.push("user name is taken")
        registrationOutcome.UserRegistrationMessages.push("user name is taken")
        registrationOutcome.validUserRegistration = 0
        res.json(registrationOutcome)
      }

  } else {

    //UserName is taken
    if(userExistsStatus.userExists == 1) {
      registrationOutcome.usernameStatus = 0
      registrationOutcome.usernameMessages = []
      registrationOutcome.usernameMessages.push("user name is taken")
      registrationOutcome.UserRegistrationMessages.push("user name is taken")
      registrationOutcome.validUserRegistration = 0
    }

    console.log("User needs to provide better name and stuff")
    registrationOutcome.UserRegistrationMessages.push("User needs to provide better name and stuff")
    registrationOutcome.validUserRegistration = 0
    res.json(registrationOutcome)
  }

  
} 

//Function A4: Login Status 
async function loginStatus(req, res) {
  console.log("")
  console.log("___________________________________________")
  console.log("loginFunctions: Function A4: Login Status ")
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  var refreshToken = "";
  var accessToken = ""
  var validAccessToken = false;
  var validRefreshToken = false;
  var refreshTokenMatches = false;

  var loginStatus = {
      userName: userName,
      userLoggedIn: false,
      accessToken: accessToken,
      validAccessToken: false,
      validRefreshToken: false
  }

  //STEP 1: Determine Auth Type for Access Token (probably need for refresh if we use header)
  refreshToken = req.cookies.refreshToken;
  cookieToken = req.cookies.accessToken;
  const authHeader = req.headers['authorization'];
  var headerToken = authHeader && authHeader.split(' ')[1]
  var tokenType = ""
  
  if(cookieToken != undefined) {
      tokenType = "cookie";
      accessToken = req.cookies.accessToken;
  } else if(headerToken != undefined) {
      tokenType = "header";
      accessToken = headerToken;
  } else if (accessToken == undefined && headerToken == undefined) {
      tokenType = null;
      console.log("STEP 1: no token");
  } else {
      tokenType = null;
      console.log("STEP 1: no token");
  }

  console.log("STEP 1: the token is from " + tokenType)

  //STEP 2: Verify Token 
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("STEP 2: The token was a good one! " + userName + " is logged in")
          console.log(authorizationData)
          validAccessToken = true;
          loginStatus.accessToken = req.cookies.accessToken
      } else {
          console.log("STEP 2: The token was no good no one is logged in")
          validAccessToken = false;
      }
  })
  
  //STEP 3: Check if the user has a refresh token and verify it
  if(refreshToken == null || refreshToken == "noRefreshToken") {
      validRefreshToken = false;
  } else {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
          currentUserFromToken = authData.currentUser;
          if(err) {
              validRefreshToken = false;
              console.log("STEP 3: The refresh token could not be verified");
          } else {
              validRefreshToken = true;
              console.log("STEP 3: The refresh token is verified");
          }
      })
  }
  
  //STEP 4: Verify that the database has a matching Refresh Token for the user 
  var refreshTokenDatabaseStatus = await Functions.verifyRefreshTokenInDatabse(refreshToken, userName)
  if(refreshTokenDatabaseStatus.validRefreshToken == true ) {
      refreshTokenMatches = true;
      loginStatus.validRefreshToken = true
      console.log("STEP 4: The refresh token was matched in the database ")
  } else {
      refreshTokenMatches = false;
      loginStatus.validRefreshToken = false
      console.log("STEP 4: The refresh token was NOT found in the database ")
  }
  
  //STEP 5: Determine Logged in Status 
  if(validAccessToken == true && refreshTokenMatches == true && validRefreshToken == true) {
      console.log("STEP 5: " + userName + " is currently logged in!");
      loginStatus.validAccessToken = true;
      loginStatus.validRefreshToken = true;
      loginStatus.userLoggedIn = true;
  } else {
      console.log("STEP 5: " + userName + " is currently not logged in!");
      loginStatus.userLoggedIn = false;
  }
  res.json(loginStatus)
}

//Function A5: Delete a User 
async function userDelete(req, res) {
  const userName = req.body.userName;
  const typeOfDelete = req.body.type;

  if(typeOfDelete == "permanent") {
    const loginStatus = await Functions.removeUserFromLoginTable(userName)
    const profileStatus = await Functions.removeUserFromProfileTable(userName)
    console.log(loginStatus)
    console.log(profileStatus)
    res.json({loginStatus: loginStatus, profileStatus: profileStatus})
  } else {
    //Temp delete means setting the user to active is zero 
    res.json({type: "Add temp delete"})
  }
}


//FUNCTIONS B: All Helper Functions Related to User Login
//Function B1: Get New Access Token 
async function getRefreshToken(req, res) {
  console.log("____________________________________________")
  console.log("LOGIN FUNCTIONS: Get a Refresh Token")
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  var currentUserFromToken = ""
  var accessToken = await Functions.generateAccessToken(userName, tokenLength)

  //This may be too much maybe make a smaller response and log this to the server
  var refreshTokenResponse = {
    messageFrom: "LOGIN FUNCTIONS: Requesting a new Access Token from an existing Refresh Token",
    userName: userName,
    currentUser: "",
    refreshTokenFound: false, 
    refreshTokenValid: false, 
    refreshTokenMatch: false,
    masterRefreshSuccess: false,
    logUserOut: false,
    messages: [],
    errorMessages: []
  }

  var refreshToken = "noRefreshToken"

  //STEP 1: Verify there is a refresh token 
  if(req.cookies.refreshToken) {
    refreshToken = req.cookies.refreshToken;
  } 

  if(refreshToken == null || refreshToken == "noRefreshToken") {

    //LOGOUT: No Token 
    console.log("STEP 1: No refresh token was sent so logout " + userName)
    refreshTokenResponse.refreshTokenFound = false;
    refreshTokenResponse.masterRefreshSuccess = false;
    refreshTokenResponse.logUserOut = true;
    refreshTokenResponse.messages.push("No refresh token was sent so logout")
  
    res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
    res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
    res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
    console.log(refreshTokenResponse)
    res.status(440).json(refreshTokenResponse)
    return 
  } else {

    //VALID: Token Found 
    console.log("STEP 1: A refresh token was found for " + userName)
    refreshTokenResponse.refreshTokenFound = true;
  }

  //STEP 2: Verify refresh token 
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
    if(err) {

      //LOGOUT: Not a valid token 
      console.log("STEP 2: The refresh token could not be verified")
      refreshTokenResponse.refreshTokenValid = false;
      refreshTokenResponse.masterRefreshSuccess = false;
      refreshTokenResponse.logUserOut = true;
      refreshTokenResponse.messages.push("Error verifying the refreshToken so logout user")
    
      res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
      res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
      res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
      console.log(refreshTokenResponse)
      res.status(440).json(refreshTokenResponse)
      return 
    } else {

      //VALID: Valid Token 
      currentUserFromToken = authData.currentUser;
      refreshTokenResponse.currentUser = currentUserFromToken;
      refreshTokenResponse.refreshTokenValid = true;
      console.log("STEP 2: The refresh token is verified")
    }
  })

  //STEP 3: Verify that the database has a matching Refresh Token for the user 
    var refresh_tokens = [];
    const queryString = "SELECT * FROM refresh_tokens WHERE refresh_token = ? AND user_name = ?";
  
    connection.query(queryString, [refreshToken, userName], (err, rows) => {
        if (!err) {
          refresh_tokens = rows.map((row) => {
            return {
              refreshTokenID: row.token_id,
              userName: row.user_name,
              refreshToken: row.refresh_token,
            }
          });
   
          //VALID: A valid token was found and matched in the database stay logged in! 
          if(refresh_tokens.length > 0) {
            console.log("STEP 3: The token was found in the database and matched for " + currentUserFromToken)
            console.log("____________________________________")
            res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})

            refreshTokenResponse.refreshTokenMatch = true;
            refreshTokenResponse.masterRefreshSuccess = true;
            refreshTokenResponse.accessToken = accessToken;
            refreshTokenResponse.messages.push("Need to get a new access token and it worked!")
            console.log(refreshTokenResponse)
         
            res.json(refreshTokenResponse)
            
          //LOGOUT: The token did not match    
          } else {
            refreshTokenResponse.masterRefreshSuccess = false;
            refreshTokenResponse.refreshTokenMatch = false;
            refreshTokenResponse.logUserOut = true;
            refreshTokenResponse.errorMessages.push("no worky yours didn't match the database")
            res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
            res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
            res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
            console.log(refreshTokenResponse)

            res.status(440).json(refreshTokenResponse)
            return 
          }
        
        //SERVER ERROR: Try again to get a token
        } else {
            console.log("Failed to Select Posts" + err)
            console.log("____________________________________")
            console.log(refreshTokenResponse)
            
            res.sendStatus(500)
            return
    }
    })

}


//Function B2: Check remaining token time (maybe don't need)
async function checkTokenTime(req, res) {
  const userName = req.body.userName;

  var cookieAccessToken = req.cookies.accessToken;
  var cookieRefreshToken = req.cookies.accessToken;
  var authHeader = req.headers['authorization'];
  var headerAccessToken = authHeader && authHeader.split(' ')[1]
  
  if(!cookieAccessToken) {
    cookieAccessToken = "no cookieAccessToken"
  }   
  if(!cookieRefreshToken) {
    cookieRefreshToken = "no cookieRefreshToken"
  }   
  if(!headerAccessToken) {
   headerAccessToken = "no headerAccessToken"
  }   

  var decoded = jwt_decode(cookieAccessToken);
  const tokenCreated = decoded.exp;
  const tokenFinished = decoded.iat;
  const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)
  var stillGood = false 
   
  if(tokenFinished - tokenCreated) {
    stillGood = true
  } 

  const response = {
    cookieAccessToken: cookieAccessToken, 
    cookieRefreshToken: cookieRefreshToken,
    created: tokenCreated,
    finished: tokenFinished,
    tokenGoodTell: dateTokenIsGoodTell,
    stillGood: stillGood
  }
  res.json(response)

}


module.exports = { userLogin, userRegister, loginStatus, userLogout, getRefreshToken, userDelete, checkTokenTime};










/*
//FUNCTIONS C: Validation 
function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + " " + strTime;
}

//Function C1: Check User
async function checkPosts(req, res) {
  const userName = req.body.userName;

  var cookieAccessToken = req.cookies.accessToken;
  var cookieRefreshToken = req.cookies.accessToken;
  var authHeader = req.headers['authorization'];
  var headerAccessToken = authHeader && authHeader.split(' ')[1]
  
  if(!cookieAccessToken) {
    cookieAccessToken = "no cookieAccessToken"
  }   
  if(!cookieRefreshToken) {
    cookieRefreshToken = "no cookieRefreshToken"
  }   
  if(!headerAccessToken) {
   headerAccessToken = "no headerAccessToken"
  }   

  var response = {
    currentUser: userName,
    responseUser: "none",
    cookieAccessToken: cookieAccessToken, 
    cookieRefreshToken: cookieRefreshToken,
    headerAccessToken: headerAccessToken,
    newToken: newToken,
  }

  //TEMP
  //Get Token Information 
  jwt.verify(headerAccessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if(err) {
        console.log("Not Logged In")
        return res.sendStatus(440)
    } else {
      //req.user = user;
      response.responseUser = user;
    }
  })

  //Get Time if good 
  var decoded = jwt_decode(cookieAccessToken);

  const tokenCreated = decoded.exp;
  const tokenFinished = decoded.iat;
  const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)

  var stillGood = false 
   
  if(tokenFinished - tokenCreated) {
    stillGood = true
  } 
  response.created = tokenCreated;
  response.finished = tokenFinished;
  response.tokenGoodTell = dateTokenIsGoodTell; 
  response.stillGood = stillGood;
  var e = formatDate(dateTokenIsGoodTell);
  response.formatDate = e;

  //TEMP



  console.log("___________________")
  console.log(response)
  console.log("___________________")

  res.json(response)

}

//Function A6: Delete a User 
//Function A5: Get Token List 
async function getTokenList(req, res) {
  console.log("getting all tokens")

  //STEP 1: Check against the database 
  const connection = db.getConnection(); 
  const tokenDeleted = 0;
  const queryString = "SELECT * FROM refresh_tokens LIMIT 10000";
  
  connection.query(queryString, (err, rows) => {
      if (!err) {
          const tokens = rows.map((row) => {
              return {
                  userName: row.user_name,
                  refreshToken: row.refresh_token,
                  tokenCreated: row.token_created,
              }
          });
  
          //res.setHeader('Access-Control-Allow-Origin', '*');
          res.json({tokens:tokens});
  
      } else {
          console.log("Failed to Select Posts" + err)
          res.sendStatus(500)
          return
      }
  })
}
//TEMP: This is just to get the token from either the cookie or header
async function getTokenType(req, res) {
  const userName = req.body.userName;
  const hasAccessToken = req.hasAccessToken;
  const accessToken = req.accessToken;
  const refreshToken = req.refreshToken;

  let tokenInformation = {
    userName: userName,
    hasAccessToken: hasAccessToken,
    accessToken: accessToken,
    refreshToken: refreshToken
  }
  
  res.json(tokenInformation);
}


//Function C2: Validate User 
function verifyUser(req, res, next) {
  console.log("Logged in User! ")
  
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
      return res.sendStatus(401)
  } 

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("your good")
          req.authorizationData = authorizationData
          next();
      } else {
          console.log("Not Logged In")
          return res.sendStatus(440)
      }
  })

}


  //STEP 2: Remove Access Tokens
  //res.cookie('accessToken', "noAccessToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('refreshToken', "noRefreshToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})
  res.cookie('accessToken', {expires: Date.now()})
  res.cookie('refreshToken', {expires: Date.now()})
  res.cookie('loggedInUser', {expires: Date.now()})
  res.cookie('refreshToken', {expires: Date.now(), path: '/refresh'})
  
  //cookies.set('loggedInUser', {expires: Date.now()});
  //cookies.set('accessToken', {expires: Date.now()});
  //cookies.set('refreshToken', {expires: Date.now()});
*/