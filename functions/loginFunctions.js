const db = require('./conn');
const bcrypt = require('bcrypt')
//app.use(express.json());
const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
const Notifications = require('./classes/Notification')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: User Login
	1) Function A2: Register
	1) Function A3: Delete a User 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: User Login 
async function userLogin(req, res) {
    const userName = req.body.userName;
    const password = req.body.password;

    var userExists = 0;
    var passwordCorrect = false;
    var validUser = false;
    var refreshToken = "myRefreshToken";
    var accessToken = "myAccessToken";

    //STEP 1: Check if user Exists 
    const userExistsStatus = await Functions.checkIfUserExists(userName);
    userExists = !!userExistsStatus.userExists;
    
    //STEP 2: Validate user and password
    if(userExists == true ) {
      const passwordOutcome = await Functions.getUserPassword(userName);
      const actualPassword = passwordOutcome.hashedPassword
  
      try {
        if(await bcrypt.compare(password, actualPassword)) {
          //console.log("worked the same!")
          passwordCorrect = true;
        } else {
          //console.log("No same")
        }
      } catch {
        console.log("CATCH error")
      }
    }

    //STEP 3: Check for Valid User and Set Tokens 
    if(userExists == true && passwordCorrect == true) {
      validUser = true;
      var myShortToken = "loggedIn" + userName;
      res.cookie('accessToken', myShortToken, {httpOnly: true})
      res.cookie('refreshToken', 'myLongToken!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    } else {
      res.cookie('accessToken', 'notLoggedIn', {httpOnly: true})
    }

    //TEMP: Send Cookies 
    var accessToken = ""
    var refreshToken = ""
    
    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;

    if(accessToken == undefined) {
      accessToken = "empty"
    }

    if(refreshToken == undefined) {
      refreshToken = "empty"
    }
  
    const loginOutcome = {
      validUser: validUser,
      passwordCorrect: passwordCorrect,
      accessToken: accessToken,
      refreshToken, refreshToken
    }

    res.json(loginOutcome)
}

//TEMP
//Function A3: Login Status
async function loginStatus(req, res) {
  const userName = req.body.userName;
  const password = req.body.password;
  var accessToken = ""
  var refreshToken = ""
  var userLoggedIn = false
  
  accessToken = req.cookies.accessToken;
  refreshToken = req.cookies.refreshToken;

  if(accessToken == undefined) {
    accessToken = "notLoggedIn"
  }

  if(refreshToken == undefined) {
    refreshToken = "empty"
  }

  if(accessToken != "empty") {
    
  }

  if(accessToken != "notLoggedIn") {
    userLoggedIn = true
  }
  


  const loginStatusOutcome = {
    userName: userName,
    userLoggedIn: userLoggedIn,
    accessToken: accessToken,
    refreshToken, refreshToken
  }

  res.json(loginStatusOutcome)
}
//TEMP

/* SALT FOR BYRCYPT DOESN"T WORK!!!!! */
/* Need to make field a varchar */
//Function A2: Register New User 
async function userRegister(req, res) {
  const userName = req.body.userName;
  const fullName = req.body.fullName;
  const userEmail = req.body.email;
  const rawPassword = req.body.password
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.password, salt)
  var registerUserLoginOutcome = {}

	const newUser = {
		userName: userName,
		fullName: fullName,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
	}

  //STEP 1: Check if Username is taken 
  //NEED TO CHECK BOTH USER TABLES! 
	const userExistsStatus = await Functions.checkIfUserExists(userName)

  //STEP 2: Validate Information (or do all at once in validationFunctions.js)
  const validationStatus = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);
  console.log(validationStatus)

  //STEP 3: Make sure Username is Available
  if(userExistsStatus.userExists == 0) {
    console.log("user name is good!")
    
    //STEP 4: Register the New User 
    registerUserLoginOutcome = await User.registerUserLogin(newUser)
    console.log(registerUserLoginOutcome)

    const userID = registerUserLoginOutcome.userID
    console.log("your new ID " + userID)
    newUser.userID = userID

    const registerUserProfileOutcome = await User.registerUserProfile(newUser)
    console.log(registerUserProfileOutcome)

    res.json(registerUserProfileOutcome)

	} else {
    console.log("user name is taken!")
    res.json({userNameTaken: "userNameTaken"})
	}

} 
//Function A3: Delete a User 
async function userDelete(req, res) {
  const userName = req.body.userName;
  const typeOfDelete = req.body.type;

  if(typeOfDelete == "permanent") {
    const loginStatus = await Functions.removeUserFromLoginTable(userName)
    const profileStatus = await Functions.removeUserFromProfileTable(userName)
    console.log(loginStatus)
    console.log(profileStatus)
    res.json({loginStatus: loginStatus, profileStatus: profileStatus})
  } else {
    //Temp delete means setting the user to active is zero 
    res.json({type: "Add temp delete"})
  }


}


module.exports = { userLogin, userRegister, loginStatus, userDelete};




//COOOKIES
    
    
    /*

    ////
      //Set Cookie 
      res.cookie('token', 'myShortToken', {httpOnly: true})
      res.cookie('tokenLong', 'myLongToken!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  
      //Get Cookie 
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
  
      console.log("COOKIES " + myCookieToken, myLongCookieToken)
  
      ////
    //Set Cookie 
    res.cookie('token', 'myShortToken', {httpOnly: true})
    res.cookie('tokenLong', 'myLongToken!!', {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})

    //Get Cookie 
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

    console.log("COOKIES " + myCookieToken, myLongCookieToken)
   
    */

