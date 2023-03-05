const db = require('./conn');
const Comment = require('./classes/Comment');
const Notification = require('./classes/Notification')
const Functions = require('./functions');
//const Post = require('./classes/Post');
//const Group = require('./classes/Group');


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

//Function A2: Get all Comments to a Post
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

	


	/*
    const queryString =	"SELECT comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comments INNER JOIN user_profile ON comments.comment_from = user_profile.user_name WHERE comments.post_id = ?"

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			const comments = rows.map((row) => {
				console.log(row);
				return {
					postID: row.post_id,
					commentCaption: row.comment,
					commentFrom: row.comment_from,
					commentType: row.comment_type,	
					userName: row.user_name,	
					imageName: row.image_name,	
					firstName: row.first_name,	
					lastName: row.last_name,	
					commentLikes: [],
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
	*/
}


//Function A2: Get all Comments to a Post
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



/*
const masterSite = req.body.masterSite 
const commentCaption = req.body.commentCaption 
const commentType = req.body.commentType 
const commentFrom = req.body.commentFrom 
const commentTo = req.body.commentTo 
const groupID = req.body.groupID 
const postID = req.body.postID 
const listID = req.body.listID 
*/



module.exports = { postComment, getComments, getAllComments };