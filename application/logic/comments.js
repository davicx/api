const db = require('../functions/conn');
const Comment = require('../functions/classes/Comment');
const Notification = require('../functions/classes/Notification')
const Functions = require('../functions/functions');
const TimeFunctions = require('../functions/timeFunctions');
const CommentFunctions = require('../functions/commentFunctions');
const UserFunctions = require('../functions/userFunctions');

/*
FUNCTIONS A: All Functions Related to Comments
	1) Function A1: Post a new Comment
 
FUNCTIONS B: All Functions Related to getting Comments
	1) Function B1: Get all Comments to a Post
	2) Function B2: Get all Comments

FUNCTIONS C: All Functions Related to Comment Actions
	1) Function C1: Like a Comment
	2) Function C2: Unlike a Comment 

Data 
- Current User
- Post or Comment ID
Message: ""
Status code: 200
Errors: [] 
Outcome Success: true or false

		posts: posts,
		postCount: "get me 10",
		success: true,
		message: "Need to add error and stuff in this always works!", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}
	
*/

//FUNCTIONS A: All Functions Related to Comments
//Function A1: Post a new Comment
async function postComment(req, res) {
	const connection = db.getConnection(); 
	const commentCaption = req.body.commentCaption 
	const commentType = req.body.commentType 
	const currentUser = req.body.commentFrom 
	const commentFrom = req.body.commentFrom 
	//const commentTo = req.body.commentTo 
	const groupID = req.body.groupID 
	const postID = req.body.postID 
	const commentStatus = 0;
	const notificationMessage = req.body.notificationMessage 
	const notificationType = req.body.notificationType 
	//var notificationLink = req.body.notificationLink 
	var notificationLink = "http://localhost:3003/posts/group/" + groupID	


	//STEP 1: Create Comment
	var commentOutcome = {
		data: {},
		message: "",
		success: false,
		statusCode: 500,
		errors: [],
		currentUser: currentUser
	}

	var newCommentOutcome = await Comment.newComment(req);

	if(newCommentOutcome.outcome == 200) {

		//STEP 2: Create Notifications to Group Users
		var notification = {
			masterSite: "kite",
			notificationFrom: currentUser,
			notificationMessage: notificationMessage,
			notificationTo: "Need to get this",
			notificationLink: notificationLink,
			notificationType: notificationType,
			groupID: groupID,
			postID: postID,
			commentID: newCommentOutcome.commentID 
		}

		/*
		"postTo": "frodo",
		"groupID": 70,
		if postTo is same as groupID then its a post in a group not a person

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
		
		*/

		//Notification.createCommentNotification(notification);

		//STEP 3: Create Posted Time
		let timeMessage = TimeFunctions.getCurrentTime()

		//STEP 4: Create Return Comment
		var userOutcome = await UserFunctions.getUserInformation(currentUser);
		console.log("userOutcome")
		console.log(userOutcome)
		console.log("userOutcome")
		

		commentOutcome.message = "You created a new comment with the ID " + newCommentOutcome.commentID;
		commentOutcome.success = true
		commentOutcome.statusCode = 200
		
		let newComment = {
			commentID: newCommentOutcome.commentID,
			postID: postID,
			commentCaption: commentCaption,
			commentFrom: commentFrom,
			userName: currentUser,
			imageName: userOutcome.imageName,
			firstName: userOutcome.firstName,
			lastName: userOutcome.lastName,
			commentLikes: [],
			postDate: timeMessage.postDate,
			postTime: timeMessage.postTime,
			timeMessage: timeMessage.timeMessage,
			created: timeMessage.now,
			commentLikeCount: 0

		}

		commentOutcome.data = newComment;

	}


    res.json(commentOutcome);

}

