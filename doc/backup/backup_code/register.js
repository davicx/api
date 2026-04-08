

//ORIGINAL
//Function A3: Register new User 
async function userRegisterORIGINAL(req, res) {
    //const userName = req.body.userName.toLowerCase();
    const userName = req.body.userName;
    const fullName = req.body.fullName;
    const userEmail = req.body.email;
    const rawPassword = req.body.password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
  
  
  
  
  
    /*
    STEP 1: Validate Information
  
    STEP 2: Check if Username is taken (if they gave good information )
    
    STEP 3: Register the New User
    Step 3A: Register User Login 
    Step 3A: Register User Profile 
          registerUserLoginOutcome = await User.registerUserLogin(newUser)
          registerUserProfileOutcome = await User.registerUserProfile(newUser)
    */
  
  
    //SORT BELOW
    var registerUserLoginOutcome = {}
    var registerUserProfileOutcome = {}
  
      var newUser = {
          userName: userName,
          fullName: fullName,
          userEmail: userEmail,
      password: hashedPassword,
      salt: salt
      }
  
    var registeredUser = {
      userName: "",
          fullName: "",
      userID: 0,
          userEmail: "",
    }
  
  
    var registrationOutcome = {
          data: {},
          success: false,
          message: "No Register Message", 
          statusCode: 500,
          errors: [], 
          currentUser: req.body.userName
      }
  
  
  
  
  
  
    //STEP 1: Validate Information
    var registrationValidationOutcome = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);
    registrationValidationOutcome.UserRegistrationMessages = []
  
    //STEP 2: Check if Username is taken 
    const userExistsStatus = await Functions.checkIfUserExists(userName)
    console.log(userExistsStatus)
  
    //Step 1A: User Provided valid Information
    if(registrationValidationOutcome.validUserRegistration == 1) {
  
        //Step 2A: Username is available 
        if(userExistsStatus.userExists == 0) {
          console.log("user name is good!")
          
          //STEP 3: Register the New User 
          registerUserLoginOutcome = await User.registerUserLogin(newUser)
          console.log("STEP 3A: registerUserLoginOutcome")
          console.log(registerUserLoginOutcome)
      
          const userID = registerUserLoginOutcome.userID
          newUser.userID = userID
          registeredUser.userID = userID
          console.log("your new ID " + userID)
  
          registerUserProfileOutcome = await User.registerUserProfile(newUser)
          console.log("STEP 3B: registerUserProfileOutcome")
          console.log(registerUserProfileOutcome)     
          
          //SUCCESS
          //Step 3A: User was sucesfully registered 
          if(registerUserLoginOutcome.outcome + registerUserProfileOutcome.outcome == 2) {
            console.log("EVERYTHING GOOD IN DATABSE")
            registrationOutcome.success = true
            registrationOutcome.statusCode = 200
            registrationOutcome.message = "You successfully Registered " + userName + "!"
       
            var registrationOutcome = {
              data: {},
              success: false,
              message: "No Register Message", 
              statusCode: 500,
              errors: [], 
              currentUser: req.body.userName
            }
  
            registeredUser.userName = userName
            registeredUser.fullName = fullName
            registeredUser.userEmail = userEmail
  
            registrationValidationOutcome.UserRegistrationMessages.push("you succesfully registered " + userName + " with the ID " + userID)
  
  
          } else {
            console.log("nope!")
            registrationOutcome.message = "There was an error with registering " + userName + "!"
       
          }
          
          //res.json(registrationValidationOutcome);
  
        //Step 2B: Username is taken 
        } else {
          console.log("user name is taken!")
          registrationOutcome.message = userName + " user name is taken!"
          registrationValidationOutcome.usernameStatus = 0
          registrationValidationOutcome.usernameMessages = []
          registrationValidationOutcome.usernameMessages.push("user name is taken")
          registrationValidationOutcome.UserRegistrationMessages.push("user name is taken")
          registrationValidationOutcome.validUserRegistration = 0
          //res.json(registrationValidationOutcome)
        }
  
    } else {
  
      //UserName is taken
      if(userExistsStatus.userExists == 1) {
        registrationOutcome.message = userName + "user name is taken!"
        registrationValidationOutcome.usernameStatus = 0
        registrationValidationOutcome.usernameMessages = []
        registrationValidationOutcome.usernameMessages.push("user name is taken")
        registrationValidationOutcome.UserRegistrationMessages.push("user name is taken")
        registrationValidationOutcome.validUserRegistration = 0
      }
  
      console.log("User needs to provide better name and stuff")
      registrationValidationOutcome.UserRegistrationMessages.push("User needs to provide better name and stuff")
      registrationValidationOutcome.validUserRegistration = 0
      //res.json(registrationValidationOutcome)
    }
  
    registrationOutcome.data.registrationMessages = registrationValidationOutcome
    registrationOutcome.data.registeredUser = registeredUser
  
  
    res.json(registrationOutcome)
  } 
  