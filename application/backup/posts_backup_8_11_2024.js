const db = require('../functions/conn');
const Group = require('../functions/classes/Group');
const Post = require('../functions/classes/Post');
const Notification = require('../functions/classes/Notification')
const Comment = require('../functions/classes/Comment')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const friendFunctions = require('../functions/friendFunctions');
const PostFunctions = require('../functions/postFunctions');
const userFunctions = require('../functions/userFunctions');
const timeFunctions = require('../functions/timeFunctions');
const likeFunctions = require('../functions/likeFunctions');
const cloudFunctions = require('../functions/cloudFunctions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')

/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Post Text
	2) Function A2: Post Photo
	3) Function A3: Post Video
	4) Function A4: Post Article
 
FUNCTIONS B: All Functions Related to getting Posts
	1) Function B1: Get all Group Posts
	2) Function B2: Get all User Posts 
	3) Function B3: Get Single Post by ID 
	4) Function B4: Get All Posts

FUNCTIONS C: All Functions Related to Post Actions
	1) Function C1: Like a Post
	2) Function C2: Unlike a Post 
	3) Function C3: Select all Likes
	4) Function C4: Select all Likes for a Post
	5) Function C5: Delete a Post
	6) Function C5: Edit a Post

*/

//TO DO: Make output the same Add a template
//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Text
async function postText(req, res) {
	console.log("____________________________")
	console.log("NEW POST: Post Text")
	const groupID = req.body.groupID;
	var postOutcome = {
		//data: {},
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.postFrom
	}

	//STEP 1: Make a new post
	console.log("STEP 1: Make a new post")
	var newPostOutcome = await Post.createPostText(req);
	
	if(newPostOutcome.outcome == 200) {
		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "You made a Text post!"
		postOutcome.statusCode = 200
		postOutcome.success = true
		var postID = 0
		if (newPostOutcome.newPost.postID) {
			postID = newPostOutcome.newPost.postID
		}

		//STEP 2: Add the Notifications
		console.log("STEP 2: Add notifications")
		var notification = {}
		const groupUsersOutcome = await Group.getGroupUsers(groupID);
		const groupUsers = groupUsersOutcome.groupUsers;

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

			if(groupUsers.length > 0) {
				Notification.createGroupNotification(notification);
			}
		}
		
		//STEP 3: New Post Outcome 
		console.log("STEP 3: New Post Outcome")
		console.log(postOutcome)
		console.log("YOU MADE A NEW POST!")
	} else {
		postOutcome.message = "There was a problem making your post!"
		postOutcome.statusCode = 500
		postOutcome.success = false
		console.log("STEP 3: Something went wrong making this post!")
	} 

	res.json(postOutcome);
	console.log("____________________________")
}


/*
*/
//Function A2: Post Photo (Cloud)
async function postPhoto(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {

	var uploadSuccess = false
	var groupID = req.body.groupID;

	var postOutcome = {
		data: {},
		message: "hi", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 1: Upload Post to API
	console.log("STEP 1: Upload Post to API")
	//Error 1A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 1A: File too large")
		postOutcome.message = "Error 1A: File too large"
  
	//Error 1B: Not Valid Image File
	} else if (err) {
		console.log("Error 1B: Not Valid Image File")
		postOutcome.message = "Error 1B: Not Valid Image File"

	//Success 1A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 1A: No Multer Errors")


		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 1B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 1C: No File mah dude!")
		  postOutcome.message = "Error 1C: No File mah dude!"
 
		} 
	}

	//STEP 2: Add Post to Database
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file
		let newPostOutcome = await Post.createPostPhoto(req, file);
		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true

		//STEP 3: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 3: Add notifications")

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

				console.log(notification)

				if(groupUsers.length > 0) {
					Notification.createGroupNotification(notification);
				}
			}
		}
	}

    res.json(postOutcome)

  })
}


