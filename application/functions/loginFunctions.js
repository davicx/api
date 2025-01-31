const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');

const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const timeFunctions = require('./timeFunctions');
const Login = require('./classes/Login')
const User = require('./classes/User')

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

  var loginOutcome = {
		data: {},
		success: false,
		message: "No login Message", 
		statusCode: 500,
		errors: [], 
		currentUser: req.body.userName
	}

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
        loginOutcome.message = "STEP 2: Not a Valid Password";
      }
    } catch {
      console.log("CATCH error")
      loginOutcome.message = "STEP 2: An Unknown error occured logging you in";
    }
  } else {
    console.log("STEP 1: Could not find user");
    loginOutcome.message = "STEP 1: Could not find user";
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
            loginOutcome.message = "STEP 5: Error Problem with the Database!";
            loginSuccess = false;
            console.log(err)
        } 
    }) 

    const queryString = "INSERT INTO refresh_tokens (refresh_token, user_name, user_id) VALUES (?,?,?)"
    
    connection.query(queryString, [refreshToken, userName, userID], (err, results) => {
        if (!err) {
            console.log("STEP 5: Added a refresh token to the database with ID " + results.insertId);      
        } else {    
            loginOutcome.message = "STEP 5: Error Problem with the Database!";
            console.log("STEP 5: Error Problem with the Database!")
            loginSuccess = false;
            console.log(err)
        } 
    }) 

    //STEP 6: Set Cookies 
    loginSuccess = true;
    loginOutcome.message = "Succesfully logged " + req.body.userName + " in!";
    loginOutcome.success = true
    loginOutcome.statusCode = 200
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
    //loginOutcome.message = "STEP 6: Information was not correct and cookies are invalidated";
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

  loginOutcome.data = loginObject
 
  console.log("STEP 7: Login information for user")
  console.log(loginOutcome);
  if(loginSuccess == true) {
    console.log("STEP 8: The User was succesfully logged in!")

  } else {
    console.log("STEP 8: Sorry dude The User was NOT logged in!")
 
  }
  
  //res.json(loginOutcome)
  res.json(loginOutcome)
}

