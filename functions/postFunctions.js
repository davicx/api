const db = require('./conn');
const Group = require('./classes/Group');
const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');

//Route A1: Post Text
async function postText(req, res) {
	console.log("post text")
	const groupID = req.body.groupID;
	postOutcome = await Post.createPostText(req);

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
		//console.log(notification);
		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}

	res.json(postOutcome);
}

//Route A2: Post Photo
async function postPhoto(req, res, file) {
	console.log("post photo")
	const groupID = req.body.groupID;
	postOutcome = await Post.createPostPhoto(req, file);
	console.log(postOutcome);

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
		//console.log(notification);
		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}
	res.json({postOutcome});
}

//Route A3: Post Video
async function postVideo(req, res) {
	console.log("post video")
	const postType = req.body.postType;
	res.json({postType:postType});
}

//GET ROUTES
//Route B1: Get Posts to a Group
function getGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const group_id = req.params.group_id;
    const queryString = "SELECT * FROM posts WHERE group_id = ?";

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

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({posts:posts});

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
}


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

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({posts:posts});

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
}


//Route B3: Get Single Post by ID 
function getSinglePost(req, res) {
    const post_id = req.params.post_id;
	const connection = db.getConnection(); 
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_id = ?";

    connection.query(queryString, [post_id], (err, rows, fields) => {
        if (err) {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(rows);
    })  
}

//Route 4: Get all Posts 
function getAllPosts(req, res) {
   const connection = db.getConnection(); 
   //const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts LIMIT 10";
   const queryString = "SELECT * FROM posts LIMIT 5";

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

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({posts:posts});

		} else {
			console.log("Failed to Select Posts" + err)
			res.sendStatus(500)
			return
		}
   })
}



module.exports = { postText, postPhoto, postVideo, getGroupPosts, getUserPosts, getSinglePost, getAllPosts };






//APPENDIX
/*
const groupID = req.params.groupID;
const groupOutcome = await Group.getGroupUsers(groupID);
console.log(" You got " +  groupID);
const groupUsers = {
	activeGroupUsers: groupOutcome.groupUsers,
	pendingGroupUsers: groupOutcome.pendingGroupUsers,
}
*/

