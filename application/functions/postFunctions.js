const db = require('./conn');
const Group = require('./classes/Group');
const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');

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
function getGroupPosts(req, res) {
	const connection = db.getConnection(); 
    const group_id = req.params.group_id;
	
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
}
//Function B2: Get all User Posts 
//Function B3: Get Single Post by ID 

//Function 4: Get all Posts 
function getAllPosts(req, res) {
	const connection = db.getConnection(); 
	const queryString = "SELECT * FROM posts ORDER BY post_id DESC LIMIT 3";
 
	connection.query(queryString, (err, rows, fields) => {
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
			 
 
			 res.json({posts:posts});
			 //res.json(posts);
 
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


 module.exports = { postTemp, postText, postPhoto, postVideo, getGroupPosts, getAllPosts };

 










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