async function postPhotoLocal(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {

		var uploadSuccess = false
		var groupID = req.body.groupID;
	
		var postOutcome = {
			data: {},
			message: "hi", 
			success: true,
			statusCode: 200,
			errors: [], 
			currentUser: req.body.currentUser
		}

		//STEP 1: Check for a valid file
		console.log("STEP 1: Upload Post to API")

		//Error 1A: File too large
		if (err instanceof multer.MulterError) {
			console.log("Error 1A: File too large")
			postOutcome.message = "Error 1A: File too large"
	  
		//Error 1B: Not Valid Image File
		} else if (err) {
			console.log("Error 1B: Not Valid Image File")
			postOutcome.message = "Error 1B: Not Valid Image File"
	
		//Success 1A: No Multer Errors
		} else {
			let file = req.file
			console.log("Success 1A: No Multer Errors")
	
			//Success 1B: Success Upload File
			if(file !== undefined) {
				console.log("Success 1B: Success Upload File")
				uploadSuccess = true   
	
			//Error 1C: No File 	
			} else {
			  console.log("Error 1C: No File mah dude!")
			  postOutcome.message = "Error 1C: No File mah dude!"
	 
			} 
		}
	

		//STEP 2: Upload to AWS
		if(uploadSuccess == true) {
			console.log("STEP 2: Add Post to Database")
			let file = req.file
			console.log(file)
			
			const fileExtension = mime.extension(file.mimetype) 
			const result = await awsStorage.uploadFile(file)

			console.log(result)

			//File Information
			var uploadFile = {}
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
			
		}
		
		console.log(" ")
		console.log("________________________________")
	
		res.json(postOutcome)
	
	  })
}


async function postPhotoLocalHASERROR(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {

	var uploadSuccess = false
	var groupID = req.body.groupID;

	var postOutcome = {
		data: {},
		message: "hi", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 1: Upload Post to API
	console.log("STEP 1: Upload Post to API")
	//Error 1A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 1A: File too large")
		postOutcome.message = "Error 1A: File too large"
  
	//Error 1B: Not Valid Image File
	} else if (err) {
		console.log("Error 1B: Not Valid Image File")
		postOutcome.message = "Error 1B: Not Valid Image File"

	//Success 1A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 1A: No Multer Errors")


		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 1B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 1C: No File mah dude!")
		  postOutcome.message = "Error 1C: No File mah dude!"
 
		} 
	}

	//STEP 2: Add Post to Database
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file

		//File Information
		var uploadFile = {}
		uploadFile.fileMimetype = file.mimetype; 
		uploadFile.originalname = file.originalname; //file_name
		uploadFile.fileNameServer = file.filename; //file_name_server

		//Settings: Local 
		uploadFile.fileURL = file.path; //file_url
		uploadFile.cloudKey = "local_cloud_key"; //cloud_key
		uploadFile.bucket = "local_bucket"; //cloud_bucket	
		uploadFile.storageType = "local"; //storage_type
		
		//Settings: Cloud
		//uploadFile.fileURL = result.Location; // file_url
		//uploadFile.cloudKey = result.Key; //cloud_key 
		//uploadFile.bucket = result.Bucket; // cloud_bucket 	
		//uploadFile.storageType = "aws"; //storage_type		

		let newPostOutcome = await Post.createPostPhoto(req, uploadFile);
		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true

		//STEP 3: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 3: Add notifications")

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

				console.log(notification)

				if(groupUsers.length > 0) {
					Notification.createGroupNotification(notification);
				}
			}
		}
	}

    res.json(postOutcome)

  })
}

