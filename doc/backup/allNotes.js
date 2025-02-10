
//WORKING
  //OLD
  /*
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
    */
/*
async function getRefreshToken(req, res) {
  console.log("____________________________________________")
  console.log("LOGIN FUNCTIONS: Get a Refresh Token")
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  var currentUserFromToken = ""
  var accessToken = await Functions.generateAccessToken(userName, tokenLength)


//OLD
var refreshToken = "noRefreshToken"

var refreshTokenOutcome = {
  data: {},
  success: false,
  message: "", 
  statusCode: 500,
  errors: [], 
  currentUser: userName
}

var refeshTokenData = {
  refreshTokenSent: false,
  refreshTokenValid: false,
  refreshTokenDatabseMatch: false
}

console.log("req.cookies.refreshToken")
console.log(req.cookies.refreshToken)
console.log("req.cookies.refreshToken")

//STEP 1: Verify there is a refresh token 
if(req.cookies.refreshToken) {
  refreshToken = req.cookies.refreshToken;
} 

//Token was not found log the user out
if(refreshToken == null || refreshToken == "noRefreshToken") {
  console.log("STEP 1: No refresh token was sent so logout " + userName)
  
  //OLD
  //refreshTokenResponse.refreshTokenFound = false;
  //refreshTokenResponse.masterRefreshSuccess = false;
  //refreshTokenResponse.logUserOut = true;
  //refreshTokenResponse.messages.push("No refresh token was sent so logout")
  //OLD

  refreshTokenOutcome.message = "We did not find a refresh token and are logging the user out"
  refreshTokenOutcome.statusCode = 401
  refreshTokenOutcome.data = refeshTokenData;

  res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
  res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
  res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
  console.log(refreshTokenOutcome)
  res.status(401).json(refreshTokenOutcome)
  return 

//VALID: Token Found 
} else {
  console.log("STEP 1: A refresh token was found for " + userName)
  //refreshTokenResponse.refreshTokenFound = true;
}

//STEP 2: Verify refresh token 
jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, authData) => {
  if(err) {

    //LOGOUT: Not a valid token 
    console.log("STEP 2: The refresh token could not be verified")

    //OLD
    //refreshTokenResponse.refreshTokenValid = false;
    //refreshTokenResponse.masterRefreshSuccess = false;
    //refreshTokenResponse.logUserOut = true;
    //refreshTokenResponse.messages.push("Error verifying the refreshToken so logout user")
    //OLD

    refeshTokenData.refreshTokenSent = true;
    refreshTokenOutcome.message = "Could not verify the refresh Token so logout user"
    refreshTokenOutcome.statusCode = 401

    refreshTokenOutcome.data = refeshTokenData;

    res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
    res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
    res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
    console.log(refreshTokenOutcome)
    res.status(440).json(refreshTokenOutcome)
    return 
  } else {

    //VALID: Valid Token 
    console.log("STEP 2: The refresh token is verified")

    //OLD
    //currentUserFromToken = authData.currentUser;
    //refreshTokenResponse.currentUser = currentUserFromToken;
    //refreshTokenResponse.refreshTokenValid = true;
    //OLD

    //TO DO: MAKE SURE NAMES MATCH
    refreshTokenOutcome.currentUser = authData.currentUser;
    
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

          //OLD
          //refreshTokenResponse.refreshTokenMatch = true;
          //refreshTokenResponse.masterRefreshSuccess = true;
          //refreshTokenResponse.accessToken = accessToken;
          //refreshTokenResponse.messages.push("Need to get a new access token and it worked!")
          //OLD

          refeshTokenData.refreshTokenSent = true
          refeshTokenData.refreshTokenValid = true
          refeshTokenData.refreshTokenDatabseMatch = true
          refeshTokenData.newAccessToken = accessToken;
          refreshTokenOutcome.success = true
          refreshTokenOutcome.message = "SUCCESS: We sent a new access token"
          refreshTokenOutcome.statusCode = 200
          refreshTokenOutcome.data = refeshTokenData
   
          console.log(refreshTokenOutcome)
       
          res.json(refreshTokenOutcome)
          
        //LOGOUT: The token did not match    
        } else {
          //OLD
          //refreshTokenResponse.masterRefreshSuccess = false;
          //refreshTokenResponse.refreshTokenMatch = false;
          //refreshTokenResponse.logUserOut = true;

          //refreshTokenResponse.errorMessages.push("no worky yours didn't match the database")
          //OLD

          refeshTokenData.refreshTokenSent = true
          refeshTokenData.refreshTokenValid = true
          refeshTokenData.refreshTokenDatabseMatch = false
          refreshTokenOutcome.message = "There was no refresh token in the database"
          refreshTokenOutcome.statusCode = 401
    
          //refreshTokenOutcome.data = refeshTokenData;

          res.cookie('accessToken', accessToken, {maxAge: 1, httpOnly: true})
          res.cookie('refreshToken', refreshToken, {maxAge: 1, path: '/refresh', httpOnly: true})
          res.cookie('loggedInUser', userName,{maxAge: 1, httpOnly: true})
          console.log(refreshTokenOutcome)

          res.status(401).json(refreshTokenOutcome)
          return 
        }
      
      //SERVER ERROR: Try again to get a token
      } else {
          console.log("Failed to Select Posts" + err)
          console.log("____________________________________")
          console.log(refreshTokenOutcome)
          
          res.sendStatus(500)
          return
  }
  })

}
*/

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