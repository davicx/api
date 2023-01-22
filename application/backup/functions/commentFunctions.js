const db = require('./conn');
const Group = require('./classes/Group');
const Post = require('./classes/Post');
const Notification = require('./classes/Notification')

//Route A1: Post Text
async function postComment(req, res) {
	const connection = db.getConnection(); 
	const masterSite = req.body.masterSite 
	const commentCaption = req.body.commentCaption 
	const commentType = req.body.commentType 
	const commentFrom = req.body.commentFrom 
	const commentTo = req.body.commentTo 
	const groupID = req.body.groupID 
	const postID = req.body.postID 
	const listID = req.body.listID 
	const notificationMessage = req.body.notificationMessage 
	const notificationType = req.body.notificationType 
	const notificationLink = req.body.notificationLink 

	//STEP 1: Create Comment

	//STEP 2: Create Notifications to Group 



	console.log("Comment from! " + commentFrom)
    res.json({comment: commentCaption});

}

async function TEMPpostText(req, res) {
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

		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}

	res.json(postOutcome);
}


	/*
	"masterSite": "kite",
    "commentType": "post",
    "commentFrom": "davey",
    "commentTo": "frodo",
    "groupID": 77,
    "postID": 1,
    "listID": 0,
    "commentCaption": "Hiya Frodo!! The weather is perfect! wanna hike or we could garden!",   
    "notificationMessage": "Posted a Comment on Post",   
    "notificationType": "new_post_comment",
    "notificationLink": "http://localhost:3003/posts/group/77" 


	const queryString = "INSERT INTO comments (master_site, post_type, group_id, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?, ?)"
    
	connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption], (err, results, fields) => {
		if (!err) {
			console.log("You created a new Comment with ID " + results.insertId);    
			//postOutcome.outcome = 200;       
			//postOutcome.postID = results.insertId;       
		} else {    
			console.log(err)
			//postOutcome.outcome = "no worky"
			//postOutcome.errors.push(err);
		} 
		//resolve();
	}) 
	comment table

	comment_id
	"masterSite": "kite",
    "commentType": "post",
    "commentFrom": "davey",
    "commentTo": "frodo",
    "groupID": 77,
    "postID": 1,
    "listID": 0,
    "commentCaption": "Hiya Frodo!! The weather is perfect! wanna hike or we could garden!",   

  `comment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,



  `group_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `comment_is_child` int(11) NOT NULL,
  `comment` text NOT NULL,
  `comment_from` varchar(255) NOT NULL,
  `has_file` int(11) NOT NULL,
  `file_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `comment_deleted` int(11) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
	*/
    /*
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

		if(groupUsers.length > 0) {
			Notification.createGroupNotification(notification);
		}
	}

	res.json(postOutcome);
    */


module.exports = { postComment };