async function postPhotoLocalAWS(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {

		var uploadSuccess = false
		var groupID = req.body.groupID;
	
		var postOutcome = {
			data: {},
			message: "hi", 
			success: true,
			statusCode: 200,
			errors: [], 
			currentUser: req.body.currentUser
		}

		//STEP 1: Check for a valid file
		console.log("STEP 1: Upload Post to API")

		//Error 1A: File too large
		if (err instanceof multer.MulterError) {
			console.log("Error 1A: File too large")
			postOutcome.message = "Error 1A: File too large"
	  
		//Error 1B: Not Valid Image File
		} else if (err) {
			console.log("Error 1B: Not Valid Image File")
			postOutcome.message = "Error 1B: Not Valid Image File"
	
		//Success 1A: No Multer Errors
		} else {
			let file = req.file
			console.log("Success 1A: No Multer Errors")
	
			//Success 1B: Success Upload File
			if(file !== undefined) {
				console.log("Success 1B: Success Upload File")
				uploadSuccess = true   
	
			//Error 1C: No File 	
			} else {
			  console.log("Error 1C: No File mah dude!")
			  postOutcome.message = "Error 1C: No File mah dude!"
	 
			} 
		}
	

		//STEP 2: Upload to AWS
		if(uploadSuccess == true) {
			console.log("STEP 2: Add Post to Database")
			let file = req.file
			console.log(file)
			
			const fileExtension = mime.extension(file.mimetype) 
			const result = await awsStorage.uploadFile(file)

			console.log(result)

			//File Information
			var uploadFile = {}
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
			
		}
		
		console.log(" ")
		console.log("________________________________")
	
		res.json(postOutcome)
	
	  })
}

//Function A3: Post Video
async function postVideo(req, res) {
	const groupID = req.body.groupID;

	var postOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 1: Create the New Post 
	console.log("STEP 1: Make a new post")	
	var newPostOutcome = await Post.createPostVideo(req);

	if(newPostOutcome.outcome == 200) {
		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "You posted a Video!"
		postOutcome.statusCode = 200
		postOutcome.success = true
		var postID = 0
		if (newPostOutcome.newPost.postID) {
			postID = newPostOutcome.newPost.postID
		}

		//STEP 2: Add the Notification
		var notification = {}
		const groupUsersOutcome = await Group.getGroupUsers(groupID);
		const groupUsers = groupUsersOutcome.groupUsers;

		//Create Notification 
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

		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}

	}

	res.json(postOutcome);
}

//Function A4: Post Article
async function postArticle(req, res) {
	res.json({postArticle: "Still need!"}); 
}
 
//FUNCTIONS B: All Functions Related to getting Posts
//Function B1: Get all Group Posts
//http://localhost:3003/posts/group/70
async function getAllGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	//const currentUser = req.currentUser
	const currentUser = "daveyChangeBack"
	console.log("Get all Group Posts for Group: " + groupID)

	//STEP 1: Get All Posts
	var postsOutcome = await Post.getGroupPostsAll(groupID)
	var postsRaw = postsOutcome.posts;

	//STEP 2: Get All Comments for these Posts 
	var postsComments = await PostFunctions.addPostComments(currentUser, postsRaw)

	//STEP 3: Get all Likes for these Posts
	var postsLikes = await PostFunctions.addPostLikes(currentUser, postsComments)
	
	//STEP 4: Get Image URL
	var posts = await PostFunctions.addSignedURL(postsLikes);

	//let signedURL = await cloudFunctions.getSignedURL("images/postImage-1716851490721-546172183-59045070_p0.jpg")

	var postsResponse = {
		data: posts,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	console.log("TOTAL POSTS " + posts.length)

	console.log("Getting posts!")
	console.log("At " + timeFunctions.getCurrentTime().postTime);

	//TEMP
	let fileURLTemp = "https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/images/postImage-1717890765111-678334753-stars.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEFcaCXVzLXdlc3QtMiJHMEUCIC8HUgTQ2Ssb8RGS3O57YFutpd9v7lC63k7Yhq%2FMuryDAiEA%2Fi%2BBCVmRDuS3Ltfw7dMOD9zDb05ChK4BjX4NWTzJQFsq5AIIUBAAGgw1MzQ3NTMzNjk4NTAiDCqvRC5UNDg2ahZ8rirBAjkhgJgMntqqBuzmqhvw3RojjNNHSqNmOUfPXLibLJEZcCCfSSx95z7LNABZlDO4AWcxARNodR3E6s%2FcDqfHkr8k0iSQBmXlOrWD%2B5fwhqjHmlekyOJheWnrp5B3mqrEDhsBZotYvZ8jtb1JHxFpqEJjzD9c9CHouQ%2BG7BCoLqO2hZLEfjWq747ohiqcrn697R9QeHBMheSaYj%2FVaaIxUnIZja%2BpqjmHPZvfHhepUn%2FlXu5SAZZWo3vJd8FbrmPGMJYsMter6Jwhmqod5lNswjLSCHiEj1UIWfsfdjpGBlw6zHI09zBvMJ1rXCR%2BFOijT9sw84VdJ%2BY5agyy9oxsu5KowHGe8u5KyDPHUa8cQf4y59FYqZxOPZYLF1YUHC2mCF%2BpAVicHozmXxbDsnxsqtgOasly3tzYoS19iJ5IbpS6AzCXtdq1BjqzAhkynjJ31te62LVNd%2FfnEPJ54KU6wpJ159ek87jAePDihQyQrPGsV0BVnz9Coi%2BO%2BLA3dfxo3vwdAaKdJ%2F78fJjFecUsT0R%2FVHwndDVBXTV5o4lEQ6ZF3NdLsuHAYt6utn1iYpdd82DB6RNsxq0fdwGnzEGrIYsx32XfTCQuYMkBALx6efSpf%2BOslEur1sPSWLrKfLZ83tDHIXAzMVgpRuJkR6tHieDwezEosgEKyds0MLcAE4Sg9u8RF2waYaOrMmT1YfISRpgramOZxd0R34K3RuW9R0it%2FNPaU446%2F3dDAFM0AyDWhWrBBzRPbf7xS8fBcJP7kPTUYymWOigeNmgB9J94Q9LK9DmiOBpqJWkjIJynpzXY7dTMWSVG7I1lDIS9if0X5CodWHHCGPNq3jwEKUw%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240809T223945Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAXZAOI335MLE7NZO7%2F20240809%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=4e53abd0097e46b626ebbeb6733f0569eed4231e3a549e7e6eeb216e4ce19610"

	for (let i = 0; i < postsResponse.data.length; i++) {
		postsResponse.data[i].fileURL = fileURLTemp
	}
	//TEMP

	res.json(postsResponse)

}

