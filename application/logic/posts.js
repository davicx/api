const db = require('../functions/conn');
const Group = require('../functions/classes/Group');
const Post = require('../functions/classes/Post');
const Notification = require('../functions/classes/Notification')
const Comment = require('../functions/classes/Comment')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const friendFunctions = require('../functions/friendFunctions');
const PostFunctions = require('../functions/postFunctions');
const timeFunctions = require('../functions/timeFunctions');
const uploadFunctions = require('../functions/uploadFunctions');

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')

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
	//const connection = db.getConnection(); 
	console.log("____________________________")
	console.log("NEW POST: Post Text")
	const groupID = req.body.groupID;
	var postOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.postFrom
	}

	//STEP 1: Make a new post
	var newPostOutcome = await Post.createPostText(req);
	console.log("STEP 1: New Post Outcome")
	console.log(newPostOutcome)
	
	if(newPostOutcome.outcome == 200) {

		//STEP 2: Add the Notifications
		var notification = {}
		const groupUsersOutcome = await Group.getGroupUsers(groupID);
		const groupUsers = groupUsersOutcome.groupUsers;
		console.log("STEP 2: Add notifications")
		
		if(newPostOutcome.outcome == 200) {
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
		
		//STEP 3: New Post Outcome 
		//MOVE TO POST CLASS!!!
		let fileName = "empty"
		let fileNameServer = "empty"
		let fileUrl = "empty"

		if(req.body.fileNameServer != undefined) {
			fileNameServer = req.body.fileNameServer;
		} 

		if(req.body.fileName != undefined) {
			fileName = req.body.fileName;
		} 

		if(req.body.fileUrl != undefined) {
			fileUrl = req.body.fileUrl;
		} 

		const newPost = {
			postID: newPostOutcome.postID,
			postType: "text",
			groupID: groupID,
			listID: 0,
			postFrom: req.body.postFrom,
			postTo: req.body.postTo,
			postCaption: req.body.postCaption,
			fileName: fileName,
			fileNameServer: fileNameServer,
			fileUrl: fileUrl,
			commentsArray: [],
			postLikesArray: [],
			simpleLikesArray: [],
			postDate: timeFunctions.getCurrentTime().postDate,
			postTime: timeFunctions.getCurrentTime().postTime,
			timeMessage: timeFunctions.getCurrentTime().timeMessage,
			videoURL: req.body.videoURL,
			videoCode: req.body.videoCode,
			created: "2021-12-19T08:14:03.000Z"
		}

		postOutcome.message = "A new post was created with the id " + newPostOutcome.postID;
		postOutcome.data = newPost;

		console.log("STEP 3: New Post Outcome")
		console.log(postOutcome)
		console.log("YOU MADE A NEW POST!")
	} else {
		console.log("STEP 3: Something went wrong making this post!")
	} 

	res.json(postOutcome);
	console.log("____________________________")
}

//Function A2: Post Photo
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

//Post Photo
async function postPhoto(req, res) {

}


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

//SORT BELOW
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




