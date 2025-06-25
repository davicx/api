const db = require('./conn');
const Functions = require('../functions/functions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_GROUPS_BUCKET_NAME
const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');
const Group = require('./classes/Group');

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')


/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Check if users are already in the group
	2) Function A2: Check if Group exists (by ID)
	3) Function A3: Check if a User is in a Group

*/

// uploadHelper.js

function handlePostUploadResult(req, err) {
	const postOutcome = {
		message: "",
		uploadSuccess: false
	};

	// STEP 2: Upload Post to API (UPLOAD)
	console.log("STEP 2: Upload Post to API");

	if (err instanceof multer.MulterError) {
		console.log("Error 2A: File too large");
		postOutcome.message = "Error 2A: File too large";

	} else if (err) {
		console.log("Error 2B: Not Valid Image File");
		postOutcome.message = "Error 2B: Not Valid Image File";

	} else {
		const file = req.file;
		console.log("Success 2A: No Multer Errors");

		if (file !== undefined) {
			console.log("Success 2B: Success Upload File");
			postOutcome.uploadSuccess = true;
		} else {
			console.log("Error 2C: No File mah dude!");
			postOutcome.message = "Error 2C: No File mah dude!";
		}
	}

	return postOutcome;
}


function handleUploadResult(req, err) {
	const uploadOutcome = {
		uploadSuccess: false,
		containsFile: false,
		message: "",
		statusCode: 500
	};

	console.log("STEP 2: Upload File to API");

	if (err instanceof multer.MulterError) {
		console.log("Error 2A: File too large");
		uploadOutcome.message = "Error 2A: File too large";
		uploadOutcome.containsFile = true;
		uploadOutcome.statusCode = 413;
	} else if (err) {
		console.log("Error 2B: Not Valid Image File");
		uploadOutcome.message = "Error 2B: Not Valid Image File";
		uploadOutcome.containsFile = true;
		uploadOutcome.statusCode = 415;
	} else {
		let file = req.file;
		console.log("Success 2A: No Multer Errors");

		if (file !== undefined) {
			console.log("Success 2B: Success Upload File");
			uploadOutcome.uploadSuccess = true;
			uploadOutcome.containsFile = true;
			uploadOutcome.message = "Success 2B: Success Upload File";
			uploadOutcome.statusCode = 200;
		} else {
			console.log("No File mah dude! we will use a default");
			uploadOutcome.uploadSuccess = true;
			uploadOutcome.containsFile = false;
			uploadOutcome.message = "No File mah dude! we will use a default";
			uploadOutcome.statusCode = 200;
		}
	}

	return uploadOutcome;
}

async function getAWSSignedURL(post) {

	if(Functions.compareStrings(post.cloudKey, "local_cloud_key") == false) {
		let signedURL = await cloudFunctions.getSignedURL(post.cloudKey)
		console.log("getSignedURL: IF");
		console.log(signedURL);
		post.fileURL = signedURL;
	} else {
		console.log("getSignedURL: ELSE");
		post.fileUrl = "#"
	}

	return post;
}

module.exports = { handleUploadResult, handlePostUploadResult, getAWSSignedURL }




