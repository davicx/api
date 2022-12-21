//LOGIN APP
require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const tempLoginApp = express();
const db = require('./conn');
var cors = require('cors');
tempLoginApp.use(cors())
tempLoginApp.use(express.json());
tempLoginApp.use(middlewareHelper);
const cookieParser = require('cookie-parser');
tempLoginApp.use(cookieParser())
//tempLoginApp.use(cors({ credentials: true, origin: http://localhost:4003/ }))

//SERVER: Connection 
tempLoginApp.listen(4003, () => {
  console.log("Server is up and listening on 4003...")
})

tempLoginApp.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

//FUNCTIONS A: Login Routes
//Function A1: Login User 
//Function A2: Register User 
//Function A3: Logout User

//FUNCTIONS B: Informational Routes 
//Function B1: Get Session Info
//Function B2: Get a List of all the Current Refresh Tokens 

//FUNCTIONS D: Login and JWT Functions 
//Function D1: Create Access Token
//Function D2: Verify User with JWT 






//SORT

//Middleware 
function middlewareHelper(req, res, next) {
    console.log("middlewareHelper")
    return next();
}

//FUNCTIONS: Informational Routes 
//Function B1: Get Session Info
tempLoginApp.get("/login/info", (req, res) => {
    console.log("Session Info")
    res.json({yourSession: "Session Info, hiya!" })
});

//Function B2: Get Access Token Info


//FUNCTION 1: Login User 
tempLoginApp.post("/login", async (req, res) => {
    const connection = db.getConnection(); 
    const userName = req.body.username;
    const password = req.body.password;
    
  
    //STEP 1: Normally would authenticate user in database 
    const currentUser = {
        userID: 1,
        username: userName,
        password: password
    }
    console.log("LOGIN!!!!!!!!!!")
    console.log("_______________________________")
    console.log("Login user " + currentUser.username);
    console.log("Login user " + currentUser.password);
    console.log("_______________________________")


    //STEP 2: Create Login and Refresh Tokens 
    var accessToken = generateAccessToken(currentUser)
    const refreshToken = jwt.sign({currentUser: currentUser}, process.env.REFRESH_TOKEN_SECRET);

    //STEP 3: Add Refresh Token to Database
    const queryString = "INSERT INTO refresh_tokens (refresh_token) VALUES (?)"
    
    connection.query(queryString, [refreshToken], (err, results) => {
        if (!err) {
            console.log("You created a new refreshToken with ID " + results.insertId);      
        } else {    
            console.log("Error Problem with the Database!")
            console.log(err)
        } 
    }) 

    //STEP 4: Send Cookie 
    console.log("set cookie! hiya!");
    res.cookie('accessToken', accessToken, {maxAge: 100000 * 60 * 60 * 1000, httpOnly: true})
    //res.cookie('refreshToken', refreshToken, {maxAge: 100000 * 60 * 60 * 1000, httpOnly: true})

    res.json({login: "You logged in!", currentUser: currentUser, accessToken: accessToken, refreshToken: refreshToken})
  
  })

//FUNCTION 2: Get a List of all the Current Refresh Tokens 
//tempLoginApp.get("/tokens", async (req, res) => {
tempLoginApp.get("/tokens", (req, res) => {
    console.log("getting all tokens")

    //Handle Database Errors Better 
    //STEP 1: Check against the database 
	const connection = db.getConnection(); 
    const tokenDeleted = 0;
    const queryString = "SELECT * FROM refresh_tokens WHERE token_deleted = ? LIMIT 10000";

    connection.query(queryString, [tokenDeleted], (err, rows) => {
        if (!err) {
            const tokens = rows.map((row) => {
				return {
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
})  
  
//FUNCTION 3: Use the Refresh Token to get a new Access Token 
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

//FUNCTION 4: Log the Current User out by removing their Refresh Token 
tempLoginApp.post("/logout", (req, res) => {
    const logoutToken = req.body.localRefreshToken;
    console.log("Log out the user with token")
    console.log(logoutToken)
    console.log("________________________")

    //const currentUser = req.authorizationData.currentUser;

    //refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    //Delete from Database 
    console.log(req.authorizationData)
    res.json({logout:logoutToken })
});



//FUNCTION 5: Create Access Token
function generateAccessToken(currentUser) {
    //var accessToken = jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET);
        //accessTokenLength '604800s'
    //Minute
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '60s'}); 

    //5 Minutes
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '300s'}); 
    
    //Hour
    //return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '3600s'}); 
    
    //Week
    return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '604800s'}); 
    
}

