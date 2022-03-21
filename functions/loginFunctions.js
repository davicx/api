const db = require('./conn');
const bcrypt = require('bcrypt')
//app.use(express.json());
const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')
//const Notification = require('./classes/Notifications');

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Login
	1) Function A2: Register
	1) Function A3: Delete a User 

*/

//FUNCTIONS A: All Functions Related to a User 
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
    res.json({type: "Add temp delete"})
  }


}


//Function A1: Get User Profile
async function userLogin(req, res) {
    const userName = req.body.username;
    const password = req.body.password;
    
    const userExistsStatus = await Functions.checkIfUserExists(userName)
    console.log("________Exists__________")
    console.log(userExistsStatus)
    console.log("_________user login_________")
    if(userExistsStatus.userID == 0) {
      console.log(userName + " is not a valid username")
    } else {
      var currentUserOutcome = await User.getUserInfo(userName)
      console.log(currentUserOutcome)
      console.log("__________________")
      
    }

    res.json({userName: userName, password: password})
}

/*
app.post("/login", async(req, res) => {
  const loginUserName = req.body.username;
  
  //Search for User 
  const user = users.find(user => user.userName = req.body.username)
  
  var loginResponse = {
    user: user,
    messages: [],
    errorMessages: []
  }

  if (user != null ) {
    try {
      if(await bcrypt.compare(req.body.password, user.password)) {
            const successMessage = 'yay! worked ' + req.body.username;
            loginResponse.messages.push(successMessage);
      } else {
        const passwordErrorMessage = 'password no matchy!';
        loginResponse.messages.push(passwordErrorMessage);
      }
    } catch {
      res.status(500).send();
    }
  } else {
    const errorMessage = "Could not find "  + loginUserName
    console.log("Could not find "  + loginUserName)
    loginResponse.errorMessages.push(errorMessage);
  }
  
  res.json(loginResponse)

})
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
    const registerUserLoginOutcome = await User.registerUserLogin(newUser)
    console.log(registerUserLoginOutcome)

    const userID = registerUserLoginOutcome.userID
    console.log("your new ID " + userID)
    newUser.userID = userID

    const registerUserProfileOutcome = await User.registerUserProfile(newUser)
    //User.registerUserProfile(newUser)
    console.log(registerUserProfileOutcome)

    res.json(registerUserProfileOutcome)

	} else {
    console.log("user name is taken!")
    res.json({userNameTaken: "userNameTaken"})
	}

} 

module.exports = { userLogin, userRegister, userDelete};