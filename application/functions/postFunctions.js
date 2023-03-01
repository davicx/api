const db = require('./conn');
const Group = require('./classes/Group');
const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');
const Functions = require('./functions');

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

*/


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


//FUNCTIONS B: All Functions Related to getting Posts
//Function B1: Get all Group Posts
async function getGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;

	//Get All Posts
	var postsOutcome = await Functions.getGroupPosts(groupID)
	var posts = postsOutcome.posts;

	for (let i = 0; i < posts.length; i++) {
		let simpleLikesArray = []
		var currentPostLikes = await Functions.getPostLikes(posts[i].postID) 
		posts[i].postLikesArray = currentPostLikes.postLikes;

		//Create an Array of just post user names
		posts[i].postLikesArray.map((postLike) => (
			simpleLikesArray.push(postLike.likedByUserName)
		))

		posts[i].simpleLikesArray = simpleLikesArray;

	}

	res.json(posts)

}

//Function B2: Get all User Posts 

//Function B3: Get Single Post by ID (May not work just added)
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


//Function 4: Get all Posts 
async function getAllPosts(req, res) {
	const connection = db.getConnection(); 

	//Get All Posts
	var postsOutcome = await Functions.getAllPosts()
	var posts = postsOutcome.posts;
 
	for (let i = 0; i < posts.length; i++) {
		var currentPostLikes = await Functions.getPostLikes(posts[i].postID) 
		posts[i].postLikes = currentPostLikes.postLikes;
	}

	res.json(posts)

}

