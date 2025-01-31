const db = require('./conn');
const dayjs = require('dayjs')
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
dayjs().format()
const Group = require('./classes/Group');
const Comment = require('./classes/Comment')
const Post = require('./classes/Post');
//const Notification = require('./classes/Notification')
//const Requests = require('./classes/Requests');
const Functions = require('./functions');
const friendFunctions = require('./friendFunctions');
const cloudFunctions = require('./cloudFunctions');


/*
 
FUNCTIONS A: Like Functions 
	1) Function A1: Check if User has Liked a Post 

*/

//FUNCTIONS A: Like Functions 
//Function A1: Check if User has Liked a Post 
async function checkPostLikeStatus(currentUser, postID)  {
    const connection = db.getConnection(); 
    
    const queryString = "SELECT COUNT(*) AS likeCount FROM post_likes WHERE post_id = ? AND liked_by_name = ?"	
	
    var postLikedStatusOutcome = {
        success: false,
        currentLikeCount: 0,
    }

    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [postID, currentUser], (err, rows) => {
                if (!err) {
                    //console.log("likeCount")
                    //console.log(rows[0].likeCount)
                    postLikedStatusOutcome.currentLikeCount = rows[0].likeCount;
                    postLikedStatusOutcome.success = true

                    resolve(postLikedStatusOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postLikedStatusOutcome);
                }
            })
            
        } catch(err) { 
            reject(postLikedStatusOutcome);
        } 
    })    
    
}

//Function A2: Like a Post 
async function likePost(postID, likedByUserName, likedByID)  {
    const connection = db.getConnection(); 

    var postLikeOutcome = {
        success: false,
        postLikeID: 0,
        currentLikeCount: 0,
    }

    return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO post_likes (post_id, liked_by, liked_by_name) VALUES (?, ?, ?)"

                connection.query(queryString, [postID, likedByID, likedByUserName], (err, results) => {
                    if (!err) {
                        //console.log("You added " + groupUser)
                        //addGroupUserStatus.userAdded = 1;
                        //console.log(results)
                        postLikeOutcome.success = true;
                        postLikeOutcome.postLikeID = results.insertId;
                        postLikeOutcome.currentLikeCount = 1;
                        resolve(postLikeOutcome);
                    } else {
                        //addGroupUserStatus.userAdded = 0;
                        resolve(postLikeOutcome);
                    }
                })  
            } catch(err) {
                reject(postLikeOutcome);
        } 
    });
}

//Function A2: UnLike a Post 
async function unlikePost(postID, currentUser)  {
    const connection = db.getConnection(); 

    var postUnlikeOutcome = {
        success: false,
        message: ""
    }

    return new Promise(async function(resolve, reject) {
            try {
                //const queryString = "INSERT INTO post_likes (post_id, liked_by, liked_by_name) VALUES (?, ?, ?)"
                const queryString = "DELETE FROM post_likes WHERE post_id = ? AND liked_by_name = ?;"

                connection.query(queryString, [postID, currentUser], (err, results) => {
                    if (!err) {
                        //console.log(results)
                        //console.log("You added " + groupUser)
                        //addGroupUserStatus.userAdded = 1;
                        //console.log(results)
                        postUnlikeOutcome.success = true;
   
                        resolve(postUnlikeOutcome);
                    } else {
                        //addGroupUserStatus.userAdded = 0;
                        resolve(postUnlikeOutcome);
                    }
                })  
            } catch(err) {
                reject(postUnlikeOutcome);
        } 
    });
}

//Function A5: Get a Liked Posts User Information 
async function getLikedPostUserInformation(postLikeID)  {
    const connection = db.getConnection(); 

    var postLikeOutcome = {
        success: false,
        newLike: {},
        error: []
    }

    //UPDATE ME BELOW 
    return new Promise(async function(resolve, reject) {
            try {
                const queryString = "SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_like_id = ?"
        
                connection.query(queryString, [postLikeID], (err, rows) => {
                    if (!err) {
                        
                        let tempNewLike = rows.map((row) => {
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
                        
                        postLikeOutcome.success = true;
                        postLikeOutcome.newLike = tempNewLike;
                        
                        resolve(postLikeOutcome);
                    } else {
                        //addGroupUserStatus.userAdded = 0;
                        resolve(postLikeOutcome);
                    }
                })  
            } catch(err) {
                reject(postLikeOutcome);
        } 
    });
}

//Function A6: Get the Like ID of a Liked Post
async function getPostLikeID(postID, currentUser)  {
    const connection = db.getConnection(); 

    var postLikeIDOutcome = {
        success: false,
        postLikeID: 0,
        message: ""
    }

    return new Promise(async function(resolve, reject) {
            try {
                //const queryString = "INSERT INTO post_likes (post_id, liked_by, liked_by_name) VALUES (?, ?, ?)"
                const queryString = "SELECT post_like_id from post_likes WHERE post_id = ? AND liked_by_name = ?"

                connection.query(queryString, [postID, currentUser], (err, results) => {
                    if (!err) {
                        postLikeIDOutcome.postLikeID = results[0].post_like_id;
                        postLikeIDOutcome.success = true;
   
                        resolve(postLikeIDOutcome);
                    } else {
                        //addGroupUserStatus.userAdded = 0;
                        resolve(postLikeIDOutcome);
                    }
                })  
            } catch(err) {
                reject(postLikeIDOutcome);
        } 
    });
}

module.exports = { checkPostLikeStatus, likePost, unlikePost, getLikedPostUserInformation, getPostLikeID }
