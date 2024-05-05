
//APPENDIX
/*

//Function A2: Post Photo
async function postPhoto(req, res, file) {
	const groupID = req.body.groupID;
	postOutcome = await Post.createPostPhoto(req, file);

	var postOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 2: Add the Notification
	var notification = {}
	const groupUsersOutcome = await Group.getGroupUsers(groupID);
	const groupUsers = groupUsersOutcome.groupUsers;
	
	if(postOutcome.outcome == 200) {
		notification = {
			masterSite: "kite",
			notificationFrom: req.body.postFrom,
			notificationMessage: req.body.notificationMessage,
			notificationTo: groupUsers,
			notificationLink: req.body.notificationLink,
			notificationType: req.body.notificationType,
			groupID: groupID
		}
 
		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}
	res.json({postOutcome});
}

*/




/*
async function postPhoto(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {
  
	  //STEP 1: Upload Photo
	  var uploadSuccess = false
	  var file = null;
  
	  var postOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	  }
  
	  //Step 1A: File too large
	  if (err instanceof multer.MulterError) {
		postOutcome.message = err.message
		postOutcome.errors.push(err)
		postOutcome.data = {failureCode: 1}
  
	  //Step 1B: Not Valid Image File
	  } else if (err) {
		postOutcome.message = err.message
		postOutcome.data = {failureCode: 2}
		postOutcome.errors.push("Step 1B: Not Valid Image File")
  
	  //Step 1C: No Multer Errors
	  } else {

		//Step 1D: Success Upload File
		if(file !== undefined) {
			console.log("There is a file!")
			//var file = req.file
			//var fileExtension = mime.extension(file.mimetype);
		
			uploadSuccess = true   
		} else {
		  console.log("No File")
		  postOutcome.data = {failureCode: 3}
		  postOutcome.message = "Please choose an image file"
		  
		} 
	  }


	  //STEP 2: Create New Post
	  if(uploadSuccess == true) {
		let newPostOutcome = await Post.createPostPhoto(req, file);
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true
		
		postOutcome.data.file = {
			file: file,
			caption: req.body.caption,
			fileExtension: fileExtension,
			newPostOutcome: newPostOutcome
		}
		
		console.log("Made your post!")
		console.log(req.body)
		console.log(file)
		console.log(fileExtension)
		
	  } 
  
	  res.json(postOutcome)
  
	})
}
*/

//Might Need
/*
require('dotenv').config()
const express = require('express')
const app = express()
const uploadRouter = express.Router();

//const cookieParser = require('cookie-parser');
//const morgan = require('morgan')
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')
var cors = require('cors')
uploadRouter.use(cors())

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const upload = multer({ dest: './uploads' })
const uploadFunctions = require('./uploadFunctions')
*/


/*

//Function A2: Post Photo
async function postPhotoPULLFROM(req, res, file) {
	const groupID = req.body.groupID;
	postOutcome = await Post.createPostPhoto(req, file);

	var postOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 2: Add the Notification
	var notification = {}
	const groupUsersOutcome = await Group.getGroupUsers(groupID);
	const groupUsers = groupUsersOutcome.groupUsers;
	
	if(postOutcome.outcome == 200) {
		notification = {
			masterSite: "kite",
			notificationFrom: req.body.postFrom,
			notificationMessage: req.body.notificationMessage,
			notificationTo: groupUsers,
			notificationLink: req.body.notificationLink,
			notificationType: req.body.notificationType,
			groupID: groupID
		}
 
		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}
	res.json({postOutcome});
}

*/