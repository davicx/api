const db = require('../functions/conn');
//const Group = require('../functions/classes/Group');
//const Post = require('../functions/classes/Post');
//const Notification = require('../functions/classes/Notification')
//const Comment = require('../functions/classes/Comment')
//const Requests = require('../functions/classes/Requests');
//const Functions = require('../functions/functions');
//const PostFunctions = require('../functions/postFunctions');

//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Text
async function getUserNotifications(req, res) {
    let currentUser = req.params.user_id;
    const connection = db.getConnection(); 

    const queryString = "SELECT * FROM notifications WHERE notification_to = ? AND notification_deleted = 0";
    //const queryString = "SELECT * FROM notifications";

    connection.query(queryString, [currentUser], (err, rows) => {
        if (!err) {
            console.log(rows)
            /*
			const comments = rows.map((row) => {
				return {
					postID: row.post_id,
					commentCaption: row.comment,
					commentFrom: row.from,
					commentType: row.comment_type,	
					created: row.created
				}
			});
            */
        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })

    res.json({hi:"hi", currentUser: currentUser})

}

module.exports = { getUserNotifications };
