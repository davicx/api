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
    var currentUser = "EMPTY"
  
    var token = null;
    var tokenType = ""
  
      var middleWareData = {
          tokenType: "",
          noAccessToken: true,
          tokenExpired: true,
          validToken: false,
          requestNewAccessToken: false,
      }
  
      var responseMessage = {
          data: {},
          success: false,
          message: "MIDDLEWARE: verifyUser to access route", 
          statusCode: 498,
          errors: [], 
          currentUser: currentUser
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
        //console.log("STEP 1: the access token is from a cookie")
        token = req.cookies.accessToken;
        //responseMessage.tokenType = "cookie"
        middleWareData.tokenType = "cookie";
    } else if(tokenType == "header") {
        //console.log("STEP 1: the access token is from a header")
        //responseMessage.tokenType = "header"
        middleWareData.tokenType = "header";
        token = authHeader && authHeader.split(' ')[1]
    } else {
        //console.log("STEP 1: There is no access token or it is null")
        //responseMessage.tokenType = "empty"
        middleWareData.tokenType = "empty";    
        tokenType = null;
    }
  

    //STEP 2: Verify there is an access token we can use to validate 
    if(token == null || undefined) {
        //console.log("STEP 2: There is no access token send a 498 and request a new access token with a refresh token")
        responseMessage.noAccessToken = true
        responseMessage.requestNewAccessToken = true
        //console.log(responseMessage)
        res.status(498).json(responseMessage)
        var token = null;
        return
  
    } else {
        //var tokenSmall = token.substring(0,5);
        var tokenSmall = token.substring(0,8);
        //console.log("STEP 2: The token " + tokenSmall)
    }
  
  
    //STEP 4: Check time remaining on token 
    const tokenTimeResponse = functions.checkRemainingTokenTime(token)
    if(tokenTimeResponse.secondsRemaining > 0) {
        //console.log("STEP 4: There is still time on the token. It has " + tokenTimeResponse.secondsRemaining + " seconds left")
    } else {
        console.log("STEP 4: The token ran out of time need to refresh")
    }
  
    //console.log(tokenTimeResponse);
  
    //responseMessage.data = middleWareData;
  
    //STEP 5: Verify Token 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
            //SUCCESS
            //console.log("STEP 5: The token was a good one!")
            console.log("Validated User!")
            console.log("____________________________________________")
            req.authorizationData = authorizationData
            req.currentUser = authorizationData.currentUser

            //Create Response
            middleWareData.noAccessToken = false
            middleWareData.tokenExpired = false
            middleWareData.validToken = true
            
            responseMessage.success = true
            responseMessage.message = "SUCCESS: Valid Access Token"
            responseMessage.statusCode = 200
            responseMessage.currentUser = authorizationData.currentUser
            responseMessage.data = middleWareData
            
            req.responseMessage = responseMessage;
            //console.log("MIDDLEWARE: responseMessage")
            //console.log(responseMessage)
            //console.log("MIDDLEWARE: responseMessage")
            next();
        } else {
            console.log("STEP 5: The token was no good try to get a new one with refresh token ")
            console.log("____________________________________________")
            //OLD
            responseMessage.validToken = false;
            responseMessage.requestNewAccessToken = true
            //OLD
            middleWareData.noAccessToken = false
            middleWareData.tokenExpired = false
            middleWareData.validToken = false
            middleWareData.requestNewAccessToken = true
            
            responseMessage.success = false
            responseMessage.message = "NEED ACCESS TOKEN: The token was no good try to get a new one with refresh token"
            responseMessage.statusCode = 498
            responseMessage.currentUser = "EMPTY"
            responseMessage.data = middleWareData

            console.log(responseMessage)
            res.status(498).json(responseMessage)
            return 
        }
    })
    
  }



module.exports = { verifyUser };




  