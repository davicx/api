const db = require('./conn');
//const Group = require('./classes/Group');
//const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');
const Functions = require('./functions');

/*
 
FUNCTIONS A: All Functions Related to Comments
	1) Function A1: Check for Liked Comment
*/


//Function A1: Check for Liked Comment
async function checkCommentLike(commentID, userName)  {
    const connection = db.getConnection(); 

	const queryString = "SELECT COUNT(*) AS likeCount FROM comment_likes WHERE comment_id = ? AND liked_by_name = ?"	
	
    var commentLikeOutcome = {
        currentUser: userName,
        alreadyLiked: true,
        error: false,
        errorMessages: []

    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [commentID, userName], (err, rows) => {
                if (!err) {
                    console.log(rows)
                    likeCount = rows[0].likeCount;	

                    if(likeCount < 1) {
                        commentLikeOutcome.alreadyLiked = false
                    }

                    resolve(commentLikeOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    commentLikeOutcome.error = true;
                    commentLikeOutcome.errorMessages.push(err)
                    reject(commentLikeOutcome);
                }
           })
            
        } catch(err) { 
            commentLikeOutcome.error = true;
            commentLikeOutcome.errorMessages.push(err)
            reject(commentLikeOutcome);
        } 
    })

}

module.exports = { checkCommentLike }
