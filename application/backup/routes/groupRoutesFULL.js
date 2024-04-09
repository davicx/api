const express = require('express')
const db = require('../../functions/conn');
const groupRouter = express.Router();
const groupFunctions = require('./../../functions/groupFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');


//app.use(express.json());



//Need to make SQL query get all the groups a user is in and there name 
groupRouter.get("/groups/:userName", (req, res) => {
    groupFunctions.getUserGroups(req, res);
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
        //responseMessage.noToken = true
        //res.status(401).json(responseMessage)
    } else {
        console.log("STEP 3: There is a token so we can verify")
    }

    /*

    //STEP 4: Check still has time on it (move to first middle ware check for refresh, then validate)
    var decoded = jwt_decode(token);
    const tokenCreated = decoded.exp;
    const tokenFinished = decoded.iat;
    const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)
    var stillGood = false 

*/
    //current date in seconds since epoch
    /*
    var d = new Date();
    var currentSecondsSinceEpoch = Math.round(d.getTime() / 1000);
    const tokenLifeSeconds = (tokenCreated - tokenFinished);
    const tokenLifeMinutes = tokenLifeSeconds / 60;

    const timeBeforeRefresh = 60;
    //If expires - timeBeforeRefresh is greater then today get a new token 

    console.log("Token life in seconds " + tokenLifeSeconds)
    console.log("Token life in minutes " + tokenLifeMinutes)
    */
    
    //console.log("currentSecondsSinceEpoch " + currentSecondsSinceEpoch)
    //console.log("tokenCreated " + tokenCreated)
    //console.log("tokenFinished " + tokenFinished)
    //console.log("Time remaining " + (currentSecondsSinceEpoch - tokenFinished))

    //console.log((tokenCreated - tokenFinished) / 60 / 60)
    //console.log((tokenCreated - tokenFinished) / 60 / 60 / 24)
    
    //when to get new token 
    /*
    if(tokenCreated - tokenFinished) / 60 / 60 < 24) {
    }
    
    */
    console.log("")
    /*
    if(tokenFinished - tokenCreated) {
        stillGood = true
        responseMessage.tokenExpired = false;
        console.log("STEP 4: There is still time on the token. It is good until " + dateTokenIsGoodTell) 
        console.log("STEP 4: There is still time on the token. It has " + (tokenLifeSeconds + (tokenFinished - currentSecondsSinceEpoch)) + " seconds left")
    } else {
        responseMessage.tokenExpired = true;
        console.log("STEP 4: The token ran out of time need to refresh")
    }
    */
    
    next();
    //STEP 5: Verify Token 
    /*
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
*/
}





//USER ROUTES
//Route A1: Create a New Group
groupRouter.post('/group/create/', function(req, res) {
    groupFunctions.createGroup(req, res);
})

/*
//Route A2: Invite Users to a Group 
groupRouter.post('/group/invite/', function(req, res) {
    groupFunctions.addGroupUsers(req, res);
})

//Route A3: Join Group 
groupRouter.post('/group/join/', function(req, res) {
    groupFunctions.acceptGroupInvite(req, res);
})

//Route A4: Leave a Group
groupRouter.post('/group/leave/', function(req, res) {
    groupFunctions.leaveGroup(req, res);
})

//GET ROUTES
//Route B1: Get All Groups a User is In
groupRouter.get("/group/user/:userName", (req, res) => {
    groupFunctions.getUserGroups(req, res);
})

//Route B2: Get Single Group by ID 
groupRouter.get("/group/:groupID", (req, res) => {
    groupFunctions.getGroup(req, res);
})

//Route B3: Get Group Users 
groupRouter.get("/group/users/:groupID", (req, res) => {
    groupFunctions.getGroupUsers(req, res);
})

*/




module.exports = groupRouter;




/*

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

    
    //console.log("currentSecondsSinceEpoch " + currentSecondsSinceEpoch)
    //console.log("tokenCreated " + tokenCreated)
    //console.log("tokenFinished " + tokenFinished)
    //console.log("Time remaining " + (currentSecondsSinceEpoch - tokenFinished))

    //console.log((tokenCreated - tokenFinished) / 60 / 60)
    //console.log((tokenCreated - tokenFinished) / 60 / 60 / 24)
    /*
    when to get new token 
    if(tokenCreated - tokenFinished) / 60 / 60 < 24) {
    }
    
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



*/

