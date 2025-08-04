const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');
const Group = require('./classes/Group');
const Functions = require('../functions/functions');
const cloudFunctions = require('../functions/cloudFunctions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');

const db = require('./conn');

const bucketName = process.env.AWS_BUCKET_NAME

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


//Function A1: This will get a link that will show the actual image and can handle aws or a local image
async function getImageURL(storageLocation, imageURL, cloudKey) {
	if(Functions.compareStrings(storageLocation, "aws") == true) {
		console.log("fileFunctions: Get AWS Photo FOR " + cloudKey)
		let signedImageURL = await cloudFunctions.getSignedURL(cloudKey)
		
		return signedImageURL;
	} else {
		console.log("Good to go!")  
		return imageURL;   
	}
}

function handleUploadResult(req, err) {
	const uploadOutcome = {
		message: "",
		uploadSuccess: false,
		containsFile: false,
		statusCode: 400
	};

	// STEP 2: Upload Post to API (UPLOAD)
	//console.log("STEP 2: Upload Post to API");

	if (err instanceof multer.MulterError) {
		console.log("Error 2A: File too large");
		uploadOutcome.statusCode = 413;
		uploadOutcome.message = "Error 2A: File too large";

	} else if (err) {
		console.log("Error 2B: Not Valid Image File");
		uploadOutcome.statusCode = 415;
		uploadOutcome.message = "Error 2B: Not Valid Image File";

	} else {
		const file = req.file;
		console.log("Success 2A: No Multer Errors");

		if (file !== undefined) {
			console.log("Success 2B: Success Upload File");
			uploadOutcome.uploadSuccess = true;
			uploadOutcome.containsFile = true;
			uploadOutcome.statusCode = 200;
		} else {
			console.log("Error 2C: No File mah dude!");
			uploadOutcome.message = "Error 2C: No File mah dude!";
			uploadOutcome.statusCode = 400;
		}
	}

	return uploadOutcome;
}


function handleOptionalFileUploadResult(req, err) {
	const uploadOutcome = {
		uploadSuccess: false,
		containsFile: false,
		message: "",
		statusCode: 500
	};

	//console.log("STEP 2: Upload File to API");

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


function buildGroupUploadFileObject(file, uploadOutcome, groupsFolder) {
	if (!uploadOutcome.containsFile) {
		return {
			fileMimetype: "image/png",
			originalname: "group_image.jpg",
			fileNameServer: "group_image.jpg",
			fileURL: "http://localhost:3003/" + bucketName + "/" + groupsFolder + "/" + "group_image.jpg",
			cloudKey: groupsFolder + "/" + "group_image.jpg",
			bucket: bucketName,
			storageType: "local"
		};
	}


	return {
		fileMimetype: file.mimetype,
		originalname: file.originalname,
		fileNameServer: file.filename,
		fileURL: "http://localhost:3003/" + bucketName + "/" + groupsFolder + "/" + file.filename,
		cloudKey: groupsFolder + "/" + file.filename,
		bucket: bucketName,
		storageType: "local"
	};
}


//NOT USED?
async function getProfileAWSSignedURL(post) {
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



module.exports = { handleOptionalFileUploadResult, handleUploadResult, buildGroupUploadFileObject, getAWSSignedURL, getProfileAWSSignedURL, getImageURL }




