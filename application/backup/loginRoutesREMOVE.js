const express = require('express')
const loginRouter = express.Router(); 
const loginFunctions = require('../../functions/loginFunctions')
//const cors = require('cors');
//loginRouter.use(cors())


//USER ROUTES
//Route A1: User Login 
//loginRouter.post('/login', async function(req, res) {
loginRouter.post('/login', function(req, res) {
    loginFunctions.userLogin(req, res);
})

//loginRouter.post('/login', async function(req, res) {
loginRouter.post('/login/temp', function(req, res) {
    loginFunctions.userTempLogin(req, res);
})
    

//Route A2: Login Status 
loginRouter.post('/login/status', function(req, res) {
    loginFunctions.loginStatus(req, res);
})

//Route A3: Logout User 
loginRouter.post('/logout', function(req, res) {
    console.log("Logout!")
    loginFunctions.userLogout(req, res);
})

//Route A4: Register 
loginRouter.post('/register', function(req, res) {
    loginFunctions.userRegister(req, res);
})

//Route A5: Use Refresh Token to get New Access Token
loginRouter.post('/refresh/tokens', function(req, res) {
    console.log("Use Refresh Token to get New Access Token!")

    loginFunctions.getRefreshToken(req, res);
})

//Route A6: Get Token List 
loginRouter.get('/tokens/all', function(req, res) {
    console.log("Get Token List!")

    loginFunctions.getTokenList(req, res);
})

//Route A7: Delete a User 
loginRouter.post('/delete', function(req, res) {
    loginFunctions.userDelete(req, res);
})

//Route A8: Validate User 
/*
loginRouter.post('/token/get', tryMiddleware, function(req, res) {
    //loginFunctions.checkPosts(req, res);
})
*/

//Route A8: Check if Cookie Expired 
//http://localhost:3003/token/time
loginRouter.get('/token/time', function(req, res) {
    loginFunctions.checkTokenTime(req, res);
})


//Route A8: Get the Token from the incoming request 
loginRouter.post('/token/get', getTokenFromRequest, function(req, res) {
    loginFunctions.getTokenType(req, res);
})


//Middleware 
function getTokenFromRequest(req, res, next) {
    console.log("Figuring out the token type!!")
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

    //TEMP
    var refreshToken = req.cookies.refreshToken;

    if(refreshToken != null) {
      console.log("refreshToken")
      console.log(refreshToken)
      //return res.sendStatus(401) 
    } else {
        refreshToken = "noRefreshToken"
        console.log("NO refreshToken")
    }
    console.log("______________________")

    req.hasAccessToken = hasAccessToken;
    req.accessToken = accessToken;
    req.refreshToken = refreshToken;
  
    next();
}





//TEMP
loginRouter.get('/good', function(req, res) {
    res.json({hi: "hi"})
})

loginRouter.get('/no', function(req, res) {
    //res.sendStatus(401)
    res.status(401).json({oh:"no"});
})


/*
function tryMiddleware(req, res, next) {
    console.log("hiya my mid!!")
    
    req.tryMiddleware = "hi";
    //res.sendStatus(403);
  
    next();
}
//TEMP

function tryMiddleware(req, res, next) {
    console.log("hiya my mid!!")
    
    req.tryMiddleware = "hi";
    //res.sendStatus(403);
  
    next();
}


function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    console.log(bearerHeader);

    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {

        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();

    } else {
      // Forbidden
      res.sendStatus(403);
    }
  
  }

app.post('/api/posts', verifyToken, (req, res) => {  
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
//TEMP




module.exports = loginRouter;




