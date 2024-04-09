const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
//const cookieParser = require('cookie-parser');
//app.use(cookieParser())

const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
const Notifications = require('./classes/Notification')

/*
FUNCTIONS A: All Functions Related to User Login
	1) Function A1: Login User 
	2) Function A2: Login Status 
	3) Function A3: Logout User 
	4) Function A4: Register
  5) Function A5: Get New Access Token
  6) Function A6: Get a List of All Tokens 
	7) Function A7: Delete a User 

FUNCTIONS B: All Helper Functions Related to User Login
	1) Function B1: Get New Access Token
  
*/

//var tokenLength = '5s'
//var tokenLength = "10s"
//const tokenLength = '60s'
//const tokenLength = '120s'
//const tokenLength = '300s'
//var tokenLength = '3600s'
var tokenLength = '604800s'

//Functions.generateAccessToken Set here with variable above 

function logoutUser() {
  //res.cookie('accessToken', "noAccessToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('refreshToken', "noRefreshToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})
  cookies.set('loggedInUser', {expires: Date.now()});
  cookies.set('accessToken', {expires: Date.now()});
  cookies.set('refreshToken', {expires: Date.now()});
  let logoutUser = {
    logoutCurrentUser: "currentUser"
  }
  
  res.json(logoutUser);
  //console.log("Logout " + userName)
  //On Front end need to 
}

//Function B1: Get New Access Token
async function getRefreshToken(req, res) {
  console.log("GOAL: Get a new access token from a refresh token")
  console.log("Route: http://localhost:3003/refresh/tokens " + "Function: getRefreshToken")
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  var currentUserFromToken = ""

  //var accessToken = await Functions.generateAccessToken(userName, '604800s')
  var accessToken = await Functions.generateAccessToken(userName, tokenLength)
  var status = ""

  //STEP 1: Verify there is a refresh token 
  const refreshToken = req.cookies.refreshToken;

  if(refreshToken == null || refreshToken == "noRefreshToken") {
    console.log("STEP 1: No refresh token was sent so logout " + userName)
    logoutUser();

    //return res.sendStatus(200)
  } else {
    console.log("STEP 1: A refresh token was found for " + userName)
  }

  //STEP 2: Verify refresh token 
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
    currentUserFromToken = authData.currentUser;
    if(err) {
      //console.log("Error verifying the refreshToken")
      console.log("STEP 2: The refresh token could not be verified")
      status = "Error verifying the refreshToken";
    } else {
      console.log("STEP 2: The refresh token is verified")
      status = "looks good sir!"
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
 
        if(refresh_tokens.length > 0) {
          console.log("STEP 3: The token was found in the database and matched for " + currentUserFromToken)
          res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
          res.json({status: "Need to get a new access token and it worked!", accessToken: accessToken, error: false, errorMessage: "none" })

        } else {
          res.json({status: "no worky could not get a new access token and yours is run out", accessToken: "noAccessToken", error: true, errorMessage: "something went wrong" })
        }
      
      } else {
          console.log("Failed to Select Posts" + err)
          res.sendStatus(500)
          return
  }
  })
  console.log("____________________________________")
}


/////
//FUNCTION 
//Create Access Token

/*
var accessToken = await Functions.generateAccessToken(userName, '604800s')

function generateAccessToken(currentUser) {
  //var accessToken = jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET);
  return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '30s'}); //Make longer 
}
*/

/*
//Refresh Token
app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  console.log(refreshToken);
  console.log(refreshTokens);

  if(refreshToken == null) {
      console.log("No token!")
      return res.sendStatus(401)
  }

  //Check against the database 
  if(!refreshTokens.includes(refreshToken)) {
      console.log("Cant find the token in our database!")
      return res.sendStatus(403)
  }

  //This user is a little messed up maybe want to check if it is working right 
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      console.log("_______________________________")
      console.log("Creating a new Refresh Token");
      console.log(user);
      console.log("_______________________________")
      if(err) {
          return res.sendStatus(403)
      }
      const accessToken = generateAccessToken(user)
      res.json({accessToken: accessToken})
  })

  jwt.verify(req.token, 'secretkey', (err, currentUser) => {
    if(err) {
      res.sendStatus(403);
    } else {
      res.json({
        message: 'You created a post! ',
        currentUser: currentUser
      });
    }
  });
  

});
*/