async function getAllPostsOLD(req, res) {
	const connection = db.getConnection(); 
	var postsArray = []

	const queryString = "SELECT * FROM posts ORDER BY post_id DESC LIMIT 5";
	//var postRows = await connection.query(queryString, (err, rows, fields));
	//console.log(postRows)
	connection.query(queryString, (err, rows, fields) => {
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
	
 
		 } else {
			 console.log("Failed to Select Posts" + err)
			 res.sendStatus(500)
			 return
		 }
	})
	
 }































 //APPENDIX (TEMP)
 async function postTemp(req, res) {
	const masterSite = req.body.masterSite 
	const postType = req.body.postType 
	const postFrom = req.body.postFrom 
	const postTo = req.body.postTo 
	const groupID = req.body.groupID 
	const postCaption = "NEW CAPTION:  " + req.body.postCaption 
	console.log("POST: Make a temp post")
	var postOutcome = await Post.createPostText(req);
	const postID = postOutcome.postID;

	const newPost = {
        postID: postID,
        postType: postType,
        groupID: groupID,
        listID: 0,
        postFrom: postFrom,
        postTo: postTo,
        postCaption: postCaption,
        fileName: "",
        fileNameServer: "hiya.jpg",
        fileUrl: "empty",
        videoURL: "empty",
        videoCode: "empty",
        created: "2021-12-19T08:14:03.000Z"
	}

	//TEMP
	postOutcome.newPost = newPost;

	res.json(newPost);

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
 

 module.exports = { postTemp, postText, postPhoto, postVideo, getGroupPosts, getSinglePost, getAllPosts, likePost, unlikePost, getAllLikes, getPostLikes };



/*

//FUNCTIONS B: All Functions Related to Post Actions 
//Function B1: Like a Post 
 if (isset($_POST["like_post"]) && (!empty($_POST["like_post"]))) {
	$logged_in_user = $_POST["logged_in_user"]; 
	$post_id     	= $_POST["post_id"]; 
	$user_id 		= getUserID($logged_in_user);
	
	//STEP 1: Make Sure User Has Not Already Liked Post 
$user_post_like_count = $result_likes->num_rows;
	
	if ($user_post_like_count == 0){
		
		//STEP 2: Insert into likes table 	
		$stmt = $conn->prepare("INSERT INTO post_likes(post_id, liked_by, liked_by_name) VALUES (?, ?, ?)");
		$stmt->bind_param("iis",  $post_id, $user_id, $logged_in_user);
		$user_post_like_count = $user_post_like_count + 1;
		if ($stmt->execute()) {
			
			//STEP 3: Get count of new post likes 
			$result_total_likes = mysqli_query($conn,"SELECT * FROM post_likes WHERE post_id = '$post_id'");
			$total_post_likes = $result_total_likes->num_rows;	
			echo $total_post_likes;
	
		} else {
			echo "Error: " . $sql . "<br>" . mysqli_error($conn);
		}			
	} 
}	

//Function B2: UnLike a Post	
if (isset($_POST["unlike_post"]) && (!empty($_POST["unlike_post"]))) {
	$logged_in_user = $_POST["logged_in_user"]; 
	$post_id     	= $_POST["post_id"]; 
	$user_id 		= getUserID($logged_in_user);
	
	//STEP 1: Delete the users Like 
	$sql = "DELETE FROM post_likes WHERE liked_by_name ='$logged_in_user' and post_id = '$post_id'";
	
	if (mysqli_query($conn, $sql)) {
		
		//STEP 2: Get count of new post likes 
		$result_total_likes = mysqli_query($conn,"SELECT * FROM post_likes WHERE post_id = '$post_id'");
		$total_post_likes = $result_total_likes->num_rows;	
		echo $total_post_likes;		
		
		//echo "Record deleted successfully";
	} else {
		echo "Error deleting record: " . mysqli_error($conn);
	}
}	
 
*/


 /*

//Like a Post
postRouter.post("/api/post/like", (req, res) => {
  const postID = req.body.postID
  console.log("You liked post with the POST ID " + postID)

  for (let i = 0; i < posts.length; i++) {
    console.log(posts[i].postID + " " + postID)
    if(posts[i].postID == postID) {
      if(posts[i].postLikesArray.includes(currentUser)) {
        console.log(currentUser + " Had already liked this post so we will unlike! with POST ID  " + postID)
        const index = posts[i].postLikesArray.indexOf(currentUser);
        if (index > -1) { 
          posts[i].postLikesArray.splice(index, 1); 
        }
        posts[i].totalLikes = posts[i].postLikesArray.length
        res.json(posts[i])
        return 
      } else {
        console.log(currentUser + " Liked this post!")
        posts[i].postLikesArray.push(currentUser);
        posts[i].totalLikes = posts[i].postLikesArray.length
        res.json(posts[i])
        return 
      }
      posts[i].postLikesArray.includes(currentUser)
    }

  } 
  console.log(posts)
  
  //res.json(posts)
})

//Edit a Post
postRouter.post("/api/post/edit", (req, res) => {
    const post = req.body
    const postID = post.postID
    const newPostCaption = post.newPostCaption
    console.log("error! post not found " + postID)
  
    for (let i = 0; i < posts.length; i++) {
      
      if(posts[i].postID == postID) {
        console.log("Found the post " + posts[i].postID + " " + postID)
        console.log(posts[i].postCaption);
        console.log(newPostCaption);
        posts[i].postCaption = newPostCaption;
        res.json(posts[i])
        return 
        
      } else {
        console.log("error! post not found " + posts[i].postID + " " + postID)
        res.json(posts[i])
        return
      }
    } 
    
  })
  
 */

 










//CLEAN BELOW 
/*

 */
/*

//Function B2: Get all posts with Pagination
function getAllPostsPagination(req, res) {
	const connection = db.getConnection(); 	

	const page = parseInt(req.query.page);
	const limit = parseInt(req.query.limit);
	const maxPages = "include this in the query"

	if(isNaN(page)|| isNaN(limit)) {
		const queryString = "SELECT * FROM posts LIMIT 100";

		connection.query(queryString, (err, rows, fields) => {
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
				
				 res.json({posts:posts});

			 } else {
				 console.log("Failed to Select Posts" + err)
				 res.sendStatus(500)
				 return
			 }
		})
		
	} else {
		console.log("page " + page + " limit " + limit)
		console.log("page " + page + " limit " + limit)

		const startIndex = (page - 1) * limit
		const endIndex = page * limit 
	
		console.log("startIndex " + startIndex + " endIndex " + endIndex)
	
		//Start and End 
		var results = {}
			
		//Check this is less then total amount
		//if(endIndex < )
		results.next = {
			page: page + 1,
			limit: limit
		}
	
		if(startIndex > 0) {
			results.previous = {
				page: page - 1,
				limit: limit
			}
		}	
	
		const queryString = "SELECT * FROM posts ORDER BY post_id LIMIT ? OFFSET ?";
	
		connection.query(queryString, [limit, startIndex], (err, rows) => {
			 if (!err) {
	 
				 //Return Object 
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
	 
				 //res.json({posts:posts});
				 results.posts = posts
				 res.json(results);
	 
			 } else {
				 console.log("Failed to Select Posts" + err)
				 res.sendStatus(500)
				 return
			 }
		})
	}


}
*/
/*
//Route B2: Get Posts to a User
function getUserPosts(req, res) {
	const connection = db.getConnection(); 
    const post_to = req.params.user_name;
	console.log(req.params);
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_to = ?";

    connection.query(queryString, [post_to], (err, rows, fields) => {
        if (!err) {
			const posts = rows.map((row) => {
				return {
					postID: row.post_id,
					postFrom: row.post_from,
					postTo: row.post_to,
					postCaption: row.post_caption
				}
			});

			//res.setHeader('Access-Control-Allow-Origin', '*');
			//res.json({posts:posts});
			res.json(posts);

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
}

//UPDATE
async function postUpdateText(req, res) {
	const connection = db.getConnection(); 
	const postID = req.body.postID;
	const postType = req.body.postType;
	const postCaption = req.body.postCaption;
	console.log(req.body)
	console.log("post update text " + postID + " " + postCaption + " " + postType) 

	const updatedPost = {
		postType: "text",
		groupID: 77,
		listID: 0,
		postFrom: "davey",
		postTo: "frodo",
		postCaption: postCaption,
		fileName: "",
		fileNameServer: "hiya.jpg",
		fileUrl: "empty",
		videoURL: "empty",
		videoCode: "empty",
		created: "2021-12-19T08:14:03.000Z"
	}

	console.log(updatedPost)
	
	const queryString = "UPDATE posts SET post_caption = ? WHERE post_id = ?";

    connection.query(queryString, [postCaption, postID], (err, rows) => {
        if (!err) {
			console.log("worked")
        } else {
			console.log("error")

		}
    })

	res.json(updatedPost);
}


//GET ROUTES
//Route B1: Get Posts to a Group



//Route B3: Get Single Post by ID 
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


//Route 4: Get all Posts 
*/
 

//module.exports = { postText, postPhoto, postVideo, getGroupPosts, getUserPosts, getSinglePost, getAllPosts, postUpdateText, getAllPostsPagination };















 /*
 //Middle ware
 function paginatedResults(model) {
	return (req, res, next) => {
		const page = parseInt(req.query.page);
		const limit = parseInt(req.query.limit);
	
		console.log("page " + page + " limit " + limit)
	
		const startIndex = (page - 1) * limit
		const endIndex = page * limit 
	
		var results = {}
		
		//Check this is less then total amount
		//if(endIndex < )
		results.next = {
			page: page + 1,
			limit: limit
		}
	
		if(startIndex > 0) {
			results.previous = {
				page: page - 1,
				limit: limit
			}
		}
	res.paginatedResults = results
	}
 }
*/

 /*
 	const page = parseInt(req.query.page);
	const limit = parseInt(req.query.limit);

	console.log("page " + page + " limit " + limit)

	const startIndex = (page - 1) * limit
	const endIndex = page * limit 

	var results = {}
    
	//Check this is less then total amount
	//if(endIndex < )
	results.next = {
		page: page + 1,
		limit: limit
	}

	if(startIndex > 0) {
		results.previous = {
			page: page - 1,
			limit: limit
		}
	}
	*/

		

	//Get Post
	/*
    const queryString = "SELECT * FROM posts WHERE group_id = ? ORDER BY post_id DESC";

    connection.query(queryString, [group_id], (err, rows) => {
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

			res.json(posts);

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
	*/