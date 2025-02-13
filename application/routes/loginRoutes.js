const express = require('express')
const loginRouter = express.Router(); 
//const loginFunctions = require('../logic/login')
const login = require('../logic/login')

//LOGIN ROUTES
//Route A1: User Login 
loginRouter.post('/user/login', function(req, res) {
    login.userLogin(req, res);
})

//Route A2: Logout User 
loginRouter.post('/user/logout', function(req, res) {
    login.userLogout(req, res);
})

//Route A3: Register 
loginRouter.post('/user/register', function(req, res) {
    login.userRegister(req, res);
})

//Route A4: Login Status (On front end need to add refresh for expired access token and retry)
loginRouter.post('/refresh/status', function(req, res) {
    login.loginStatus(req, res);
})

//Route A5: Delete a User 
loginRouter.post('/user/delete', function(req, res) {
    login.userDelete(req, res);
})

//Route A6: Check if Cookie Expired 
loginRouter.get('/token/time', function(req, res) {
    login.checkTokenTime(req, res);
})

//TOKEN AND COOKIE ROUTES
//Route A7: Use Refresh Token to get New Access Token
loginRouter.post('/refresh/tokens', function(req, res) {
    console.log("ROUTE /refresh/tokens: Requesting a new token by sending a refresh token")
    login.getRefreshToken(req, res);
})

//Route A8 Get current Cookies
loginRouter.get("/cookie/get", (req, res) => {
    login.getUserCookies(req, res);
})


module.exports = loginRouter;





/*
//Route A8: Get Token List 
loginRouter.get('/token/all', function(req, res) {
    loginFunctions.getTokenList(req, res);
})

//Route A9: Get the Token from the incoming request (Maybe remove?)
loginRouter.post('/token/get', getTokenFromRequest, function(req, res) {
    loginFunctions.getTokenType(req, res);
})
//Middleware (Maybe remove?)
function getTokenFromRequest(req, res, next) {
    console.log("LOGIN ROUTES: getTokenFromRequest")
    var hasAccessToken = true;
    var accessToken = "";

    //Logging out doesn't delete the token so it thinks there is one still 
    var cookieAccessToken = req.cookies.accessToken;
    var authHeader = req.headers['authorization'];
    var headerAccessToken = authHeader && authHeader.split(' ')[1]
    var headerToken = false;
    var cookieToken = false;

    //The token is in the Header 
    if(cookieAccessToken && cookieAccessToken != "noAccessToken") {
        console.log("there is a cookieAccessToken")
        console.log(cookieAccessToken);
        accessToken = headerAccessToken;

        cookieToken = true;
    } 

    //The token is from a Cookie 
    if(authHeader) {
        console.log("there is a headerAccessToken")
        console.log(headerAccessToken);
        accessToken = cookieAccessToken;

        headerToken = true;
    }   

    //There is both 
    if(headerToken == true && cookieToken == true) {
        console.log("there is a both")
        accessToken = cookieAccessToken;
    }  

    //There is no token 
    if(headerToken == false && cookieToken == false){
        console.log("No tokens!")
        hasAccessToken = false

    }

    var refreshToken = req.cookies.refreshToken;

    if(refreshToken != null) {
      console.log("refreshToken")
      console.log(refreshToken)
      //return res.sendStatus(401) 
    } else {
        refreshToken = "noRefreshToken"
        console.log("NO refreshToken")
    }

    req.hasAccessToken = hasAccessToken;
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;
  
    next();
}
*/