//Function A3: Post Video
async function postVideo(req, res) {
	const groupID = req.body.groupID;

	var postVideoOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 1: Create the New Post 
	const postOutcome = await Post.createPostVideo(req);

	if(postOutcome.outcome == 200) {

		//STEP 2: Get new Post Data
		var postCreated = await PostFunctions.getPostCreated(postOutcome.postID) 

		var newPost = {
			postID: postOutcome.postID,
			postType: req.body.postType ,
			groupID: req.body.groupID,
			listID: req.body.listID,
			postFrom: req.body.postFrom,
			postTo: req.body.postTo ,
			postCaption: req.body.postCaption,
			postLikesArray: [],
			simpleLikesArray: [],
			videoURL: req.body.videoURL,
			videoCode: req.body.videoCode ,
			created: postCreated.created
		}

		postVideoOutcome.data = newPost;
		postVideoOutcome.message = "You made a new video post!"

		//STEP 3: Add the Notification
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
			groupID: groupID
		}

		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}

	}

	
	res.json(postVideoOutcome);
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

	console.log("CURRENT USER: This is from the middleware " + currentUser)

	//STEP 1: Get All Posts
	var postsOutcome = await PostFunctions.getGroupPostsAll(groupID)
	var posts = postsOutcome.posts;

	//STEP 2: Get All Comments for these Posts 
	//Step 2A: Get All Comments for these Posts 
	for (let i = 0; i < posts.length; i++) {
		let postID = posts[i].postID	
		console.log("Get Comments for " + postID)

		var commentsOutcome = await Comment.getPostComments(postID)

		//Step 2B: Get all the likes for these comments
		if(commentsOutcome.success == true) {
			var comments = commentsOutcome.comments;

			for (let i = 0; i < comments.length; i++) {
				let currentCommentLikes = await Comment.getCommentLikes(comments[i].commentID);
				comments[i].commentLikes = currentCommentLikes.commentLikes;
				comments[i].commentLikeCount = currentCommentLikes.commentLikes.length
			}
		} 

		posts[i].commentsArray = comments;
	}
	

	//STEP 3: Get all Likes for these Posts 
	//getPostLikes()
	for (let i = 0; i < posts.length; i++) {
		let simpleLikesArray = []
		var currentPostLikes = await PostFunctions.getPostLikes(posts[i].postID) 
		posts[i].postLikesArray = currentPostLikes.postLikes;

		//Create an Array of just post user names
		posts[i].postLikesArray.map((postLike) => (
			simpleLikesArray.push(postLike.likedByUserName)
		))

		posts[i].simpleLikesArray = simpleLikesArray;

	}
	var postResponse = {
		posts: posts,
		postCount: "get me 10 and add both "
	}

	var postsResponse = {
		data: postResponse,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	res.json(postsResponse)

}

