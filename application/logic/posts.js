const db = require('../functions/conn');
const Group = require('../functions/classes/Group');
const Post = require('../functions/classes/Post');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const PostFunctions = require('../functions/postFunctions');

/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Post Text
	2) Function A2: Post Video
	3) Function A3: Post Photo
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

//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Text
async function postText(req, res) {
	//const connection = db.getConnection(); 

	console.log("Make a new Post text")
	console.log(req.body)
	const groupID = req.body.groupID;
	var postOutcome = await Post.createPostText(req);

	console.log(postOutcome)
	
	if(postOutcome.outcome == 0) {
		console.log("Something went wrong making this post!")
	}

	//STEP 2: Add the Notifications
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

	const newPost = {
        postID: postOutcome.postID,
        postType: "text",
        groupID: groupID,
        listID: 0,
        postFrom: req.body.postFrom,
        postTo: req.body.postTo,
        postCaption: req.body.postCaption,
        fileName: req.body.fileName,
        fileNameServer: req.body.fileNameServer,
        fileUrl: req.body.fileUrl,
        postLikesArray: [],
        simpleLikesArray: [],
        fileUrl: req.body.fileUrl,
        videoURL: req.body.videoURL,
        videoCode: req.body.videoCode,
        created: "2021-12-19T08:14:03.000Z"
	}

	postOutcome.newPost = newPost;

	res.json(postOutcome);
}

//Function A2: Post Photo
async function postPhoto(req, res, file) {
	const groupID = req.body.groupID;
	postOutcome = await Post.createPostPhoto(req, file);

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
	postOutcome = await Post.createPostVideo(req);
		
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

	//Get All Posts
	var postsOutcome = await PostFunctions.getGroupPostsAll(groupID)
	var posts = postsOutcome.posts;

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

	res.json(posts)

}

//Route B2: Get Group Posts Pagination
//http://localhost:3003/posts/group/72/page/1/
async function getGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentPage = req.params.page;
	
	//Get All Posts
	var postsOutcome = await PostFunctions.getGroupPosts(groupID, currentPage)
	var posts = postsOutcome.posts;

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
	console.log(postsOutcome);

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
/*
Data 
- Current User
- Post or Comment ID
Message: ""
Status code: 200
Errors: [] 
Outcome Success: true or false

	var commentOutcome = {
		data: [],
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}
*/
async function deletePost(req, res) {
	const connection = db.getConnection(); 
	const postID = req.body.postID;
	const currentUser = req.body.currentUser;

	console.log("DELETE POST")
	console.log(postID)

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
	//const post = req.body
	console.log(req.body)
	//STEP 1: Check if Post Exists
	//STEP 2: Update Image
	res.json({editMe: "Yay!"})

}



module.exports = { postText, postPhoto, postVideo, postArticle, getGroupPosts, getAllGroupPosts, getAllUserPosts, getSinglePost, getAllPosts, likePost, unlikePost, getAllLikes, getPostLikes, deletePost, editPost  };
