const functions = require('./functions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');

/*
FUNCTIONS A: All Middleware Functions
	1) Function A1: Verify User

*/


//Function A1: Verify User
function verifyUser(req, res, next) {
  console.log("____________________________________________")
  console.log("MIDDLEWARE: verifyUser")

  var token = null;
  var tokenType = ""

  var responseMessage = {
      messageFrom: "MIDDLEWARE: verifyUser to access route",
      validateToken: "Access token validation",
      tokenType: "",
      noAccessToken: false,
      tokenExpired: false,
      validToken: false,
      requestNewAccessToken: false,
      message: []
  }
  
  //STEP 1: Determine if the auth is from a cookie or header 
  cookieToken = req.cookies.accessToken;
  const authHeader = req.headers['authorization'];
  headerToken = authHeader && authHeader.split(' ')[1]
  
  if(cookieToken != undefined) {
      tokenType = "cookie";
  } else if(headerToken != undefined) {
      tokenType = "header";
  } else {
    tokenType = "null";
  }

  if(tokenType == "cookie") {
      console.log("STEP 1: the access token is from a cookie")
      token = req.cookies.accessToken;
      responseMessage.tokenType = "cookie"
  } else if(tokenType == "header") {
      console.log("STEP 1: the access token is from a header")
      responseMessage.tokenType = "header"
      token = authHeader && authHeader.split(' ')[1]
  } else {
      console.log("STEP 1: There is no access token or it is null")
      responseMessage.tokenType = "empty"
      tokenType = null;
  }

  //STEP 2: Verify there is an access token we can use to validate 
  if(token == null || undefined) {
      console.log("STEP 2: There is no access token send a 401 and request a new access token with a refresh token")
      responseMessage.noAccessToken = true
      responseMessage.requestNewAccessToken = true
      console.log(responseMessage)
      res.status(498).json(responseMessage)
      var token = null;
      return

  } else {
      //var tokenSmall = token.substring(0,5);
      var tokenSmall = token.substring(0,8);
      console.log("STEP 2: The token " + tokenSmall)
  }


  //STEP 3: Verify the Token 
  if (token == null) {
      console.log("STEP 3: You didn't present an access token, no beuno gotta try to get a new one with a refresh token!")
      responseMessage.noToken = true
      responseMessage.requestNewAccessToken = true
      responseMessage.message.push("You didn't present an access token, no beuno gotta try to get a new one with a refresh token")
      console.log(responseMessage)
      res.status(498).json(responseMessage)
      return 
  } else {
      console.log("STEP 3: There is a token so we can verify")
  }

  //STEP 4: Check time remaining on token 
  const tokenTimeResponse = functions.checkRemainingTokenTime(token)
  if(tokenTimeResponse.secondsRemaining > 0) {
      console.log("STEP 4: There is still time on the token. It has " + tokenTimeResponse.secondsRemaining + " seconds left")
  } else {
      console.log("STEP 4: The token ran out of time need to refresh")
  }

  //console.log(tokenTimeResponse);

  //STEP 5: Verify Token 
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("STEP 5: The token was a good one!")
          console.log("____________________________________________")
          //console.log("MIDDLEWARE: authorizationData")
          //console.log(authorizationData)
          //console.log("MIDDLEWARE: authorizationData")
          req.authorizationData = authorizationData
          req.currentUser = authorizationData.currentUser
          responseMessage.requestNewAccessToken = false;
          req.responseMessage = responseMessage;
          next();
      } else {
          console.log("STEP 5: The token was no good try to get a new one with refresh token ")
          console.log("____________________________________________")
          responseMessage.validToken = false;
          responseMessage.requestNewAccessToken = true
          console.log(responseMessage)
          res.status(498).json(responseMessage)
          return 
      }
  })
  
}

module.exports = { verifyUser };




  