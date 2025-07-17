const db = require('../functions/conn');
const Group = require('../functions/classes/Group');
const Post = require('../functions/classes/Post');
const Notification = require('../functions/classes/Notification')
const Comment = require('../functions/classes/Comment')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const friendFunctions = require('../functions/friendFunctions');
const profileFunctions = require('../functions/profileFunctions');
const PostFunctions = require('../functions/postFunctions');
const userFunctions = require('../functions/userFunctions');
const timeFunctions = require('../functions/timeFunctions');
const fileFunctions = require('../functions/fileFunctions');
const likeFunctions = require('../functions/likeFunctions');
const cloudFunctions = require('../functions/cloudFunctions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_POSTS_BUCKET_NAME

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')

/*
FUNCTIONS A: All Functions Related to New Item
	1) Function A1: Post Item

 
FUNCTIONS B: All Functions Related to getting Items
	1) Function B1: Get all Group Items
	2) Function B2: Get all Group Items (Pagination)


*/

//TO DO: Make output the same Add a template
//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Item
async function postItemLocal(req, res) {
	uploadFunctions.uploadPostPhotoLocal(req, res, async function (err) {
		var groupID = req.body.groupID;
		var currentUser = req.body.postFrom

		var headerMessage = "New Post Photo created by " + currentUser + " Local to Local"
		Functions.addHeader(headerMessage)

		var postOutcome = {
			data: {},
			message: "hi", 
			success: false,
			statusCode: 400,
			errors: [], 
			currentUser: currentUser
		}

		var uploadFile = {}

		//STEP 1: Check for Valid File
		const uploadResult = fileFunctions.handleOptionalFileUploadResult(req, err);
		console.log("STEP 1: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadResult.uploadSuccess)

		uploadSuccess = uploadResult.uploadSuccess;
		postOutcome.message = uploadResult.message;
		
		//Step 1A: Handle if there is a file but it has an issue uploading
		if (!uploadResult.uploadSuccess) {
			console.log("STEP 1 (ERROR): Invalid or missing file.");
			Functions.addFooter();
			return res.status(postOutcome.statusCode).json(postOutcome);
		}

		//STEP 2: Upload File to storage (Local) and get file information
		//Step 2A: Update with a image 
		if(uploadResult.containsFile == true) {
			console.log("FILE!!")

			let file = req.file
			console.log("STEP 2: Upload File to storage (Local) and get file information")

			//STEP 3: Create the Upload File with its information
			uploadFile.fileMimetype = file.mimetype; 
			uploadFile.originalname = file.originalname; //file_name
			uploadFile.fileNameServer = file.filename; //file_name_server
			
			//Settings: Local 
			uploadFile.fileURL = "http://localhost:3003/" + bucketName + "/" + file.filename; //file_url (image_url)
			uploadFile.cloudKey = "no_cloud_key"; //cloud_key
			uploadFile.bucket = bucketName; //cloud_bucket	
			uploadFile.storageType = "local"; //storage_type
			
			//Settings: Cloud
			//uploadFile.fileURL = result.Location; // file_url
			//uploadFile.cloudKey = result.Key; //cloud_key 
			//uploadFile.bucket = result.Bucket; // cloud_bucket 	
			//uploadFile.storageType = "aws"; //storage_type		
		

		//Step 2A: Update without an image 
		} else {
			//Need a better upload default file 
			console.log("NO FILE!! We will use a default ")
			uploadFile = {
				fileMimetype: 'image/jpeg',
				originalname: 'background.jpg',
				fileNameServer: 'postImage-1752452613886-53069656-background.jpg',
				fileURL: 'http://localhost:3003/kite-posts-us-west-two/postImage-1752452613886-53069656-background.jpg',
				cloudKey: 'no_cloud_key',
				bucket: 'kite-posts-us-west-two',
				storageType: 'local'
			  }; 

			  console.log(uploadFile)
		}
	
		//POST
		let newPostOutcome = await Post.createPostItem(req, uploadFile);

        console.log("newPostOutcome")
        console.log(newPostOutcome)
        console.log("newPostOutcome")

		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true

		//STEP 3: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 4: Add notifications")

			var postID = 0
			if (newPostOutcome.newPost.postID) {
				postID = newPostOutcome.newPost.postID
			}

			if(newPostOutcome.outcome == 200) {
				notification = {
					masterSite: "kite",
					notificationFrom: req.body.postFrom,
					notificationMessage: req.body.notificationMessage,
					notificationTo: "",
					notificationLink: req.body.notificationLink,
					notificationType: req.body.notificationType,
					groupID: groupID,
					postID: postID
				}

				console.log(groupUsers)
				for (let i = 0; i < groupUsers.length; i++) {
					//let notificationTo = groupUsers[i];
					notification.notificationTo = groupUsers[i];
					console.log(groupUsers[i]);
					let notificationOutcome = await Notification.createSingleNotification(notification)
					console.log(notificationOutcome)
				} 
			}
		}

		Functions.addFooter()
		res.json(postOutcome)

    })
}

async function postItemLocalAWS(req, res) {
	var headerMessage = "HEADER: New AWS Photo Post "
	Functions.addHeader(headerMessage)
	uploadFunctions.uploadPostPhotoLocal(req, res, async function (err) {

		var uploadSuccess = false
		var groupID = req.body.groupID;
	
		var postOutcome = {
			data: {},
			message: "hi", 
			success: true,
			statusCode: 200,
			errors: [], 
			currentUser: req.body.postFrom
		}

		//STEP 1: Check for a valid file
		const uploadResult = fileFunctions.handleUploadResult(req, err);
		console.log("STEP 1: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadOutcome.uploadSuccess)
	
		uploadSuccess = uploadResult.uploadSuccess;
		postOutcome.message = uploadResult.message;
		
		if (!uploadResult.uploadSuccess) {
			console.log("STEP 1 (ERROR): Invalid or missing file.");
			Functions.addFooter();
		}

		//STEP 2: Upload File to storage (AWS) and get file information
		var uploadFile = {}
		let file = req.file
		console.log("STEP 2: Upload File to storage (AWS) and get file information")
			
		//const fileExtension = mime.extension(file.mimetype) 
		const result = await awsStorage.uploadPost(file)


		//STEP 3: Create the Upload File with its information
		//File Information
		uploadFile.fileMimetype = file.mimetype; 
		uploadFile.originalname = file.originalname; //file_name
		uploadFile.fileNameServer = file.filename; //file_name_server

		//Settings: Local 
		//uploadFile.fileURL = file.path; //file_url
		//uploadFile.cloudKey = file.path; //cloud_key
		//uploadFile.bucket = file.destination; //cloud_bucket	
		//uploadFile.storageType = "aws"; //storage_type
		
		//Settings: Cloud
		uploadFile.fileURL = result.Location; // file_url
		uploadFile.cloudKey = result.Key; //cloud_key 
		uploadFile.bucket = result.Bucket; // cloud_bucket 	
		uploadFile.storageType = "aws"; //storage_type		

		//STEP 3: Add Post to Database
		let newPostOutcome = await Post.createPostPhoto(req, uploadFile);

		//STEP 4: Get a Signed URL so we can display this new post
		var newPost = await PostFunctions.getSignedURL(newPostOutcome.newPost);
		
		postOutcome.data = newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true
		console.log("STEP 3: Post was added to the Database")

		//STEP 4: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 4: Add notifications")

			//Set the Post ID for the new post in notifications
			var postID = 0
			if (newPostOutcome.newPost.postID) {
				postID = newPostOutcome.newPost.postID
			}

			if(newPostOutcome.outcome == 200) {
				notification = {
					masterSite: "kite",
					notificationFrom: req.body.postFrom,
					notificationMessage: req.body.notificationMessage,
					notificationTo: groupUsers,
					notificationLink: req.body.notificationLink,
					notificationType: req.body.notificationType,
					groupID: groupID,
					postID: postID
				}

				//console.log(notification)

				if(groupUsers.length > 0) {
					Notification.createGroupNotification(notification);
				}
			}
		}
			
		
		
		console.log(" ")
		console.log("________________________________")
	
		res.json(postOutcome)

	  Functions.addFooter()

  })
}


//FUNCTIONS B: All Functions Related to getting Items
//Function B1: Get all Group Items
//http://localhost:3003/items/group/70
async function getAllGroupItems(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentUser = req.currentUser
	
	var headerMessage = "HEADER: Get all Group Items for Group: " + groupID
	Functions.addHeader(headerMessage)
	

	//STEP 1: Get All Posts
	var postsOutcome = await Post.getGroupItemsAll(groupID)
	var postsRaw = postsOutcome.posts;

	//STEP 2: Get All Comments for these Posts 
	var postsComments = await PostFunctions.addPostComments(currentUser, postsRaw, groupID)

	//STEP 3: Get all Likes for these Posts
	var postsLikes = await PostFunctions.addPostLikes(currentUser, postsComments)
	
	//STEP 4: Get Image URL
	var posts = await PostFunctions.addSignedURLPostsArray(postsLikes);

	//let signedURL = await cloudFunctions.getSignedURL("images/postImage-1716851490721-546172183-59045070_p0.jpg")

	var postsResponse = {
		data: posts,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	Functions.addFooter()
	res.json(postsResponse)

}


module.exports = { postItemLocal, postItemLocalAWS, getAllGroupItems };