/////


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



//FUNCTIONS A: All Functions Related to a User 
//Function A1: Login User 
async function userLogin(req, res) {
    const connection = db.getConnection(); 
    const userName = req.body.userName;
    const userID = 1;
    const password = req.body.password;
    var loginSuccess = true;
    
    console.log("API: Logging in " + userName + " " + password);

    var userExists = false;
    var passwordCorrect = false;
    var validUser = false;
    var refreshToken = "myRefreshToken";
    var accessToken = "myAccessToken";

    //STEP 1: Check if user Exists 
    const userExistsStatus = await Functions.checkIfUserExists(userName);
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
        } 
      } catch {
        console.log("CATCH error")
      }
    }

    //STEP 3: Check for Valid User and Set Tokens 
    if(userExists == true && passwordCorrect == true) {
      validUser = true;
      loginSuccess = true;

      console.log("STEP 3: Valid User was found PASS")

      //STEP 4: Generate Refresh and Access Tokens
      var accessToken = await Functions.generateAccessToken(userName, tokenLength) 
      var refreshToken = jwt.sign({currentUser: userName}, process.env.REFRESH_TOKEN_SECRET);

      //STEP 5: Add Refresh Token to Database
      const clearQueryString = "DELETE FROM user_profile WHERE user_name= ?;"		
      
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
              console.log("You created a new refreshToken with ID " + results.insertId);      
          } else {    
              console.log("Error Problem with the Database!")
              loginSuccess = false;
              console.log(err)
          } 
      }) 

      //STEP 6: Set Cookies 
      //res.cookie('name', 'tobi', { domain: '.example.com', path: '/refresh', secure: true });
      res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      //res.cookie('refreshToken', refreshToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('refreshToken', refreshToken, {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})
      res.cookie('loggedInUser', userName,{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      loginSuccess = true;
    
    //Login Information was not Correct   
    } else {
      loginSuccess = false;
      res.cookie('accessToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})
      res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    }

    const loginOutcome = {
      loginSuccess: loginSuccess,
      userName: userName,
      validUser: validUser,
      passwordCorrect: passwordCorrect,
      accessToken: accessToken,
      refreshToken, refreshToken
    }
    console.log("STEP 4: Login success PASS")
    console.log(loginOutcome);

    res.json(loginOutcome)
}

//Function A1: Temp Login User (TEMP)
async function userTempLogin(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  const userID = 1;
  const password = req.body.password;
  
  var userExists = false;
  var passwordCorrect = false;
  var validUser = false;
  var refreshToken = "myRefreshToken";
  var accessToken = "myAccessToken";

  //STEP 1: Check if user Exists 
  const userExistsStatus = await Functions.checkIfUserExists(userName);
  userExists = !!userExistsStatus.userExists;


  //STEP 2: Validate user and password
  if(userExists == true ) {
    const passwordOutcome = await Functions.getUserPassword(userName);
    const actualPassword = passwordOutcome.hashedPassword

    try {
      if(await bcrypt.compare(password, actualPassword)) {
        passwordCorrect = true;
      } 
    } catch {
      console.log("CATCH error")
    }
  }

  //STEP 3: Check for Valid User and Set Tokens 
  if(userExists == true && passwordCorrect == true) {
    validUser = true;

    console.log("STEP 3: Valid User was found")

    //STEP 4: Generate Refresh and Access Tokens
    var accessToken = await Functions.generateAccessToken(userName, '60s') 
    var refreshToken = jwt.sign({currentUser: userName}, process.env.REFRESH_TOKEN_SECRET);

    //STEP 5: Add Refresh Token to Database
    const queryString = "INSERT INTO refresh_tokens (refresh_token, user_name, user_id) VALUES (?,?,?)"
    
    connection.query(queryString, [refreshToken, userName, userID], (err, results) => {
        if (!err) {
            console.log("You created a new refreshToken with ID " + results.insertId);      
        } else {    
            console.log("Error Problem with the Database!")
            console.log(err)
        } 
    }) 

    //STEP 6: Set Cookies 
    res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('refreshToken', refreshToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('loggedInUser', userName,{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  
  //Login Information was not Correct   
  } else {
    res.cookie('accessToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  }

  const loginOutcome = {
    userName: userName,
    validUser: validUser,
    passwordCorrect: passwordCorrect,
    accessToken: accessToken,
    refreshToken, refreshToken
  }
  console.log(loginOutcome);

  res.json(loginOutcome)
}





//Function A2: Login Status
async function loginStatus(req, res) {
  

  var loginStatus = await Functions.currentUserStatus(req, res);

  res.json(loginStatus)
}

//Function A3: Logout User 
async function userLogout(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  const refreshToken = req.body.refreshToken;

  //STEP 1: Remove all Access Tokens for User 
  const queryString = "DELETE FROM refresh_tokens WHERE user_name= ?;"			
            
  connection.query(queryString, [userName], (err, rows) => {
      if (!err) {


      } else {

      }
  })

  //STEP 2: Remove Access Tokens
  res.cookie('accessToken', "noAccessToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('refreshToken', "noRefreshToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, path: '/refresh', httpOnly: true})

  console.log(refreshToken);
  res.json({logout: userName})
}

//Function A4: Register
async function userRegister(req, res) {
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

//Function A5: Get New Access Token
/*Duplicate
async function getRefreshToken(req, res) {
  const userName = req.body.userName;
  //const refreshToken = req.body.refreshToken;

  //Part 1: Determine Auth Type 
  const cookieToken = req.cookies.refreshToken
  const authHeader = req.headers['authorization'];
  console.log(authHeader);
  headerToken = authHeader && authHeader.split(' ')[1]
  var tokenType = ""

  console.log("_____________________________________")
  //console.log("TOKEN TYPE: " + tokenType)
  console.log("cookieToken: " + cookieToken)
  console.log("headerToken: " + headerToken)
  console.log("_____________________________________")
  
  
  if(refreshToken == null) {
    console.log("No token!")
    return res.sendStatus(401)
  }
  
  console.log("getting refresh token")

  res.json({cookieToken: cookieToken, headerToken:headerToken })

}
*/

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

//Function A7: Delete a User 
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


//FUNCTIONS C: Validation 
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
        return res.sendStatus(403)
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




/*
const JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEyMzQ1Njc4OTAsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.1c_yQjnMZfKUb4UTDE_WvbC71f8xxtyMsdqKKkI1hF8`;

const jwtPayload = JSON.parse(window.atob(JWT.split('.')[1]))
console.log(jwtPayload.exp);
*/
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


  console.log("___________________")
  var decoded = jwt_decode(cookieAccessToken);

  const tokenCreated = decoded.exp;
  const tokenFinished = decoded.iat;
  const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)
  var stillGood = false 
   
  if(tokenFinished - tokenCreated) {
    stillGood = true
  } 
  console.log(decoded);

  console.log("___________________")
  console.log("___________________")

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

//temp
function authenticateTokenOriginal(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log("Middleware");
  console.log(token);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if(err) {
          console.log("Not Logged In")
          return res.sendStatus(403)
      }

      req.user = user;
      next();
  })
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
          return res.sendStatus(403)
      }
  })

}