//Route B2: Get Group Posts Pagination
//http://localhost:3003/posts/group/72/page/1/
async function getGroupPosts(req, res) {
	//THE ABOVE HAS COMMENTS TOO!!
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentPage = req.params.page;
	const currentUser = req.authorizationData.currentUser;
	
	//STEP 1: Get All Posts
	var postsOutcome = await PostFunctions.getGroupPosts(groupID, currentPage)
	var posts = postsOutcome.posts;

	//STEP 2: Add Post Likes 
	for (let i = 0; i < posts.length; i++) {
		let simpleLikesArray = []
		var currentPostLikes = await PostFunctions.getPostLikes(posts[i].postID) 
		
		posts[i].postLikesArray = currentPostLikes.postLikes;

		//ADD FRIENDSHIP STATUS TO A USER LIKE Pass into SOMETHING LIKE THIS
		//Step 2A: Get your friends 
		var yourFriendsOutcome = await friendFunctions.getAllUserFriends(currentUser)
		var yourFriendsArray = yourFriendsOutcome.friendsArray;
		console.log(currentPostLikes)
		console.log(yourFriendsArray)
		/*
		async function compareUsersWithYourFriends(currentUser, yourFriendsArray, theirFriendsArray) {
			//TYPE 1: You are Currently Friends - "friends"
			//TYPE 2: Friendship Invite Pending (you) - "invite_pending"
			//TYPE 3: Friendship Request Pending (them) - "request_pending"
			//TYPE 4: Not Friends - "not_friends"
			//TYPE 5: This is you - "you"

			var currentUser = currentUser.toLowerCase();

			//STEP 1: Create a Set of your friends
			var yourFriendsSet = new Set();

			for (let i = 0; i < yourFriendsArray.length ; i++) {
				//console.log(yourFriendsArray[i].userName)
				yourFriendsSet.add(yourFriendsArray[i].friendName.toLowerCase())
			}	

			//STEP 2: Check this set for friend Matches
			for (let i = 0; i < theirFriendsArray.length ; i++) {
				let tempUser = theirFriendsArray[i].friendName.toLowerCase();

				//This will find friend overlap
				if(yourFriendsSet.has(tempUser) || currentUser.localeCompare(tempUser) == 0) { 
					theirFriendsArray[i].alsoYourFriend = 1;
					//theirFriendsArray[i].friendshipKey = "friends";
					console.log("Trying to find friendship status for " + currentUser + " with the user " + tempUser)
					let friendStatus = getFriendStatus(currentUser, tempUser, yourFriendsArray)
					theirFriendsArray[i].friendshipKey = friendStatus;
					console.log(friendStatus)

				} else {
					theirFriendsArray[i].alsoYourFriend = 0;
					theirFriendsArray[i].friendshipKey = "not_friends";
				}
				
			}

			return theirFriendsArray;
		}

		*/

		//Create an Array of just post user names
		posts[i].postLikesArray.map((postLike) => (
			simpleLikesArray.push(postLike.likedByUserName)
		))

		posts[i].simpleLikesArray = simpleLikesArray;

	}

	//STEP 3: Add Post Comments 
	//THE ABOVE HAS COMMENTS TOO!!
	//console.log(postsOutcome);

	res.json(posts)

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
function getSinglePost(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;
    const queryString = "SELECT * FROM posts WHERE post_id = ?";

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			const posts = rows.map((row) => {
				return {
					postID: row.post_id,
					postType: row.post_type,
					groupID: row.group_id,
					listID: row.list_id,
					postFrom: row.post_from,
					postTo: row.post_to,
					postCaption: row.post_caption,
					fileName: row.file_name,
					fileNameServer: row.file_name_server,
					fileUrl: row.file_url,
					videoURL: row.video_url,
					videoCode: row.video_code,
					created: row.created
				}
			});

			//res.setHeader('Access-Control-Allow-Origin', '*');
			//res.json({posts:posts});
			console.log(typeof(posts))
			res.json(posts);

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
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

	var likePostOutcome = {
		
	}
    
	//STEP 1: Check if user has already liked 
	const queryString = "SELECT COUNT(*) AS likeCount FROM post_likes WHERE post_id = ? AND liked_by_name = ?"	
	
	connection.query(queryString, [postID, currentUser], (err, rows) => {
		if (!err) {
	
			//STEP 2: User has not liked so you can like the post 
			likeCount = rows[0].likeCount;	

			if(likeCount == 0) { 
				const insertString = "INSERT INTO post_likes (post_id, liked_by, liked_by_name) VALUES (?, ?, ?)"
				connection.query(insertString, [postID, 1, currentUser], (err, results) => {
					if (!err) {

						//STEP 3: Get the Users information 
						console.log("You created a new like " + results.insertId);  
						 const likeQueryString = "SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_like_id = ?"
						 connection.query(likeQueryString, [results.insertId], (err, rows) => {
							if (!err) {
								
								
								newLike = rows.map((row) => {
									console.log(row)
									return {
										postLikeID: row.post_like_id,
										postID: row.post_id,
										likedByUserName: row.liked_by_name,
										likedByImage: row.image_name, 
										likedByFirstName: row.first_name, 
										likedByLastName:row.last_name,
										timestamp: row.time_stamp
									}
								});
								
								res.json({success: 1, successMessage: "you liked", newLike: newLike, postID: postID, currentUser: currentUser})
					
					
							} else {
								console.log("Failed to Select the New Like" + err)
								res.json({err:err})	
			
							}
						})		
					} else {    
						console.log(err)
						res.json({err:err})	
					} 
				}) 	

			} else {
				//res.json({totalLikes: "already liked"})	
				res.json({success: 0, successMessage: "already liked", postLikeID: null, postID: postID, currentUser: currentUser})
			
			}
				
		} else {
			console.log("Failed to Select Requests: " + err);
			res.json({totalLikes: "error"})
		}
	})
}

//Function C2: Unlike a Post 
async function unlikePost(req, res) {
	const connection = db.getConnection();
	var currentUser = req.body.currentUser
	var postID = req.body.postID

	var likeOutcome = {
		success: false,
		currentUser: currentUser,
		postID: postID
	}

	const queryString = "DELETE FROM post_likes WHERE post_id = ? AND liked_by_name = ?;"	
	
	connection.query(queryString, [postID, currentUser], (err, rows) => {
		if (!err) {
			likeOutcome.success = true;
			res.json(likeOutcome)
	
		} else {
			console.log("Failed to Unlike Requests: " + err);
			res.json(likeOutcome)
		}
	})
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



module.exports = { postText, postPhoto, postPhotoLocal, postVideo, postArticle, getGroupPosts, getAllGroupPosts, getAllUserPosts, getSinglePost, getAllPosts, likePost, unlikePost, getAllLikes, getPostLikes, deletePost, editPost  };


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