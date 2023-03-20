const db = require('./conn');
const Group = require('./classes/Group');
const Post = require('./classes/Post');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');
const Functions = require('./functions');

/*
 
FUNCTIONS A: All Functions Related to getting Posts
	1) Function A1: Get Group Posts
	2) Function A2: Get all Group Posts
	3) Function A3: Get User Posts
	4) Function A4: Get all Posts
	5) Function A5: Get all Post Likes 

FUNCTIONS B: All Post Helper Functions	
	1) Function B1: Get count of posts in Group
	2) Function B2: Get count of posts to a User
*/

//FUNCTIONS A: All Functions Related to getting Posts
//Function A1: Get Group Posts
async function getGroupPosts(groupID, currentPage)  {
    const connection = db.getConnection(); 
    const limit = 2;
    const currentOffset = limit * (currentPage - 1);

    var postsCountOutcome = await getGroupPostCount(groupID)

    const queryString = "SELECT * FROM posts WHERE group_id = ? ORDER BY post_id DESC LIMIT ? OFFSET ?";
    
    var postsOutcome = {
        success: false,
        totalGroupPosts: postsCountOutcome.groupPostCount,
        posts: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [groupID, limit, currentOffset], (err, rows) => {
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
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
    
}

//Function A2: Get all Group Posts
async function getGroupPostsAll(groupID)  {
    const connection = db.getConnection(); 

    //const queryString = "SELECT * FROM posts WHERE group_id = ? ORDER BY post_id DESC";
    const queryString = "SELECT * FROM posts WHERE group_id = ? ORDER BY post_id DESC";
    var postsOutcome = {
        success: false,
        posts: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [groupID], (err, rows) => {
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
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
    
}

//Function A3: Get User Posts
async function getUserPosts(userName, currentPage)  {
    const connection = db.getConnection(); 
    const limit = 2;
    const currentOffset = limit * (currentPage - 1);

    var postsCountOutcome = await getUserPostCount(userName)
    console.log(postsCountOutcome);

    //SELECT * FROM posts WHERE post_to = "davey" AND post_status = 1;
    //const queryString = "SELECT * FROM posts WHERE group_id = ? ORDER BY post_id DESC LIMIT ? OFFSET ?";
    const queryString = "SELECT * FROM posts WHERE post_to = ? AND post_status = 1 ORDER BY post_id DESC LIMIT ? OFFSET ?";
    
    var postsOutcome = {
        success: false,
        totalGroupPosts: postsCountOutcome.groupPostCount,
        posts: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [userName, limit, currentOffset], (err, rows) => {
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
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
            })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })    
    
}

//Function A4: Get all Posts
async function getAllPosts()  {
    const connection = db.getConnection(); 
    console.log("Yoo!! GET ALL POSTS")

    const queryString = "SELECT * FROM posts ORDER BY post_id DESC";
    var postsOutcome = {
        success: false,
        posts: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, (err, rows) => {
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
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
    
}

//Function A5: Get all Post Likes 
async function getPostLikes(postID)  {
    const connection = db.getConnection(); 

    const queryString = "SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_id = ?"

    var postLikesOutcome = {
        success: false,
        postLikes: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [postID], (err, rows) => {
                if (!err) {
                    
                    postLikes = rows.map((row) => {
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
                    
                    postLikesOutcome.success = true;
                    postLikesOutcome.postLikes = postLikes;
                    
                    resolve(postLikesOutcome);
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postLikesOutcome);
                }
            })
            
        } catch(err) { 
            reject(postLikesOutcome);
        } 
    })
}

//FUNCTIONS B: All Post Helper Functions	
//Function B1: Get count of posts in Group
async function getGroupPostCount(groupID)  {
    const connection = db.getConnection(); 
 
    //const queryString = "SELECT * FROM posts WHERE group_id = ? ";
    //AND post_status = 1
    const queryString = "SELECT COUNT(post_id) AS post_count FROM posts WHERE group_id = ?";

    var postsOutcome = {
        success: false,
        groupPostCount: 0
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [groupID], (err, rows) => {
            //connection.query(queryString, (err, rows) => {
                if (!err) {
                    console.log(rows)
                    
                    postsOutcome.groupPostCount = rows[0].post_count;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
}

//Function B2: Get count of posts to a User
async function getUserPostCount(userName)  {
    const connection = db.getConnection(); 
 
    //const queryString = "SELECT * FROM posts WHERE group_id = ? ";
    const queryString = "SELECT COUNT(post_id) AS post_count FROM posts WHERE post_to = ? AND post_status = 1";

    var postsOutcome = {
        success: false,
        groupPostCount: 0
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    console.log(rows)
                    
                    postsOutcome.groupPostCount = rows[0].post_count;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
}


module.exports = { getGroupPosts, getAllPosts, getGroupPostsAll, getUserPosts, getPostLikes }
