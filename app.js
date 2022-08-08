require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
var cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3003;
app.use(express.json());
app.use(cookieParser())

app.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000"]
  })
);

const login = require('./application/routes/loginRoutes.js'); 
const posts = require('./application/routes/postRoutes.js');
const user = require('./application/routes/userRoutes.js');
const group = require('./application/routes/groupRoutes.js');
const notification = require('./application/routes/notificationRoutes.js');
const comments = require('./application/routes/commentRoutes.js');
const upload = require('./application/routes/uploadRoutes.js'); 

app.use(login);
app.use(posts);
app.use(user);
app.use(group);
app.use(notification); 
app.use(comments);
app.use(upload); 

//Server Login 
app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

//TEMP
/*
app.get("/cookie/get", (req, res) => {
  //res.header('Access-Control-Allow-Credentials', true)
  console.log("get cookie! hiya!");
  var accessToken = ""
  var refreshToken = ""
    
  console.log(req.cookies);
  console.log("______HEADERS_________");
  console.log(req.headers);
  console.log("_______________");

  myCookieToken = req.cookies.accessToken;
  myLongCookieToken = req.cookies.refreshToken;

  if(myCookieToken == undefined) {
    myCookieToken = "empty"
  }

  if(myLongCookieToken == undefined) {
    myLongCookieToken = "empty"
  }

  
  //console.log(req.cookies.sky);
  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken
  });
})
*/

//TEMP 
/*
const post1 = {userName: "davey", caption: "hiya!"}
const post2 = {userName: "Frodo", caption: "Wanna garden?!"}
const post3 = {userName: "David", caption: "Lets go on a hike!"}

var postsList = [post1, post2, post3];


app.get('/posts/simple/temp', (req, res) => { 
    console.log("TRYING TO GET POSTS")
    console.log("________________________________");
    console.log(req.headers);
    console.log("________________________________");
    //res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ posts: postsList });
 })
  //TEMP

  */
////ORIGINAL 
/*




app.use(login);
app.use(user);
app.use(group);
app.use(posts);
app.use(comments);
app.use(upload); 
app.use(notification); 

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})
*/

////FROM THING ////

//Function A4: Get Posts (GET)
//Post Data 




/*

//TEMP 2: Cookies
//Function 1: Set a Cookie
app.get("/cookie/set", (req, res) => {
  res.header('Access-Control-Allow-Credentials', true)
  console.log("set cookie! hiya!");

  res.cookie('token', 'myShortToken', {httpOnly: true})
  res.cookie('tokenLong', 'oh this is new!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('aNewCookie', 'hiya!!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  
  res.json({cookie: "cookie"});
})

//Function 2: Get a Cookie
app.get("/cookie/get", (req, res) => {
  res.header('Access-Control-Allow-Credentials', true)
  console.log("get cookie! hiya!");
  console.log(req.cookies);
  console.log("______HEADERS_________");
  console.log(req.headers);
  console.log("_______________");
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

  //console.log(req.cookies.sky);
  res.json({
    cookie: myCookieToken,
    cookieLong: myLongCookieToken
  });
})



*/

////FROM THING ////




////ORIGINAL 
/*
require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
app.use(express.json());
const cors = require('cors');

app.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000"]
  })
);


const login = require('./application/routes/loginRoutes.js');
const posts = require('./application/routes/postRoutes.js');
const comments = require('./application/routes/commentRoutes.js');
const user = require('./application/routes/userRoutes.js');
const group = require('./application/routes/groupRoutes.js');
const upload = require('./application/routes/uploadRoutes.js'); 
const notification = require('./application/routes/notificationRoutes.js'); 

app.use(login);
app.use(user);
app.use(group);
app.use(posts);
app.use(comments);
app.use(upload); 
app.use(notification); 

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})
*/