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
	const masterSite = req.body.postType;
	const postType = req.body.postType;
	const postFrom = req.body.postFrom;
	const postTo = req.body.postTo;
	const groupID = req.body.groupID;
	const listID = req.body.listID;
	const postCaption = req.body.postCaption;
	const videoURL = req.body.videoURL;
	const videoCode = req.body.videoCode;
	const notificationMessage = req.body.notificationMessage;
	const notificationType = req.body.notificationType;
	const notificationLink = req.body.notificationLink;

	var headerMessage = "NEW POST: Post Text"
	Functions.addHeader(headerMessage)
	
	var postOutcome = {
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

		/*

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
					Notification.createSingleNotification(notification)
				} 
		
				
			}
			*/
		
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

//Function A2: Post Photo Local 
async function postPhotoLocal(req, res) {
	var headerMessage = "HEADER: New Photo Post "
	Functions.addHeader(headerMessage)
	uploadFunctions.uploadLocal(req, res, async function (err) {

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

	//STEP 2: Upload Post to API
	console.log("STEP 2: Upload Post to API")
	//Error 2A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 2A: File too large")
		postOutcome.message = "Error 2A: File too large"
  
	//Error 2B: Not Valid Image File
	} else if (err) {
		console.log("Error 2B: Not Valid Image File")
		postOutcome.message = "Error 2B: Not Valid Image File"

	//Success 2A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 2A: No Multer Errors")

		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 2B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 2C: No File mah dude!")
		  postOutcome.message = "Error 2C: No File mah dude!"
 
		} 
	}

	//STEP 2: Add Post to Database
	if(uploadSuccess == true) {
		console.log("STEP 3: Add Post to Database")
		let file = req.file
		//let imageURL = "http://localhost:3003/" + bucketName + "/" + file.filename

		//File Information
		var uploadFile = {}
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
					Notification.createSingleNotification(notification)
				} 
				
				//WORKS
				/*
				if(groupUsers.length > 0) {
					Notification.createGroupNotification(notification);
				}
				*/
			}
		}
	}

	Functions.addFooter()
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
			currentUser: req.body.postFrom
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
			const result = await awsStorage.uploadPost(file)

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
	const currentUser = req.currentUser
	
	var headerMessage = "HEADER: Get all Group Posts for Group: " + groupID
	Functions.addHeader(headerMessage)
	

	//STEP 1: Get All Posts
	var postsOutcome = await Post.getGroupPostsAll(groupID)
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

//Route B2: Get Group Posts Pagination
//http://localhost:3003/posts/group/72/page/1/
async function getGroupPosts(req, res) {
	console.log("getGroupPosts")
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentPage = req.params.page;
	const currentUser = req.authorizationData.currentUser;
	
	//STEP 1: Get All Posts
	var postsCountOutcome = await PostFunctions.getGroupPostCount(groupID)
	//console.log(postsCountOutcome)
	var postsOutcome = await Post.getGroupPosts(groupID, currentPage, postsCountOutcome.groupPostCount)
	//console.log(postsOutcome)
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
//TEMP
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
//TEMP
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

	var likedPost = {}

	var headerMessage = "HEADER: Post Like: " + postID
	Functions.addHeader(headerMessage)

	//STEP 1: Check User Exists
	var userExists = await profileFunctions.getSimpleUserProfile(currentUser);

	if(userExists.userFound == true) {

		//STEP 1: Check if Post was Liked 
		var postLikeStatus = await likeFunctions.checkPostLikeStatus(currentUser, postID);

		//STEP 2: If post was not already liked then Like the Post
		if(postLikeStatus.currentLikeCount < 1) {
			var currentUserIDOutcome = await userFunctions.getUserID(currentUser);
			var postLikedStatus = await likeFunctions.likePost(postID, currentUser, currentUserIDOutcome.userID) 
			
			//STEP 3: Get new Post Like Information 
			var postLikeID = postLikedStatus.postLikeID
			var likedPostUserInfoStatus = await likeFunctions.getLikedPostUserInformation(postLikeID) 
			
			//STEP 4: Create the new Like to send back 
			if(likedPostUserInfoStatus.newLike[0] != null || likedPostUserInfoStatus.newLike[0].length != 0){
				
				//Set Liked Post
				likedPost = likedPostUserInfoStatus.newLike[0];

				var postFromOutcome = await PostFunctions.getPostFrom(postID)
				//console.log(currentUser + " " + postFromOutcome.postFrom)
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
				friendshipStatus: 0
			}
			likePostResponse.data = likedPost;
			likePostResponse.message = "You already liked this post!"
		}

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
		likePostResponse.message = "USER NOT FOUND: " + currentUser
		console.log("USER NOT FOUND: " + currentUser)
	}

	console.log("You liked a post! at " + timeFunctions.getCurrentTime().postTime);
	console.log("TEMP DELAY")
	console.log(likePostResponse)
	Functions.addFooter()

	await delay(2000);
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
		friendshipStatus: 0
	}

	var headerMessage = "HEADER: You unliked the post: " + postID
	Functions.addHeader(headerMessage)

	//STEP 1: Check if Post was Liked 
	var currentLikeStatus = await likeFunctions.checkPostLikeStatus(currentUser, postID);

	//STEP 2: Unlike Post if it is Liked
	if(currentLikeStatus.currentLikeCount > 0) {

		//STEP 3: Get Post Like ID
		var postLikeIDStatus = await likeFunctions.getPostLikeID(postID, currentUser)
		//console.log("postLikeIDStatus");
		//console.log(postLikeIDStatus);

		var unlikePostStatus = await likeFunctions.unlikePost(postID, currentUser)
		//console.log("unlikePostStatus")
		//console.log(unlikePostStatus)

		unlikePostResponse.message = "The Post Like was removed"
		unlikePostResponse.success = true 
		likedPost.postLikeID = postLikeIDStatus.postLikeID
		unlikePostResponse.data = likedPost

	} else {
		unlikePostResponse.data = likedPost
		unlikePostResponse.message = "The post is not currently liked by " + currentUser;
	}
	
	console.log("You unliked a post! at " + timeFunctions.getCurrentTime().postTime);
	console.log(unlikePostResponse)
	Functions.addFooter()

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