//FUNCTIONS B: All Functions Related to getting Comments
//Function B1: Get all Comments to a Post
async function getComments(req, res) {
	const connection = db.getConnection(); 
    const postID = req.params.post_id;
	console.log("Trying to get all the comments! for post " + postID)


	//STEP 1: Get all Comments 
	var commentsOutcome = await Comment.getPostComments(postID)

	//STEP 2: Get all the likes for these comments
	if(commentsOutcome.success == true) {
		var comments = commentsOutcome.comments;

		for (let i = 0; i < comments.length; i++) {
			let currentCommentLikes = await Comment.getCommentLikes(comments[i].commentID);
			comments[i].commentLikes = currentCommentLikes.commentLikes;
			comments[i].commentLikeCount = currentCommentLikes.commentLikes.length
			
		}

		res.json(comments)

	} else {
		res.json(comments)
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
	const groupID = req.body.groupID;
	const postID = req.body.postID;
    const commentID = req.body.commentID;
    
	var commentOutcome = {
		data: [],
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	//STEP 1: Check if the comment was already liked (Use commentFunctions)
	var commentLikeStatus = await CommentFunctions.checkCommentLike(commentID, currentUser) 

	//STEP 2: Like Comment or say already liked
	var commentLikeOutcome = await Comment.likeComment(commentID, currentUser);
	//console.log(commentLikeOutcome.newLike[0])

	if(commentLikeStatus.alreadyLiked == false) { 
		if(commentLikeOutcome.success == 1) {
			commentOutcome.data.push(commentLikeOutcome.newLike[0])
			commentOutcome.success = true
			commentOutcome.message = "You liked " + commentID;

			var commentFrom = await CommentFunctions.checkCommentFrom(commentID);
			//console.log(commentFrom) 

			//STEP 3: Add Notification
			var notification = {
				masterSite: "kite",
				notificationFrom: currentUser,
				notificationMessage: currentUser + " liked your comment",
				notificationTo: commentFrom.data,
				notificationLink: "",
				notificationType: "comment_like",
				groupID: groupID,
				postID: postID,
				commentID: commentID 
			}

			Notification.createCommentNotification(notification);

		} else {
			commentLikeOutcome.message = "There was an error trying to like " + commentLikeStatus.commentID;
			commentLikeOutcome.errors = commentLikeStatus.errors
		}

	} else {	
		commentOutcome.message = "already liked"
	}

	res.json(commentOutcome)
	
}

//Function C2: Unlike a Comment 
async function unlikeComment(req, res) {
	const connection = db.getConnection();
	var currentUser = req.body.currentUser
	var commentID = req.body.commentID
	//var groupID = req.body.groupID

	var commentOutcome = {
		data: [],
		success: false,
		message: "", 
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	var commentLikeOutcome = await CommentFunctions.checkCommentLike(commentID, currentUser) 

	console.log("unliking comment " + commentID + " for user " + currentUser )

	//The comment is not liked
	if(commentLikeOutcome.alreadyLiked == false ) {
		commentOutcome.message = "This comment was not liked so there was nothing to remove"
		commentOutcome.success = true;
		res.json(commentOutcome)

	} else {
		const queryString = "DELETE FROM comment_likes WHERE comment_id = ? AND liked_by_name = ?;"	
	
		connection.query(queryString, [commentID, currentUser], (err, rows) => {
			if (!err) {
				commentOutcome.message = "The like was removed";
				commentOutcome.success = true;
				
				//TO DO: Remove Notification
				var comment_type = "comment_like"
				Notification.removeNotification(commentID, currentUser, comment_type);
				res.json(commentOutcome)
		
			} else {
				console.log("Failed to Unlike Requests: " + err);
				//likeOutcome.commentDeletedMessage = "There was no like to remove";
				res.json(commentOutcome)
			}
		})
	}



}


module.exports = { postComment, getComments, getAllComments, likeComment, unlikeComment };


/*
async function likeCommentWORKS(req, res) {
	const connection = db.getConnection(); 
    const currentUser = req.body.currentUser;
    const commentID = req.body.commentID;
    const postID = "Use this?"

	//STEP 1: Check if the comment was already liked (Use commentFunctions)
	//STEP 2: Like Comment or say already liked
	//STEP 3: Add Notification

	var commentOutcome = await Comment.likeComment(commentID, currentUser);


	const queryString = "SELECT COUNT(*) AS likeCount FROM comment_likes WHERE comment_id = ? AND liked_by_name = ?"	
	
	connection.query(queryString, [commentID, currentUser], (err, rows) => {
		if (!err) {
	
			likeCount = rows[0].likeCount;	
	
			if(likeCount == 0) { 
				const insertString = "INSERT INTO comment_likes (comment_id, liked_by, liked_by_name) VALUES (?, ?, ?)"
				connection.query(insertString, [commentID, 1, currentUser], (err, results) => {
					if (!err) {

						//STEP 3: Get the Users information 
						console.log("You created a new like " + results.insertId);  
						 const likeQueryString = "SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comment_likes INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name WHERE comment_likes.comment_like_id = ?"
						 connection.query(likeQueryString, [results.insertId], (err, rows) => {
							if (!err) {
								
								newLike = rows.map((row) => {
									return {
										commentLikeID: row.comment_like_id,
										commentID: row.comment_id,
										likedByUserName: row.liked_by_name,
										likedByImage: row.image_name, 
										likedByFirstName: row.first_name, 
										likedByLastName:row.last_name,
										timestamp: row.updated
									}
								});
								
								res.json({success: 1, successMessage: "you liked", newLike: newLike, commentID: commentID, currentUser: currentUser})
					
					
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
				res.json({success: 0, successMessage: "already liked", postLikeID: null, commentID: commentID, currentUser: currentUser})
			}
			
				
		} else {
			console.log("Failed to Select Requests: " + err);
			res.json({totalLikes: "error"})
		}
	})

		//STEP 2: Add Notification

}
}
*/