const functions = require('./functions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');

/*
FUNCTIONS A: All Middleware Functions
	1) Function A1: Verify User

*/

//Codes
//401- Log User Out
//498- Get Access Token 

//Function A1: Verify User
function verifyUser(req, res, next) {
    console.log("____________________________________________")
    console.log("MIDDLEWARE: verifyUser")
    const currentUser = req.currentUser

    var token = null;
    var tokenType = ""

    var responseMessage = {
        data: {},
        success: false,
        message: "MIDDLEWARE: verifyUser to access route", 
        statusCode: 500,
        errors: [], 
        currentUser: currentUser
    }

    //Token Codes
    /*
    //Success
    valid_token: 200

    //Access Token Retry
    invalid_access_token: 498
    no_access_token: 498
    access_token_expired: 498
    
    //Refresh Token
    no_refresh_token: 401
    no_refresh_token_database: 401
    
    */
    var tokenData = {
        tokenType: "",
        tokenCode: "",
        tokenTime: 0,
        validToken: false,
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
        //responseMessage.tokenType = "cookie"
        tokenData.tokenType = "cookie";
    } else if(tokenType == "header") {
        console.log("STEP 1: the access token is from a header")
        //responseMessage.tokenType = "header"
        tokenData.tokenType = "header";
        token = authHeader && authHeader.split(' ')[1]
    } else {
        console.log("STEP 1: There is no access token or it is null")
        //responseMessage.tokenType = "empty"
        tokenData.tokenType = "empty";    
        tokenType = null;
    }


    //STEP 2: Verify there is an Access Token we can use to validate 
    if(token == null || undefined) {
        console.log("STEP 2: There is no access token send a 498 and request a new access token with a refresh token")
        middleWareData.noAccessToken = true
        middleWareData.requestNewAccessToken = true
        responseMessage.message = "The request was sent without an Access Token so we will try to get one with a Refresh Token. Don't do more then once?!"
        
        tokenData.tokenCode = "no_access_token";
      
        res.status(498).json(responseMessage)
      
        return

    } else {
        var tokenSmall = token.substring(0,8);
        console.log("STEP 2: Their is an Access Token " + tokenSmall)
    }


  //STEP 4: Check time remaining on token 
  const tokenTimeResponse = functions.checkRemainingTokenTime(token)
  if(tokenTimeResponse.secondsRemaining > 0) {
      console.log("STEP 4: There is still time on the token. It has " + tokenTimeResponse.secondsRemaining + " seconds left")
      tokenData.tokenTime = tokenTimeResponse.secondsRemaining
  } else {
      tokenData.tokenCode = "access_token_expired";
      responseMessage.data = tokenData;

      console.log("STEP 4: The token ran out of time need to refresh")
      res.status(498).json(responseMessage)
  }

  //STEP 5: Verify Token 
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
          console.log("STEP 5: The token was a good one!")
          console.log("____________________________________________")
          tokenData.tokenCode = "valid_access_token";
          responseMessage.data = tokenData;

          //Add all to request
          req.authorizationData = authorizationData
          req.currentUser = authorizationData.currentUser
          req.responseMessage = responseMessage
          
          console.log(responseMessage)
          
          next();
      } else {
          console.log("STEP 5: The token was no good try to get a new one with refresh token ")
          console.log("____________________________________________")
          
          tokenData.tokenCode = "invalid_access_token";
          responseMessage.data = tokenData;

          console.log(responseMessage)
          res.status(498).json(responseMessage)
          return 
      }
  })
  
}

module.exports = { verifyUser };




  