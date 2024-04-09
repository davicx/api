const db = require('../functions/conn');
const profileFunctions = require('../functions/profileFunctions');
const Profile = require('../functions/classes/Profile');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());


/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Get Simple User Profile
	3) Function A3: Update User Profile
*/

//Function A1: Get User Profile
async function getUserProfile(req, res) {
    const connection = db.getConnection(); 
    let currentUser = req.params.user_name;

    var userProfileOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.params.user_name
	}

    //STEP 1: Get User Profile Information
    let getUserProfileOutcome = await Profile.getUserProfile(currentUser);


    if(getUserProfileOutcome.success == true) {
        userProfileOutcome.message = "We got the user profile for " + currentUser;
        userProfileOutcome.success = true;
        userProfileOutcome.statusCode = 200;
        userProfileOutcome.data = getUserProfileOutcome.userProfile;
    }

    res.json(userProfileOutcome)

}

//Function A2: Get Simple User Profile
async function getSimpleUserProfile(req, res) {
    const connection = db.getConnection(); 
    let currentUser = req.params.user_name;

    var userProfileOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.params.user_name
	}

    //STEP 1: Get User Profile Information
    let getUserProfileOutcome = await Profile.getUserProfile(currentUser);
    console.log("STEP 1: Getting User Profile Information ")

    if(getUserProfileOutcome.success == true) {
        userProfileOutcome.message = "We got the user profile for " + currentUser;
        userProfileOutcome.success = true;
        userProfileOutcome.statusCode = 200;
        userProfileOutcome.data = getUserProfileOutcome.userProfile;
    }

    res.json(userProfileOutcome)

}

//Function A3: Update User Profile
async function updateUserProfile(req, res) {
    const connection = db.getConnection(); 

    console.log(req.body)

    var updateUserProfileOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}


    //STEP 1: Create updated user Information
    let currentUser = req.body.currentUser
    let imageName = req.body.imageName
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let biography = req.body.biography

    let updatedUser = {
        currentUser: currentUser,
        imageName: imageName,
        firstName: firstName,
        lastName: lastName,     
        biography: lastName     
    }
    console.log("STEP 1: Created Updated User Profile Information ")
    console.log(updatedUser)

    //STEP 2: Update User Profile
    let updateUserProfile = await Profile.updateUserProfile(updatedUser);

    if(updateUserProfile.success == true) {
        console.log("STEP 2: Successfully Updated User Profile Information ")
        updateUserProfileOutcome.message = "We updated the user profile for " + currentUser;
        updateUserProfileOutcome.success = true;
        updateUserProfileOutcome.statusCode = 200;
        updateUserProfileOutcome.data = updatedUser;
    } else {
        console.log("STEP 2: There was an error Updating User Profile Information ")
    }
    
    res.json(updateUserProfileOutcome)

}


module.exports = { getUserProfile, getSimpleUserProfile, updateUserProfile };