//Function A2: Logout User 
async function userLogout(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;

  console.log("API logout userName " + userName)

  var logoutOutcome = {
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: req.body.userName
	}

  //STEP 1: Remove all Access Tokens for User 
  const logoutClassResult = await Login.logoutUser(userName)
  logoutOutcome.data = {
    logoutSuccess: logoutClassResult.success
  }

  if(logoutClassResult.success == true) {
    logoutOutcome.success = true
    logoutOutcome.message = "API logout userName " + userName
    
  } else {
    logoutOutcome.success = false
    logoutOutcome.message = "Had an error logging out" + userName
    
  }

  //STEP 2: Remove Access Tokens
  res.cookie('accessToken', "noAccessToken", {maxAge: 1, httpOnly: true})
  res.cookie('loggedInUser', "notLoggedIn",{maxAge: 1, httpOnly: true})
  res.cookie('refreshToken', "notLoggedIn", {maxAge: 1, path: '/refresh', httpOnly: true})

  res.json(logoutOutcome)
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
  var masterValidationSuccess = false
  var masterUsernameAvailable = false
  var masterSuccess = false

  var registrationOutcome = {
		data: {},
		success: false,
		message: "No Register Message", 
		statusCode: 500,
		errors: [], 
		currentUser: req.body.userName
	}

  //This is internal new user
  var newUser = {
    userName: userName,
		fullName: fullName,
    userID: 0,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
  }

  //This is returned in response
  var registeredUser = {
    userName: "",
    fullName: "",
    userID: 0,
    userEmail: "",
  }

  var registrationValidation = {
    masterSuccess: false,
    validationSuccess: false,
    emailStatus: 0,
    emailMessage: "",
    usernameStatus: 0,
    usernameMessage: "",
    passwordStatus: 0,
    passwordMessage: "",
    usernameAvailableStatus: 0,
    usernameAvailableMessage: "",
  }

  registrationOutcome.data.newUser = registeredUser

  //STEP 1: Validate Information
  var registrationValidationOutcome = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);
  console.log("STEP 1: Validate Information")
  
  registrationValidation.emailStatus = registrationValidationOutcome.emailStatus
  registrationValidation.emailMessage = registrationValidationOutcome.emailMessages[0]

  registrationValidation.usernameStatus = registrationValidationOutcome.usernameStatus
  registrationValidation.usernameMessage = registrationValidationOutcome.usernameMessages[0]

  registrationValidation.passwordStatus = registrationValidationOutcome.passwordStatus
  registrationValidation.passwordMessage = registrationValidationOutcome.passwordMessages[0]
  

  //Step 1A: User Provided valid Information
  if(registrationValidationOutcome.validUserRegistration == 1) {
    masterValidationSuccess = true
    registrationValidation.validationSuccess = true

    console.log("Step 1A: User Provided valid Information")

  //Step 1B: User Did not provid valid Information
  } else {
    masterValidationSuccess = false
    registrationOutcome.data.registrationValidation = registrationValidation

    console.log("Step 1B: User Did not provid valid Information")

  }


  //STEP 2: Check if Username is taken 
  if(registrationValidationOutcome.validUserRegistration) {
    const userExistsStatus = await Functions.checkIfUserExists(userName)

    //Step 2A: Username is available 
    if(userExistsStatus.userExists == 0) {
      registrationValidation.usernameAvailableStatus = 1
      registrationValidation.usernameAvailableMessage = "The username " + userName + " is available."
      masterUsernameAvailable = true

      console.log("Step 2A: user name is good!")
            
    //Step 2B: Username is taken   
    } else {
      registrationValidation.usernameAvailableStatus = 0
      registrationValidation.usernameAvailableMessage = "The username " + userName + " is NOT available."
      masterUsernameAvailable = false
      registrationOutcome.message = "NEED MORE registrationOutcome.messageUser name " + userName + "  is taken!"
      console.log("The user name is taken!")
    }
  }

  //STEP 3: Register the New User 
  if(masterValidationSuccess == true && masterUsernameAvailable == true) {
    console.log("STEP 3: YAY!! REgister")
    
    //STEP 3A: Register the New User in User Login
    let registerUserLoginOutcome = await User.registerUserLogin(newUser)
    //console.log(registerUserLoginOutcome)
    console.log("newUser")
    console.log(newUser)
    console.log("newUser")

    //Create the user ID
    const userID = registerUserLoginOutcome.userID
    newUser.userID = userID
    console.log("STEP 3A: Register the New User in User Login with the user id " + userID)
    console.log("your new ID " + userID)

    //STEP 3B: Register the New User in User Profile
    let registerUserProfileOutcome = await User.registerUserProfile(newUser)
    console.log("3B: Register the New User in User Profile")
    //console.log(registerUserProfileOutcome)     
    
    //STEP 4: Success
    if(registerUserLoginOutcome.outcome + registerUserProfileOutcome.outcome == 2) {
      console.log("EVERYTHING GOOD IN DATABSE")

      //Update Validation 
      registrationValidation.masterSuccess = true

      //Update API response
      registrationOutcome.success = true
      registrationOutcome.statusCode = 200
      registrationOutcome.message = " NEED TO FIX You successfully Registered " + userName + "!"

      //Add new User to API Response
      registeredUser.userName = newUser.userName
      registeredUser.fullName = newUser.fullName
      registeredUser.userID = newUser.userID
      registeredUser.userEmail = newUser.userEmail

      registrationOutcome.data.newUser = registeredUser
      console.log("STEP 4: Success it worked!!!")

    } else {
      //TO DO: Roll back any inserted data that failed 
      console.log("STEP 4: nope!")
      registrationOutcome.message = "NEED TO FIX There was an error with registering " + userName + "!"
    }
    
  } else {
    console.log("STEP 3: ohh no dont REgister")

  }


  console.log(" ")
  console.log("________________________________________________ ")
  console.log("userName " + userName + " fullName " + fullName + " userEmail " + userEmail + " rawPassword " + rawPassword )
  console.log("Time was " + timeFunctions.getCurrentTime().postTime)
  console.log("________________________________________________ ")
  console.log(" ")

  registrationOutcome.data.registrationValidation = registrationValidation
  
  res.json(registrationOutcome)

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
    data: {},
    success: false,
    messages: [],
    statusCode: 500,
    errors: [],
    currentUser: "Not Verified"
}

  //STEP 1: Determine Auth Type for Access Token (probably need for refresh if we use header)
  refreshToken = req.cookies.refreshToken;
  console.log("refreshToken " + refreshToken)
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

  loginStatus.data.tokenType = tokenType

  console.log("STEP 1: the token is from " + tokenType)

  //STEP 2: Verify Token 
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("STEP 2: The token was a good one! " + userName + " is logged in")
          console.log("Step 2: Authorization Data ")
          console.log(authorizationData)
          loginStatus.accessToken = req.cookies.accessToken
          loginStatus.currentUser = authorizationData.currentUser
          validAccessToken = true
          loginStatus.data.userNameFromToken = authorizationData.currentUser
          //loginStatus.data.currentUser = req.cookies.accessToken

      } else {
          console.log("STEP 2: The token was no good no one is logged in")
          loginStatus.messages.push("STEP 2: The token was no good no one is logged in")
          validAccessToken = false;
          loginStatus.data.accessToken = "No Token"
      }
  })
    
  //STEP 3: Check if the user has a refresh token and verify it
  if(refreshToken == null || refreshToken == "noRefreshToken") {
      validRefreshToken = false;
      loginStatus.messages.push( "STEP 3: The refresh token was not found")
      console.log("STEP 3: The refresh token was not found");
  } else {
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
          currentUserFromToken = authData.currentUser;
          if(err) {
            validRefreshToken = false;
            loginStatus.messages.push("STEP 3: The refresh token could not be verified")
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
      validRefreshToken = true
      console.log("STEP 4: The refresh token was matched in the database ")
  } else {
      refreshTokenMatches = false;
      validRefreshToken = false
      loginStatus.messages.push("STEP 4: The refresh token was NOT found in the database")
      console.log("STEP 4: The refresh token was NOT found in the database ")
  }
  
  //STEP 5: Determine Logged in Status 
  if(validAccessToken == true && refreshTokenMatches == true && validRefreshToken == true) {
      console.log("STEP 5: " + userName + " is currently logged in!");
      validAccessToken = true;
      validRefreshToken = true;
      userLoggedIn = true;

      loginStatus.data.accessToken = accessToken;
      loginStatus.data.refreshToken = refreshToken;
      loginStatus.data.validAccessToken = validAccessToken;
      loginStatus.data.validRefreshToken = validRefreshToken;
      loginStatus.data.refreshTokenMatches = refreshTokenMatches;

      loginStatus.success = true
      loginStatus.statusCode = 200
      loginStatus.messages.push(userName + " is currently logged in!")
      
  } else {  
      console.log("STEP 5: " + userName + " is currently not logged in!");
      loginStatus.messages.push("STEP 5: " + userName + " is currently not logged in!")
      loginStatus.userLoggedInMessage = userName + " is currently NOT logged in!"
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


    



  /*
  STEP 1: Validate Information

  STEP 2: Check if Username is taken (if they gave good information )
  
  STEP 3: Register the New User
  Step 3A: Register User Login 
  Step 3A: Register User Profile 
        registerUserLoginOutcome = await User.registerUserLogin(newUser)
        registerUserProfileOutcome = await User.registerUserProfile(newUser)
  */

  /*

  //SORT BELOW
  var registerUserLoginOutcome = {}
  var registerUserProfileOutcome = {}

	var newUser = {
		userName: userName,
		fullName: fullName,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
	}

  var registeredUser = {
    userName: "",
		fullName: "",
    userID: 0,
		userEmail: "",
  }


  //STEP 2: Check if Username is taken 
  const userExistsStatus = await Functions.checkIfUserExists(userName)
  console.log(userExistsStatus)

  //Step 1A: User Provided valid Information
  if(registrationValidationOutcome.validUserRegistration == 1) {

      //Step 2A: Username is available 
      if(userExistsStatus.userExists == 0) {
        console.log("user name is good!")
        
        //STEP 3: Register the New User 
        registerUserLoginOutcome = await User.registerUserLogin(newUser)
        console.log("STEP 3A: registerUserLoginOutcome")
        console.log(registerUserLoginOutcome)
    
        const userID = registerUserLoginOutcome.userID
        newUser.userID = userID
        registeredUser.userID = userID
        console.log("your new ID " + userID)

        registerUserProfileOutcome = await User.registerUserProfile(newUser)
        console.log("STEP 3B: registerUserProfileOutcome")
        console.log(registerUserProfileOutcome)     
        
        //SUCCESS
        //Step 3A: User was sucesfully registered 
        if(registerUserLoginOutcome.outcome + registerUserProfileOutcome.outcome == 2) {
          console.log("EVERYTHING GOOD IN DATABSE")
          registrationOutcome.success = true
          registrationOutcome.statusCode = 200
          registrationOutcome.message = "You successfully Registered " + userName + "!"
     
          var registrationOutcome = {
            data: {},
            success: false,
            message: "No Register Message", 
            statusCode: 500,
            errors: [], 
            currentUser: req.body.userName
          }

          registeredUser.userName = userName
          registeredUser.fullName = fullName
          registeredUser.userEmail = userEmail

          registrationValidationOutcome.UserRegistrationMessages.push("you succesfully registered " + userName + " with the ID " + userID)


        } else {
          console.log("nope!")
          registrationOutcome.message = "There was an error with registering " + userName + "!"
     
        }
        
        //res.json(registrationValidationOutcome);

      //Step 2B: Username is taken 
      } else {
        console.log("user name is taken!")
        registrationOutcome.message = userName + " user name is taken!"
        registrationValidationOutcome.usernameStatus = 0
        registrationValidationOutcome.usernameMessages = []
        registrationValidationOutcome.usernameMessages.push("user name is taken")
        registrationValidationOutcome.UserRegistrationMessages.push("user name is taken")
        registrationValidationOutcome.validUserRegistration = 0
        //res.json(registrationValidationOutcome)
      }

  } else {

    //UserName is taken
    if(userExistsStatus.userExists == 1) {
      registrationOutcome.message = userName + "user name is taken!"
      registrationValidationOutcome.usernameStatus = 0
      registrationValidationOutcome.usernameMessages = []
      registrationValidationOutcome.usernameMessages.push("user name is taken")
      registrationValidationOutcome.UserRegistrationMessages.push("user name is taken")
      registrationValidationOutcome.validUserRegistration = 0
    }

    console.log("User needs to provide better name and stuff")
    registrationValidationOutcome.UserRegistrationMessages.push("User needs to provide better name and stuff")
    registrationValidationOutcome.validUserRegistration = 0
    //res.json(registrationValidationOutcome)
  }

  registrationOutcome.data.registrationMessages = registrationValidationOutcome
  registrationOutcome.data.registeredUser = registeredUser


  res.json(registrationOutcome)
  */