//Middleware 
function tryMiddleware(req, res, next) {
  console.log("tryMiddleware")
  
  req.tryMiddleware = "hi";

  next();
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
      return res.sendStatus(401)
  } 

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("your good")
          req.authorizationData = authorizationData
          next();
      } else {
          console.log("Not Logged In")
          return res.sendStatus(403)
      }
  })
 */
}





module.exports = { userLogin, userTempLogin, getTokenType, userRegister, loginStatus, userLogout, getRefreshToken, getTokenList, userDelete, checkPosts, checkTokenTime};


/*
postRouter.get("/posts/user/:user_name", verifyUser, (req, res) => {
    const currentUser = req.authorizationData.currentUser;

    console.log("_____________________________________")
    console.log("The Current User Asking for Posts")
    console.log(currentUser)
    console.log("_____________________________________")

    postFunctions.getUserPosts(req, res);
})
*/ 


//APPENDIX 
/*
   if(cookieToken != undefined) {
       tokenType = "cookie"
    } else if(headerToken != undefined) {
      tokenType = "header"
    } else {
      tokenType = null;
    }
  
    //Part 2: Get the Token
    if(tokenType == "cookie") {
      var refreshToken = req.cookies.token;
    } else if(tokenType == "header") {
      var refreshToken = authHeader && authHeader.split(' ')[1]
    } else {
      var refreshToken = null;
    }
    */