module.exports = { postText, postPhotoLocal, postPhotoLocalAWS, postVideo, postArticle, getGroupPosts, getAllGroupPosts, getAllUserPosts, getSinglePost, getAllPosts, likePost, unlikePost, getAllLikes, getPostLikes, deletePost, editPost  };



	//TEMP
	//let fileURLTemp = "http://localhost:3003/images/background_2.png"
	//let fileURLTemp = "https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/images/postImage-1723416523001-467663100-lake.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEE8aCXVzLXdlc3QtMiJIMEYCIQCuleLUVoYuQxX0LDzWKkd5nfGj8WRrzH8GGpsGRQEaggIhAIbeeyX9HopcvA2n8yzLLAxPAK0FpYI8nAYnX52tfhuCKuQCCGgQABoMNTM0NzUzMzY5ODUwIgzzrOU51U9oRAZ7g0IqwQJj2zZjZYmZ8RSN2gi9AMQkiKZs5gRasy6sGBLtql5Hgg7OC1EwfqzVAk1Y87E73tBtA1FvlggWlp3Sj2pa8vYN6QWm0iDIzSg6aCLZzi37mq7ef%2FFthgIAvj2kK0Rvp4s%2BP%2F10WsYMQ1JgctGgDVx9g3hwFx%2Fm%2Fs91AmamOgs6qPmtVF00pFIucWt2JwBx5mI6Rjnrl9ZHi7C%2Bxqkqguw94nshVMzvg0OavoCYjIrJnktvxTtDxawrOiBucy02A4Fli9gGstRun%2BEgV7U9lpg53qmyetoddR%2BPjBsb9nbpX4p9FD9gGJz4JBeE7sLDOy12SkeNaRI6u8yeOGm91GpJQRNYG6DV75gD6hZ7o%2BRbToqLbcdbNTPM6J8l2sJOQIpGmjDJ2m%2Bmi5sk8wELt3Up72CFTEZbGaneEee3p7QyGc4wpqHJtgY6sgJuv%2FBozg3R1F2ZR%2BO7YYyb4pTUPLLFm3WwSASWBGPw64HgAqHQOVxAcbdjAHnF9JJ4mcpUuzpmdySt9Cfh1HDfFPKUPcNH0XZ2ttDBX1OfZXg0OyOF%2BWQhN7pRO2z%2FH715sa%2BD5YNVSwzn%2BdCpSxdMIDqIf9WqXDBENLDf6P3j7kHDSmE2rJFUChRUazxj0v5FDZ9DH0HNXpH3anw93%2FQvhUZsrc3MavRLYbABjRbeU7TK5zrGgNF%2BjMi1Ksfhq5sE08jJScjNVL4%2FGPKrCSPxoATNUSa6TTh35Ew%2F9RkIXaXwvSm7xWQDnTFDcrEQ7hrMLUBKvuEVkO%2BIjS8wdIlPoM%2Bt33xxAol7MA1rj3Kus9FJCb83kwoTfvSAneH2sWjgquvpoVOvKZz8%2FOeJEUleC7Q%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240830T231229Z&X-Amz-SignedHeaders=host&X-Amz-Expires=14400&X-Amz-Credential=ASIAXZAOI335AW5B2P6Y%2F20240830%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=08b38fba14fbc43bb0bbe8140495aee4124f6f391196b59f7e222a223af6a215"
	//for (let i = 0; i < postsResponse.data.length; i++) {
	//	postsResponse.data[i].fileURL = fileURLTemp
	//}
	//TEMP

	
/*

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
			currentUser: req.body.postFrom
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
		uploadFile.cloudKey = "no_cloud_key"; //cloud_key
		uploadFile.bucket = "local_bucket"; //cloud_bucket	
		uploadFile.storageType = "local"; //storage_type
		
		//Settings: Cloud
		//uploadFile.fileURL = result.Location; // file_url
		//uploadFile.cloudKey = result.Key; //cloud_key 
		//uploadFile.bucket = result.Bucket; // cloud_bucket 	
		//uploadFile.storageType = "aws"; //storage_type		

		let newPostOutcome = await Post.createPostPhoto(req, uploadFile);
		
		//ADD BACK
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
*/

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


/*
#LOCATION
#App Location
APP_LOCATION = "local"
#APP_LOCATION = "aws"

#Storage Location
FILE_LOCATION = "local"
#FILE_LOCATION = "aws"
*/
//WORKING ORIGINAL
/*
async function postPhotoOld(req, res) {
	uploadFunctions.uploadLocal(req, res, async function (err) {

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

*/
