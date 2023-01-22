var validator = require("email-validator");
//METHODS A: Validation 
 
//Functions A: User Validation 
//Function A1: Validate User Registration  
function validateRegisterUser(userEmail, userName, fullName, password) {
    const validEmail = validateEmail(userEmail);
    const validUsername = validateUsername(userName);
    const validFullname = validateFullName(fullName);
    const validPassword = validatePassword(password);

    //Create the template object 
    const validationOutcome = {
        emailStatus: 0,
        emailMessages: [],

        usernameStatus: 0,
        usernameMessages: [],

        fullNameStatus: 0,
        fullNameMessages: [],

        passwordStatus: 0,
        passwordMessages: [],

        validUserRegistration: 0

    }

    //Set all the validation outcomes 
    validationOutcome.emailStatus = validEmail.emailStatus;
    validationOutcome.emailMessages = validEmail.emailMessages;
    validationOutcome.usernameStatus = validUsername.usernameStatus;
    validationOutcome.usernameMessages = validUsername.usernameMessages;
    validationOutcome.fullNameStatus = validFullname.fullnameStatus;
    validationOutcome.fullNameMessages = validFullname.fullnameMessages;
    validationOutcome.passwordStatus = validPassword.passwordStatus;
    validationOutcome.passwordMessages = validPassword.passwordMessages;

    var validUserSum =  validationOutcome.emailStatus + validationOutcome.usernameStatus + validationOutcome.fullNameStatus + validationOutcome.passwordStatus;
    
    if(validUserSum == 4) {
        validationOutcome.validUserRegistration = 1
    } 

    return validationOutcome;

}

//Function A2: Validate Email 
function validateEmail(email) {
    const emailOutcome = {
        emailStatus: 0,
        emailMessages: [],
    }

    if(validator.validate(email)) {
        emailOutcome.emailStatus = 1;
        emailOutcome.emailMessages.push("Appears to be a valid email")
        //console.log("appears to be a valid email")
    } else {
        emailOutcome.emailMessages.push("This does not appear to be a valid email")
    }

    return emailOutcome;
}

//Function A3: Validate Username
function validateUsername(username) {
    const usernameOutcome = {
        usernameStatus: 0,
        usernameMessages: [],
    }

    if(username.length > 20) {
        usernameOutcome.usernameMessages.push("Your username must be less then 20 characters")
    } else if (username.length < 5) {
        usernameOutcome.usernameMessages.push("Your username must be greater then 5 characters")
    } else {
        if(validAlphaNumeric(username)) {
            usernameOutcome.usernameMessages.push("Username looks good!")
            usernameOutcome.usernameStatus = 1;
        } else {
            usernameOutcome.usernameMessages.push("You must use valid alphabet and numbers and stuff")
        }  
    }  

    return usernameOutcome;
}

//Function A4: Validate Full Name 
function validateFullName(fullNameRaw) {
    const fullnameOutcome = {
        fullnameStatus: 0,
        fullnameMessages: [],
    }
    fullName = fullNameRaw.replace(/\s/g,'');
    //console.log(fullName)

    if(fullName.length > 50) {
        fullnameOutcome.fullnameMessages.push("Your fullname must be less then 50 characters")
    } else if (fullName.length < 5) {
        fullnameOutcome.fullnameMessages.push("Your fullname must be greater then 5 characters")
    } else {
        if(validAlphaNumeric(fullName)) {
            fullnameOutcome.fullnameMessages.push("fullname looks good!")
            fullnameOutcome.fullnameStatus = 1;
        } else {
            fullnameOutcome.fullnameMessages.push("You must use valid alphabet and numbers and stuff")
        }  
    }  

    return fullnameOutcome;
 
}

//Function A5: Validate Password 
function validatePassword(password) {
    const passwordOutcome = {
        passwordStatus: 0,
        passwordMessages: [],
    }

    if(password.length < 5) {
        passwordOutcome.passwordMessages.push("Your password must be more then 5 characters")
    }  else {
        if(validAlphaNumeric(password)) {
            passwordOutcome.passwordMessages.push("Password looks good!")
            passwordOutcome.passwordStatus = 1;
        } else {
            passwordOutcome.passwordMessages.push("You must use valid alphabet and numbers and stuff")
        }  
    }  

    return passwordOutcome;
}

function validAlphaNumeric(checkString) {
    var RegEx = /^[a-z0-9]+$/i;
    var Valid = RegEx.test(checkString);

    //console.log(Valid)
    return Valid
}

module.exports = { validateRegisterUser, validateEmail, validateUsername, validateFullName, validatePassword }