//Route B2: Get Group Posts Pagination
//http://localhost:3003/posts/group/72/page/1/
async function getGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentPage = req.params.page;
	const currentUser = req.authorizationData.currentUser;
	
	//STEP 1: Get All Posts
	var postsCountOutcome = await PostFunctions.getGroupPostCount(groupID)
	console.log(postsCountOutcome)
	var postsOutcome = await Post.getGroupPosts(groupID, currentPage, postsCountOutcome.groupPostCount)
	var postsRaw = postsOutcome.posts;

	//STEP 2: Get All Comments for these Posts 
	var postsComments = await PostFunctions.addPostComments(currentUser, postsRaw)

	//STEP 3: Get all Likes for these Posts
	var posts = await PostFunctions.addPostLikes(currentUser, postsComments)

	//STEP 4: Get Count of All Posts
	var groupPostCountOutcome = await PostFunctions.getGroupPostCount(groupID) 

	var postData = {
		posts: posts,
		postCount: groupPostCountOutcome.groupPostCount,
		currentPage: parseInt(currentPage),
		nextPage: parseInt(currentPage) + 1,
		previousPage: parseInt(currentPage) - 1
	}

	var postsResponse = {
		data: postData,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	res.json(postsResponse)

}

//Function B2: Get all User Posts 
async function getAllUserPosts(req, res) {
    const userName = req.params.user_name;
	const currentPage = req.params.page;

	//Get All Posts
	var postsOutcome = await PostFunctions.getUserPosts(userName, currentPage)
	var posts = postsOutcome.posts;

	for (let i = 0; i < posts.length; i++) {
		let simpleLikesArray = []
		var currentPostLikes = await PostFunctions.getPostLikes(posts[i].postID) 
		posts[i].postLikesArray = currentPostLikes.postLikes;
		//console.log(currentPostLikes);

		//Create an Array of just post user names
		posts[i].postLikesArray.map((postLike) => (
			simpleLikesArray.push(postLike.likedByUserName)
		))

		posts[i].simpleLikesArray = simpleLikesArray;

	}
	console.log(postsOutcome);

	res.json(posts)

}

