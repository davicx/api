const express = require('express')
const profileRouter = express.Router();
const functions = require('../functions/functions')
//const posts = require('../logic/posts')
const profile = require('../logic/profile')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');
const middlewares = require('../functions/middlewareFunctions')

/*
FUNCTIONS A: All Routes Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Update User Profile
	3) Function A3: Update User Image

*/


//FUNCTIONS A: All Routes Related to User Profile
//Function A1: Get User Profile
profileRouter.get("/profile/:user_name", middlewares.verifyUser, (req, res) => {
    profile.getUserProfile(req, res);
})


//Function A2: Update User Profile
profileRouter.post("/profile/update", (req, res) => {
	profile.updateUserProfile(req, res);
})


//Function A3: Update Full User Profile
profileRouter.post("/profile/full/update",(req, res) => {
	//profile.updateUserProfile(req, res);
	const appLocation = process.env.APP_LOCATION
	const fileLocation = process.env.FILE_LOCATION

	let cloud_environment = functions.getCloudEnvironments(appLocation, fileLocation)
	
	//Type 1: Local to Local 
	if(functions.compareStrings(cloud_environment, "local_local")) {
		console.log("Profile Router: Type 1: Local to Local")
		profile.updateFullUserProfileLocal(req, res);

	//Type 2: Local to AWS 	
	} else if (functions.compareStrings(cloud_environment, "local_aws")) {
		console.log("Profile Router: Type 2: Local to AWS")
		profile.updateFullUserProfileLocalAWS(req, res);

	//Type 3: AWS to AWS	
	} else if(functions.compareStrings(cloud_environment, "aws_aws")) {
		console.log("Profile Router: Type 3: AWS to AWS")
		//profile.updateFullUserProfile(req, res);
		res.json({yo:"haven't done yet!"})

	} else {
		res.json({outcome:"uhh whats up dude", appLocation: appLocation, fileLocation:fileLocation})
	}
	
})




module.exports = profileRouter;