//Verify 
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    console.log("TOKEN")
    console.log(token)
    console.log("__________")
    if (token == null) {
        console.log("no token")
        return res.sendStatus(401)
    } 

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
            req.authorizationData = authorizationData
            next();
        } else {
            console.log("Not Logged In")
            return res.sendStatus(403)
        }
    })

}



//APP
require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
var cors = require('cors')
const loginApp = express()


loginApp.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000"]
  })
);

loginApp.use(cookieParser())
loginApp.use(express.json());

//Server Login 
loginApp.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

loginApp.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

//Post Data 
const post1 = {userName: "davey", caption: "hiya!"}
const post2 = {userName: "Frodo", caption: "Wanna garden?!"}
const post3 = {userName: "David", caption: "Lets go on a hike!"}

var posts = [post1, post2, post3];
var myToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6eyJ1c2VySUQiOjEsInVzZXJuYW1lIjoiZGF2ZXkiLCJwYXNzd29yZCI6Im15cGFzc3dvcmQifSwiaWF0IjoxNjU4NjE3MTY4LCJleHAiOjE2NTkyMjE5Njh9.w65IUAT8_MkoZ86UKUQ4HgGTg57OwNGX-sILjGJYBR8";


//FUNCTIONS A: Post Routes
//Function A1: Get all Posts (GET Request)
loginApp.get('/posts', verifyToken, (req, res) => { 
  const currentUser = req.authorizationData.currentUser;
  checkRefreshToken(req.authorizationData);
 
  console.log("_____________________________________")
  console.log("The Current User Asking for Posts")
  console.log(currentUser)
  console.log("_____________________________________")

  res.json({currentUser: currentUser, posts: posts});

})

//Function A2: Get Posts (POST)
loginApp.post('/posts', verifyToken, (req, res) => { 
  const currentUser = req.authorizationData.currentUser;

  console.log("_____________________________________")
  console.log("The Current User Asking for Posts")
  console.log(currentUser)
  console.log("_____________________________________")

  const yourPosts = posts.filter(post => post.userName === currentUser.userName);
  res.json({posts: posts, currentUser: currentUser});

})

//Function A3: Get Posts for Web or Mobile (GET)
loginApp.get('/api/posts', verifyUser, (req, res) => { 
  const currentUser = req.authorizationData.currentUser;
  //checkRefreshToken(req.authorizationData);
 
  console.log("_____________________________________")
  console.log("The Current User Asking for Posts")
  console.log(currentUser)
  console.log("_____________________________________")

  //res.json({posts: posts, currentUser: currentUser});
  res.json({currentUser: currentUser, posts: posts});

})

//Function A3: Get Posts for Web or Mobile (POST)
loginApp.post('/api/posts', verifyUser, (req, res) => { 
  const currentUser = req.authorizationData.currentUser;
  //checkRefreshToken(req.authorizationData);
 
  console.log("_____________________________________")
  console.log("The Current User Asking for Posts")
  console.log(currentUser)
  console.log("_____________________________________")

  //res.json({posts: posts, currentUser: currentUser});
  res.json({currentUser: currentUser, posts: posts});

})

//Function A4: Get Posts (GET)
loginApp.get('/posts/simple', (req, res) => { 
  //console.log("________________________________");
  //console.log(req);
  //console.log("________________________________");
  //console.log(req.body);
  //console.log("________________________________");
  console.log(req.headers);
  console.log("________________________________");
  res.json({ posts: posts });
  //res.json(posts);

})

//Function A5: Make Post (POST)
loginApp.post('/post/text', (req, res) => { 
  const postFrom = req.body.postFrom;
  console.log(req.body);
  console.log(req.headers);

  res.json({ postFrom: postFrom }); 

})

//http://localhost:3003/cookie/get



//ORGANIZE BELOW 

//PART 1: Post Routes

//Set Cookie with Token 
loginApp.get("/cookie/token", (req, res) => {
  console.log("set cookie! hiya!");
  const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6eyJ1c2VySUQiOjEsInVzZXJuYW1lIjoiZGF2ZXkiLCJwYXNzd29yZCI6Im15cGFzc3dvcmQifSwiaWF0IjoxNjU4NjE3MTY4LCJleHAiOjE2NTkyMjE5Njh9.w65IUAT8_MkoZ86UKUQ4HgGTg57OwNGX-sILjGJYBR8"
  res.cookie('token', jwtToken, {maxAge: 100000 * 60 * 60 * 1000, httpOnly: true})
  res.json({cookie: "cookie"});
})