//Function B3: Get Single Post by ID 
async function getSinglePost(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;
	const currentUser = req.currentUser

	//STEP 1: Get All Posts
	//Move to Class
	var postsOutcome = await Post.getSingleGroupPost(postID)
	var postsRaw = postsOutcome.posts;
	console.log(postsRaw)

	//STEP 2: Get All Comments for these Posts 
	var postsComments = await PostFunctions.addPostComments(currentUser, postsRaw)

	//STEP 3: Get all Likes for these Posts
	var posts = await PostFunctions.addPostLikes(currentUser, postsComments)

	var postsResponse = {
		data: posts,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	res.json(postsResponse)

}

//Function B4: Get All Posts
async function getAllPosts(req, res) {
	const connection = db.getConnection(); 

	//Get All Posts
	var postsOutcome = await PostFunctions.getAllPosts()
	var posts = postsOutcome.posts;
 
	for (let i = 0; i < posts.length; i++) {
		var currentPostLikes = await Functions.getPostLikes(posts[i].postID) 
		posts[i].postLikes = currentPostLikes.postLikes;
	}

	res.json(posts)

}

//FUNCTIONS C: All Functions Related to Post Actions
//Function C1: Like a Post
async function likePost(req, res) {
	const connection = db.getConnection(); 
	var currentUser = req.body.currentUser
	var postID = req.body.postID

	var likePostResponse = {
		data: {},
		message: "", 
		success: false,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	//STEP 1: Check if Post was Liked 
	var postLikeStatus = await likeFunctions.checkPostLikeStatus(currentUser, postID);

	//STEP 2: If post was not already liked then Like the Post
	if(postLikeStatus.currentLikeCount < 1) {
		var currentUserIDOutcome = await userFunctions.getUserID(currentUser);
		var postLikedStatus = await likeFunctions.likePost(postID, currentUser, currentUserIDOutcome.userID) 
		
		//STEP 3: Get new Post Like Information 
		var postLikeID = postLikedStatus.postLikeID
		var likedPostUserInfoStatus = await likeFunctions.getLikedPostUserInformation(postLikeID) 

		var likedPost = {}
		
		//STEP 4: Create the new Like to send back 
		if(likedPostUserInfoStatus.newLike[0] != null || likedPostUserInfoStatus.newLike[0].length != 0){
			likedPost = likedPostUserInfoStatus.newLike[0];
			var postFromOutcome = await PostFunctions.getPostFrom(postID)
			console.log(currentUser + " " + postFromOutcome.postFrom)
			var likedPostUserInfoStatus = await friendFunctions.checkFriendshipStatus(currentUser, postFromOutcome.postFrom) 
			likedPost.friendshipStatus = likedPostUserInfoStatus.friendshipStatus;
		}
		
		likePostResponse.message = "You liked this post!";
		likePostResponse.success = true;
		likePostResponse.data = likedPost;

	//You already liked the post
	} else {
		likedPost = {
			postLikeID: 0,
			postID: 0,
			likedByUserName: "",
			likedByImage: "",
			likedByFirstName: "",
			likedByLastName: "",
			timestamp: "",
			friendshipStatus: ""
		}
		likePostResponse.data = likedPost;
		likePostResponse.message = "You already liked this post!"
	}

	console.log("Post ID is " + postID + " Type: " + typeof(postID));
	console.log("You liked a post! at " + timeFunctions.getCurrentTime().postTime);
	console.log(likePostResponse)
	res.json(likePostResponse)
		
}

//Function C2: Unlike a Post 
async function unlikePost(req, res) {
	var currentUser = req.body.currentUser
	var postID = req.body.postID

	var unlikePostResponse = {
		data: {},
		message: "", 
		success: false,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	var likedPost = {
		postLikeID: 0,
		postID: postID,
		likedByUserName: "",
		likedByImage: "",
		likedByFirstName: "",
		likedByLastName: "",
		timestamp: "",
		friendshipStatus: ""
	}

	//STEP 1: Check if Post was Liked 
	var currentLikeStatus = await likeFunctions.checkPostLikeStatus(currentUser, postID);

	//STEP 2: Unlike Post if it is Liked
	if(currentLikeStatus.currentLikeCount > 0) {

		//STEP 3: Get Post Like ID
		var postLikeIDStatus = await likeFunctions.getPostLikeID(postID, currentUser)
		console.log("postLikeIDStatus");
		console.log(postLikeIDStatus);

		var unlikePostStatus = await likeFunctions.unlikePost(postID, currentUser)
		console.log("unlikePostStatus")
		console.log(unlikePostStatus)

		unlikePostResponse.message = "The Post Like was removed"
		unlikePostResponse.success = true 
		likedPost.postLikeID = postLikeIDStatus.postLikeID
		unlikePostResponse.data = likedPost

	} else {
		unlikePostResponse.data = likedPost
		unlikePostResponse.message = "The post is not currently liked by " + currentUser;
	}
	
	console.log("You unliked a post!")
	console.log(unlikePostResponse)
	res.json(unlikePostResponse)
}

//Function C3: Select all Likes
async function getAllLikes(req, res) {
	const connection = db.getConnection(); 
	const queryString = "SELECT * FROM post_likes ORDER BY post_id DESC LIMIT 20";
 
	connection.query(queryString, (err, rows, fields) => {
		 if (!err) {
 
			 //Return Object 
			 const likes = rows.map((row) => {
				 return {
					 postLikeID: row.post_like_id,
					 postID: row.post_id,
					 likedBy: row.liked_by,
					 likedByName: row.liked_by_name,
					 timestamp: row.timestamp
				 }
			 });
			 
			 res.json({likes:likes});
 
		 } else {
			 console.log("Failed to Select Posts" + err)
			 res.sendStatus(500)
			 return
		 }
	})
}

//Function C4: Select all Likes for a Post
async function getPostLikes(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;
    const queryString = "SELECT * FROM post_likes WHERE post_id = ?";

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			const postLikes = rows.map((row) => {
				return {
					postLikeID: row.post_like_id,
					postID: row.post_id,
					likedBy: row.liked_by,
					likedByName: row.liked_by_name,
					timestamp: row.timestamp
				}
			});
			res.json(postLikes);

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
}

//Function C5: Delete a Post
async function deletePost(req, res) {
	const connection = db.getConnection(); 
	const postID = req.body.postID;
	const currentUser = req.body.currentUser;

	var deletePostOutcome = {
		data: [],
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

    const queryString = "UPDATE posts SET post_status = 0 WHERE post_id = ?;";

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			var response = {
				postID: postID,
				currentUser: currentUser,
			}
			deletePostOutcome.data.push(response)
			deletePostOutcome.message = true;
			deletePostOutcome.success = "Sucesfully deleted post " + postID;

			res.json(deletePostOutcome);

        } else {
            console.log("Failed to Delete Posts" + err)
			deletePostOutcome.statusCode = 500
			deletePostOutcome.message = "Could not delete post " + postID;
			deletePostOutcome.errors.push(err);
			
			res.status(500).json(deletePostOutcome)
            return
		}
    })
	
}

//Function C6:  Edit a Post
async function editPost(req, res) {
	const currentUser = req.body.currentUser;
	const postID = req.body.postID;
	const newPostCaption = req.body.newPostCaption;

	console.log(req.body)

	var editPostOutcome = {
		data: [],
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	//STEP 1: Check if Post Exists
	const postExistsOutcome = await PostFunctions.checkPostExists(postID)

	//STEP 2: Update Caption
	if(postExistsOutcome.postExists == true) {
		const updatePostOutcome = await Post.updatePostCaption(postID, newPostCaption, currentUser);
		editPostOutcome.data.push({postID: postID, newPostCaption: newPostCaption})
		editPostOutcome.success = true;
	} else {
		console.log("else")
	}

	res.json(editPostOutcome)

}


module.exports = { postText, postPhoto, postPhotoLocal, postPhotoLocalAWS, postVideo, postArticle, getGroupPosts, getAllGroupPosts, getAllUserPosts, getSinglePost, getAllPosts, likePost, unlikePost, getAllLikes, getPostLikes, deletePost, editPost  };


/*
const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
var cors = require('cors')
const morgan = require('morgan')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile, getFileStream } = require('./s3')
var mime = require('mime-types')

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.json());
app.use(cors())
app.use(cookieParser())
//app.use(morgan('short'));

app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
  console.log("Hello!");
  res.json({hi: "hiya!"})
})

app.post("/images", (req, res) => {
  console.log("Hello! got your image!");
  console.log(req.body)
  res.json({hello: "hello!"})
})


//UPLOAD Local
app.post("/sam/images/local", upload.single('image'), (req, res) => {
  let description = req.body.description
  let file = req.file

  console.log(file)
  res.json({hello: "Hello! got your image!", description: description, file: file})
})

//UPLOAD AWS
app.post('/sam/images', upload.single('image'), async (req, res) => {
  const file = req.file
  const description = req.body.description

  //add error handling
  const result = await uploadFile(file)
  const fullKey = "/images/" + result.key;

  let fileExtension = mime.extension(file.mimetype) 

  console.log("result")
  console.log(result)
  console.log("file")
  console.log(file)

  res.send({yay: "yay!", result: result, imagePath: fullKey, file: file, description: description, fileExtension: fileExtension})

})

//images/4e0e3dcad36549f198eb751de1c03679
//GET IMAGE
app.get('/sam/images/:key', (req, res) => {
  console.log(req.params)
  const key = req.params.key

  const fullKey = "images/" + key;
  console.log("You got the image with full key")
  console.log(fullKey)
  const readStream = getFileStream(fullKey)

  readStream.pipe(res)
  //res.json({hi:key})
})

*/


			/*
			AWS
				result
				{
					ETag: '"6e30f517fa86d50c8abd8e5579866be1"',
					ServerSideEncryption: 'AES256',
					Location: 'https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/images/postImage-1714952919699-277959186-stars.jpg',
					key: 'images/postImage-1714952919699-277959186-stars.jpg',
					Key: 'images/postImage-1714952919699-277959186-stars.jpg',
					Bucket: 'insta-app-bucket-tutorial'
				}
				file
				{
					fieldname: 'postImage',
					originalname: 'stars.jpg',
					encoding: '7bit',
					mimetype: 'image/jpeg',
					destination: './uploads',
					filename: 'postImage-1714952919699-277959186-stars.jpg',
					path: 'uploads/postImage-1714952919699-277959186-stars.jpg',
					size: 3039415
				}
				fullKey
				/images/images/postImage-1714952919699-277959186-stars.jpg
				fileExtension
				jpeg
			AWS

			newFile = {
				type: "local | aws",
				file: file,
				result: result
			}
			*/





			//AWS
			/*
			result
{
  ETag: '"6e30f517fa86d50c8abd8e5579866be1"',
  ServerSideEncryption: 'AES256',
  Location: 'https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/images/postImage-1715552334522-432267929-stars.jpg',
  key: 'images/postImage-1715552334522-432267929-stars.jpg',
  Key: 'images/postImage-1715552334522-432267929-stars.jpg',
  Bucket: 'insta-app-bucket-tutorial'
}
file
{
  fieldname: 'postImage',
  originalname: 'stars.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: './uploads',
  filename: 'postImage-1715552334522-432267929-stars.jpg',
  path: 'uploads/postImage-1715552334522-432267929-stars.jpg',
  size: 3039415
}
fullKey
/images/images/postImage-1715552334522-432267929-stars.jpg
fileExtension
jpeg
AWS
You created a new Post with ID 592
CLASS GROUP 70
STEP 3: Add notifications
{
  masterSite: 'kite',
  notificationFrom: 'davey',
  notificationMessage: 'Posted a Photo',
  notificationTo: [ 'sam', 'davey', 'frodo' ],
  notificationLink: 'http://localhost:3003/posts/group/77',
  notificationType: 'new_post_photo',
  groupID: '70',
  postID: 592
}
			*/

			/*
			newFile = {
				type: "local | aws",
				file: file,
				result: result
			}
			*/