//Determine Which ONe
/*
  //Part 1: Determine Auth Type 
  cookieToken = req.cookies.refreshToken
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
    var token = req.cookies.token;
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
  */


////

//FUNCTION 3: Use the Refresh Token to get a new Access Token 
/*
tempLoginApp.post("/token", (req, res) => {
  const refreshToken = req.body.localRefreshToken;

  if(refreshToken == null) {
      console.log("No token!")
      return res.sendStatus(401)
  }

  //STEP 1: Check against the database 
  const connection = db.getConnection(); 
  const queryString = "SELECT * FROM refresh_tokens WHERE refresh_token = ?";

  connection.query(queryString, [refreshToken], (err, rows) => {
      if (!err) {

          //Cant find Token 
          if(rows.length == 1) {
              console.log("Found the Token: " + rows[0].refresh_token);

              //STEP 2: Return the New Access Token
              jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                  console.log("_______________________________")
                  console.log("Creating a new Access Token for user " + user);
                  console.log("_______________________________")
                  if(err) {
                      return res.sendStatus(403)
                  }
                  const accessToken = generateAccessToken(user)
                  res.json({accessToken: accessToken})
              })

          } else {
              console.log("Cant find the refresh token in our database!")
              return res.sendStatus(403)
          }

      } else {
          console.log("Failed to Select Posts" + err)
          res.sendStatus(500)
          return
  }
  })
  
});
*/

////






/*

  if(accessToken == undefined) {
    accessToken = "notLoggedIn"
  }

  if(refreshToken == undefined) {
    refreshToken = "notLoggedIn"
  }

  if(refreshToken != undefined) {
    refreshToken = "notLoggedIn"
  }
*/


/*
app.post("/logout", (req, res) => {
  //const logoutToken = req.body.localRefreshToken;
  console.log("Log out the user with token")
  //console.log(logoutToken)
  console.log("________________________")

  //const currentUser = req.authorizationData.currentUser;

  //refreshTokens = refreshTokens.filter(token => token !== req.body.token);
  //Delete from Database 
  console.log(req.authorizationData)
  res.json({logout:"logoutToken" })
});

*/

//COOOKIES
    
    
    /*

    ////
      //Set Cookie 
      res.cookie('token', 'myShortToken', {httpOnly: true})
      res.cookie('tokenLong', 'myLongToken!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  
      //Get Cookie 
      var myCookieToken = ""
      var myLongCookieToken = ""
  
      myCookieToken = req.cookies.token;
      myLongCookieToken = req.cookies.tokenLong;
  
      if(myCookieToken == undefined) {
        myCookieToken = "empty"
      }
  
      if(myLongCookieToken == undefined) {
        myLongCookieToken = "empty"
      }
  
      console.log("COOKIES " + myCookieToken, myLongCookieToken)
  
      ////
    //Set Cookie 
    res.cookie('token', 'myShortToken', {httpOnly: true})
    res.cookie('tokenLong', 'myLongToken!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})

    //Get Cookie 
    var myCookieToken = ""
    var myLongCookieToken = ""

    myCookieToken = req.cookies.token;
    myLongCookieToken = req.cookies.tokenLong;

    if(myCookieToken == undefined) {
      myCookieToken = "empty"
    }

    if(myLongCookieToken == undefined) {
      myLongCookieToken = "empty"
    }

    console.log("COOKIES " + myCookieToken, myLongCookieToken)
   
    */

