const db = require('./conn');
const Comment = require('./classes/Comment');
const Notification = require('./classes/Notification')
const Functions = require('./functions');
//const Post = require('./classes/Post');
//const Group = require('./classes/Group');


/*
FUNCTIONS A: All Functions Related to Comments
	1) Function A1: Post a new Comment
 
FUNCTIONS B: All Functions Related to getting Comments
	1) Function B1: Get all Comments to a Post
	2) Function B2: Get all Comments

FUNCTIONS C: All Functions Related to Comment Actions
	1) Function C1: Like a Comment
	2) Function C2: Unlike a Comment 

*/


//FUNCTIONS A: All Functions Related to Comments
//Function A1: Post a new Comment
async function postComment(req, res) {
	const connection = db.getConnection(); 
	const notificationMessage = req.body.notificationMessage 
	const notificationType = req.body.notificationType 
	const notificationLink = req.body.notificationLink 

	//STEP 1: Create Comment
	var commentOutcome = await Comment.newComment(req);

	console.log(commentOutcome);
	//STEP 2: Create Notifications to Group 

	
    res.json(commentOutcome);

}

//FUNCTIONS B: All Functions Related to getting Comments
//Function B1: Get all Comments to a Post
async function getComments(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;

	//STEP 1: Get all Comments 
	var commentsOutcome = await Functions.getPostComments(postID)
	
	//STEP 2: Get all the likes for these comments
	if(commentsOutcome.success == true) {
		//var comments = commentsOutcome.comments;
		console.log(commentsOutcome)
		res.json(commentsOutcome)

	} else {
		res.json(commentsOutcome)
	}

}

//Function B2: Get all Comments
async function getAllComments(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;
    const queryString = "SELECT * FROM comments";

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			const comments = rows.map((row) => {
				return {
					postID: row.post_id,
					commentCaption: row.comment,
					commentFrom: row.from,
					commentType: row.comment_type,	
					created: row.created
				}
			});

			res.json(comments);

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
}

//FUNCTIONS C: All Functions Related to Comment Actions
//Function C1: Like a Comment
async function likeComment(req, res) {
	const connection = db.getConnection(); 
    const currentUser = req.body.currentUser;
    const commentID = req.body.commentID;

	//var commentOutcome = await Comment.likeComment(currentUser, commentID);
	
	const queryString = "SELECT COUNT(*) AS likeCount FROM comment_likes WHERE comment_id = ? AND liked_by_name = ?"	
	
	connection.query(queryString, [commentID, currentUser], (err, rows) => {
		if (!err) {
	
			//STEP 2: User has not liked so you can like the post 
			likeCount = rows[0].likeCount;	
			//WORKING TELL HERE
			/*
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
			*/
				
		} else {
			console.log("Failed to Select Requests: " + err);
			res.json({totalLikes: "error"})
		}
	})


	
	res.json({currentUser: currentUser})

}

//Function C2: Unlike a Comment 
async function unlikeComment(req, res) {
	const connection = db.getConnection(); 
    
	res.json(req.body)

}


module.exports = { postComment, getComments, getAllComments, likeComment, unlikeComment };



/*
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

*/