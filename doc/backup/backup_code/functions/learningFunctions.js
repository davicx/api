const db = require('./conn');
const bcrypt = require('bcrypt')
const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
const Notifications = require('./classes/Notification')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: User Login 
async function learningHello(req, res) {
    res.json({hello: "hello"})
}

//Function A1: Middleware 
//app.get('/posts', verifyToken, (req, res) => { 

async function learningMiddleware(req, res) {
    console.log("the normal function")
    res.json({middleWare: "middleWare"})
}

//FUNCTIONS B: Cookies

//Routes B: Cookiess
/*
//Route B1: Set a Cookie
app.get("/learning/cookie/set", (req, res) => {
    res.header('Access-Control-Allow-Credentials', true)
    console.log("set cookie! hiya!");
    //res.cookie('tokenLong', 'myLongToken', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true, withCredentials: true, sameSite: 'strict'})
    res.cookie('token', 'myShortToken!!yay!', {httpOnly: true})
    res.cookie('tokenLong', 'myLongToken', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})

    res.json({cookie: "cookie"});
  })
  
  //Function 2: Get a Cookie
  app.get("learning/cookie/get", (req, res) => {
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
  
    const cookieOutput = {
      token: myCookieToken,
      tokenLong: myLongCookieToken
    }
    console.log(cookieOutput)
  
    res.json(cookieOutput);
  })
  */
  





module.exports = { learningHello, learningMiddleware};


