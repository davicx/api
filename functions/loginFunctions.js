const db = require('./conn');
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');

//const cookieParser = require('cookie-parser');
//app.use(cookieParser())

const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
const Notifications = require('./classes/Notification')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: User Login
	2) Function A2: Register
  3) Function A3: Logout User 
	4) Function A4: Delete a User 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: User Login 
async function userLogin(req, res) {
    const connection = db.getConnection(); 
    const userName = req.body.userName;
    const userID = 1;
    const password = req.body.password;
    
    console.log("Logging in " + userName + " " + password);

    var userExists = false;
    var passwordCorrect = false;
    var validUser = false;
    var refreshToken = "myRefreshToken";
    var accessToken = "myAccessToken";

    //STEP 1: Check if user Exists 
    const userExistsStatus = await Functions.checkIfUserExists(userName);
    userExists = !!userExistsStatus.userExists;

    console.log("STEP 1 " + userExistsStatus.userExists);
    
    //STEP 2: Validate user and password
    if(userExists == true ) {
      const passwordOutcome = await Functions.getUserPassword(userName);
      const actualPassword = passwordOutcome.hashedPassword
  
      try {
        if(await bcrypt.compare(password, actualPassword)) {
          passwordCorrect = true;
        } 
      } catch {
        console.log("CATCH error")
      }
    }

    //STEP 3: Check for Valid User and Set Tokens 
    if(userExists == true && passwordCorrect == true) {
      validUser = true;

      //STEP 4: Generate Refresh and Access Tokens
      var accessToken = await Functions.generateAccessToken(userName, '604800s') 
      var refreshToken = jwt.sign({currentUser: userName}, process.env.REFRESH_TOKEN_SECRET);

      //STEP 5: Add Refresh Token to Database
      const queryString = "INSERT INTO refresh_tokens (refresh_token, user_name, user_id) VALUES (?,?,?)"
      
      connection.query(queryString, [refreshToken, userName, userID], (err, results) => {
          if (!err) {
              console.log("You created a new refreshToken with ID " + results.insertId);      
          } else {    
              console.log("Error Problem with the Database!")
              console.log(err)
          } 
      }) 

      //STEP 6: Set Cookies 
      res.cookie('accessToken', accessToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('refreshToken', refreshToken, {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('loggedInUser', userName,{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      
    } else {
      res.cookie('accessToken', "accessToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('refreshToken', "refreshToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
      res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
    }

    const loginOutcome = {
      userName: userName,
      validUser: validUser,
      passwordCorrect: passwordCorrect,
      accessToken: accessToken,
      refreshToken, refreshToken
    }
    console.log(loginOutcome);

    res.json(loginOutcome)
}

//Logout User
async function userLogout(req, res) {
  const connection = db.getConnection(); 
  const userName = req.body.userName;
  const refreshToken = req.body.refreshToken;

  //STEP 1: Remove all Access Tokens for User 
  const queryString = "DELETE FROM refresh_tokens WHERE user_name= ?;"			
            
  connection.query(queryString, [userName], (err, rows) => {
      if (!err) {


      } else {

      }
  })

  //STEP 2: Remove Access Tokens
  res.cookie('accessToken', "accessToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('refreshToken', "refreshToken", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})

  console.log(refreshToken);
  res.json({logout: userName})
}

//Function A3: Login Status
async function loginStatus(req, res) {
  const userName = req.body.userName;
  var accessToken = ""
  var refreshToken = ""
  var userLoggedIn = false
  
  accessToken = req.cookies.accessToken;
  refreshToken = req.cookies.refreshToken;
  userLoggedIn = req.cookies.loggedInUser;
  
  const loginStatusOutcome = {
    userName: userName,
    userLoggedIn: userLoggedIn,
    accessToken: accessToken,
    refreshToken, refreshToken
  }

  console.log(loginStatusOutcome);

  res.json(loginStatusOutcome)
}

//Function A: 
async function getRefreshToken(req, res) {
  const userName = req.body.userName;
  //const refreshToken = req.body.refreshToken;

    //Part 1: Determine Auth Type 
    const cookieToken = req.cookies.refreshToken
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    headerToken = authHeader && authHeader.split(' ')[1]
    var tokenType = ""
    
 
  
    console.log("_____________________________________")
    //console.log("TOKEN TYPE: " + tokenType)
    console.log("cookieToken: " + cookieToken)
    console.log("headerToken: " + headerToken)
    console.log("_____________________________________")
    

  /*
  if(refreshToken == null) {
    console.log("No token!")
    return res.sendStatus(401)
  }
  */

  console.log("getting refresh token")

  res.json({cookieToken: cookieToken, headerToken:headerToken })

}


/*
   if(cookieToken != undefined) {
       tokenType = "cookie"
    } else if(headerToken != undefined) {
      tokenType = "header"
    } else {
      tokenType = null;
    }
  
    //Part 2: Get the Token
    if(tokenType == "cookie") {
      var refreshToken = req.cookies.token;
    } else if(tokenType == "header") {
      var refreshToken = authHeader && authHeader.split(' ')[1]
    } else {
      var refreshToken = null;
    }
    */
//Determine Which ONe
/*
  //Part 1: Determine Auth Type 
  cookieToken = req.cookies.refreshToken
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
  */

//Function A: Create a new Access Token from a Refresh Token 
async function tempGenerateTokenFromRefreshToken(currentUser, refreshToken, accessTokenLength) {

  return jwt.sign({currentUser: currentUser}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: accessTokenLength}); 
  
}



////

//FUNCTION 3: Use the Refresh Token to get a new Access Token 
/*
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
*/

////


//Function A5: Get Token List 
async function getTokenList(req, res) {
  console.log("getting all tokens")

  //Handle Database Errors Better 
  //STEP 1: Check against the database 
  const connection = db.getConnection(); 
  const tokenDeleted = 0;
  const queryString = "SELECT * FROM refresh_tokens LIMIT 10000";
  
  connection.query(queryString, (err, rows) => {
      if (!err) {
          const tokens = rows.map((row) => {
              return {
                  userName: row.user_name,
                  refreshToken: row.refresh_token,
                  tokenCreated: row.token_created,
              }
          });
  
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.json({tokens:tokens});
  
      } else {
          console.log("Failed to Select Posts" + err)
          res.sendStatus(500)
          return
      }
  })
}




/*

  if(accessToken == undefined) {
    accessToken = "notLoggedIn"
  }

  if(refreshToken == undefined) {
    refreshToken = "notLoggedIn"
  }

  if(refreshToken != undefined) {
    refreshToken = "notLoggedIn"
  }
*/


/*
app.post("/logout", (req, res) => {
  //const logoutToken = req.body.localRefreshToken;
  console.log("Log out the user with token")
  //console.log(logoutToken)
  console.log("________________________")

  //const currentUser = req.authorizationData.currentUser;

  //refreshTokens = refreshTokens.filter(token => token !== req.body.token);
  //Delete from Database 
  console.log(req.authorizationData)
  res.json({logout:"logoutToken" })
});

*/
//Function A2: Register New User 
async function userRegister(req, res) {
  const userName = req.body.userName;
  const fullName = req.body.fullName;
  const userEmail = req.body.email;
  const rawPassword = req.body.password
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.password, salt)
  var registerUserLoginOutcome = {}
  var registerUserProfileOutcome = {}

	const newUser = {
		userName: userName,
		fullName: fullName,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
	}

  //STEP 1: Validate Information
  var registrationOutcome = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);
  registrationOutcome.UserRegistrationMessages = []
  registrationOutcome.userName = ""
  registrationOutcome.userID = 0


  //STEP 2: Check if Username is taken 
  const userExistsStatus = await Functions.checkIfUserExists(userName)

  //Step 1A: User Provided valid Information
  if(registrationOutcome.validUserRegistration == 1) {

      //Step 2A: Username is available 
      if(userExistsStatus.userExists == 0) {
        console.log("user name is good!")
        

        //STEP 3: Register the New User 
        registerUserLoginOutcome = await User.registerUserLogin(newUser)
        console.log("STEP 3A: registerUserLoginOutcome")
        console.log(registerUserLoginOutcome)
    
        const userID = registerUserLoginOutcome.userID
        newUser.userID = userID
        console.log("your new ID " + userID)

        registerUserProfileOutcome = await User.registerUserProfile(newUser)
        console.log("STEP 3B: registerUserProfileOutcome")
        console.log(registerUserProfileOutcome)     
        
        //Step 3A: User was sucesfully registered 
        if(registerUserLoginOutcome.outcome + registerUserProfileOutcome.outcome == 2) {
          console.log("EVERYTHING GOOD IN DATABSE")
          registrationOutcome.userName = userName
          registrationOutcome.userID = userID
          registrationOutcome.validUserRegistration = 1
          registrationOutcome.UserRegistrationMessages.push("you succesfully registered " + userName + " with the ID " + userID)
        } else {
          console.log("nope!")
        }
        
        res.json(registrationOutcome);

      //Step 2B: Username is taken 
      } else {
        console.log("user name is taken!")
        registrationOutcome.usernameStatus = 0
        registrationOutcome.usernameMessages = []
        registrationOutcome.usernameMessages.push("user name is taken")
        registrationOutcome.UserRegistrationMessages.push("user name is taken")
        registrationOutcome.validUserRegistration = 0
        res.json(registrationOutcome)
      }

  } else {

    //UserName is taken
    if(userExistsStatus.userExists == 1) {
      registrationOutcome.usernameStatus = 0
      registrationOutcome.usernameMessages = []
      registrationOutcome.usernameMessages.push("user name is taken")
      registrationOutcome.UserRegistrationMessages.push("user name is taken")
      registrationOutcome.validUserRegistration = 0
    }

    console.log("User needs to provide better name and stuff")
    registrationOutcome.UserRegistrationMessages.push("User needs to provide better name and stuff")
    registrationOutcome.validUserRegistration = 0
    res.json(registrationOutcome)
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


module.exports = { userLogin, userRegister, loginStatus, userLogout, getRefreshToken, getTokenList, userDelete};




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

