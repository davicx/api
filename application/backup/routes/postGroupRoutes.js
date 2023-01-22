const express = require('express')
const postGroupRouter = express.Router();
const postFunctions = require('../../functions/postFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');



//Route B2: Get Posts to a User (ADDING PROTECT)
postGroupRouter.get("/test/:user_name", verifyUser, (req, res) => {
    const currentUser = req.authorizationData.currentUser;
    const responseMessage = req.responseMessage;

    console.log("_____________________________________")
    console.log("The Current User Asking for Posts")
    console.log(currentUser)
    //console.log("Response Message")
    //console.log(responseMessage)
    console.log("_____________________________________")

    postFunctions.getUserPosts(req, res);
})


function verifyUser(req, res, next) {
    //48 hour token refresh every 24 hours 
    console.log("_____________________________________")
    var responseMessage = {
        validateToken: "token validation",
        noToken: false,
        tokenExpired: false,
        validToken: true
    }
    
    //STEP 1: Determine Auth Type 
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

    //STEP 2: 
    if(tokenType == "cookie") {
        var token = req.cookies.accessToken;
    } else if(tokenType == "header") {
        var token = authHeader && authHeader.split(' ')[1]
    } else {
        var token = null;
    }

    console.log("STEP 1: the token is from " + tokenType)
    console.log("STEP 2: The token " + token)

    //STEP 3: Verify the Token 
    if (token == null) {
        console.log("STEP 3: You didn't present a token, no beuno!")
        //return res.sendStatus(401)
        responseMessage.noToken = true
        res.status(401).json(responseMessage)
    } else {
        console.log("STEP 3: There is a token so we can verify")
    }

    //STEP 4: Check still has time on it (move to first middle ware check for refresh, then validate)
    var decoded = jwt_decode(token);
    const tokenCreated = decoded.exp;
    const tokenFinished = decoded.iat;
    const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)
    var stillGood = false 


    //current date in seconds since epoch
    var d = new Date();
    var currentSecondsSinceEpoch = Math.round(d.getTime() / 1000);
    const tokenLifeSeconds = (tokenCreated - tokenFinished);
    const tokenLifeMinutes = tokenLifeSeconds / 60;

    const timeBeforeRefresh = 60;
    //If expires - timeBeforeRefresh is greater then today get a new token 

    console.log("Token life in seconds " + tokenLifeSeconds)
    console.log("Token life in minutes " + tokenLifeMinutes)
    console.log("")
    
    if(tokenFinished - tokenCreated) {
        stillGood = true
        responseMessage.tokenExpired = false;
        console.log("STEP 4: There is still time on the token. It is good until " + dateTokenIsGoodTell) 
        console.log("STEP 4: There is still time on the token. It has " + (tokenLifeSeconds + (tokenFinished - currentSecondsSinceEpoch)) + " seconds left")
    } else {
        responseMessage.tokenExpired = true;
        console.log("STEP 4: The token ran out of time need to refresh")
    }

    //STEP 5: Verify Token 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
            console.log("STEP 5: The token was a good one!")
            req.authorizationData = authorizationData
            req.responseMessage = responseMessage;
            next();
        } else {
            console.log("STEP 5: The token was no good try to get a new one with refresh token ")
            responseMessage.validToken = false;
            res.status(401).json(responseMessage)
        }
    })

}


module.exports = postGroupRouter;
