const db = require('./conn');
const Comment = require('./classes/Comment');
const Notification = require('./classes/Notification')
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
    const queryString = "SELECT * FROM comments WHERE post_id = ?";

	/*
	SELECT comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name 
FROM comments 
INNER JOIN user_profile ON comments.comment_from = user_profile.user_name 
WHERE comments.post_id = 70
	*/

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



module.exports = { postComment, getComments };