//PART 3: Simple Middleware
loginApp.get("/middle", hiMiddle, (req, res) => {
  const hiya = req.hi;
  console.log("middle! " + hiya);

  res.json({middle: "middle"});
})

function hiMiddle(req, res, next) {
  console.log("hiMiddle")
  req.hi = "hiya!"
  console.log(req);
  next();
}


//PART 4: Function 
//Function 1: Determine Web or Mobile 

function verifyUser(req, res, next) {
  //Part 1: Determine Auth Type 
  cookieToken = req.cookies.token
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

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
        req.authorizationData = authorizationData
        next();
      } else {
        console.log("Not Logged In")
        return res.sendStatus(403)
      }
  })
  /*
  //console.log("mobileOrWebMiddleware")

  //Part 1: Handle Getting the Token 
  var token = ""
  var cookieToken = "";
  var headerToken = "";

  cookieToken = req.cookies.token
  const authHeader = req.headers['authorization'];
  headerToken = authHeader && authHeader.split(' ')[1]

  //Set empty values 
  if(cookieToken == undefined) {
    cookieToken = "empty"
  } 

  if(headerToken == undefined) {
    headerToken = "empty"
  }

  //Set Token 
  if(cookieToken == "empty") {
    token = headerToken
  } else if (headerToken == "empty") {
    token = cookieToken
  } else {
    token = null;
  }

  //console.log("MIDDLEWARE: Token from a Cookie: " + cookieToken);
  //console.log("MIDDLEWARE: Token from the Header: " + headerToken);
  console.log("TOKEN: " + token);

  //Part 2: Verify the Token
  if (token == null) {
    console.log("You didn't present a token, no beuno!")
    return res.sendStatus(401)
  } 

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
        console.log("USER: " + req.authorizationData)
        req.authorizationData = authorizationData
        next();
      } else {
        console.log("Not Logged In")
        return res.sendStatus(403)
      }
  })
  */

}

//Function 2: Verify a Token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]
  console.log("_____________________")
  console.log("HEADER token " + token)
  console.log("_____________________")

  if (token == null) {
    console.log("You didn't present a token, no beuno!")
    return res.sendStatus(401)
  } 

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
      if(!err) {
        req.authorizationData = authorizationData
        next();
      } else {
        console.log("Not Logged In")
        return res.sendStatus(403)
      }
  })
}

//Function 3: Check Token Status
async function checkRefreshToken(authorizationData){
  console.log("checkRefreshToken")
  console.log("________________")
  console.log(authorizationData)
  console.log("________________")
  
  //WORKS
  const tokenIAT= authorizationData.iat;
  const tokenEXP = authorizationData.exp;
  console.log("_____________________________________________")
  console.log("The Current Token Data")
  console.log("TOKEN IAT " + tokenIAT)
  console.log("TOKEN EXP " + tokenEXP)
  console.log("Remaining " + (tokenEXP - tokenIAT))

  //Milliseconds 
  console.log(Date.now() + " " + tokenEXP * 1000)


  //const expiresSeconds = -1 * (Date.now() - tokenEXP);

  //console.log(expiresSeconds)
  //const expiresMinutes = -60 * Math.floor(expiresMilliSeconds / 1000);
  //const expiresHours = (expiresMinutes / 60);
  //console.log("Minutes tell Expires " + expiresMinutes + " Hours: " + expiresHours);
  //console.log("Minutes tell Expires " +  expiresMilliSeconds + " Hours: ");

  if (Date.now() >= tokenEXP * 1000) {
    console.log("IF need a new token bro");

  } else {
    console.log("ELSE: Token still good")
    return true
  }
  
}




//SORT
//MOBILE OR WEB
loginApp.get("/api", verifyUser, (req, res) => {
  console.log("hiya! Is this mobile or web?!");
  var cookieToken = "";
  var headerToken = "";

  cookieToken = req.cookies.token
  const authHeader = req.headers['authorization'];
  headerToken = authHeader && authHeader.split(' ')[1]

  if(cookieToken == undefined) {
    cookieToken = "empty"
  }

  if(headerToken == undefined) {
    headerToken = "empty"
  }

  console.log("Cookie: " + cookieToken);
  console.log("Header: " + headerToken);
  res.json({
    cookieToken: cookieToken,
    headerToken: headerToken
  });

})








