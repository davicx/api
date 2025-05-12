const db = require('./../conn');
const timeFunctions = require('../timeFunctions');

class Comment {
    constructor(commentID) {
        this.commentID = commentID;
        this.commentCaption = "";
        this.commentFrom = "";
        this.commentTo = "";
     }
    
    //METHODS A: POST RELATED
    //Method A1: Make a Comment
    static async newComment(req)  {
        const connection = db.getConnection(); 
        const commentCaption = req.body.commentCaption 
        const commentType = req.body.commentType 
        const commentFrom = req.body.commentFrom 
        const commentTo = req.body.commentTo 
        const groupID = req.body.groupID 
        const listID = req.body.listID 
        const postID = req.body.postID 
        const commentStatus = 0;
   
        var commentOutcome = {
            outcome: 0,
            commentID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO comments (post_id, group_id, list_id, comment, comment_type, comment_from, comment_deleted) VALUES (?, ?, ?, ?, ?, ?, ?)"

                connection.query(queryString, [postID, groupID, listID, commentCaption, commentType, commentFrom, commentStatus], (err, results) => {
                    if (!err) {
                        console.log("You created a new Post with ID " + results.insertId);    
                        commentOutcome.outcome = 200;       
                        commentOutcome.commentID = results.insertId;       
                    } else {    
                        commentOutcome.outcome = "no worky"
                        commentOutcome.errors.push(err);
                    } 
                    resolve(commentOutcome);
                }) 
                
            } catch(err) {
                commentOutcome.outcome = "rejected";
                console.log("REJECTED " + err);
                reject(commentOutcome);
            } 
        });
    }

    //Method A2: Get all the comments for a post
    static async getPostComments(postID)  {
        const connection = db.getConnection(); 
        var commentsArray = []

        const queryString = "SELECT comments.comment_id, comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comments INNER JOIN user_profile ON comments.comment_from = user_profile.user_name WHERE comments.post_id = ?"
        var commentsOutcome = {
            success: false,
            comments: []
        }
    
        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [postID], (err, rows) => {
                    if (!err) {
        
                        commentsArray = rows.map((row) => {
                            
                            return {
                                commentID: row.comment_id,
                                postID: row.post_id,
                                commentCaption: row.comment,
                                commentFrom: row.comment_from,
                                commentType: "post",	
                                userName: row.user_name,	
                                imageName: row.image_name,	
                                firstName: row.first_name,	
                                lastName: row.last_name,	
                                commentDate: timeFunctions.formatTimestamp(row.created).date,
                                commentTime: timeFunctions.formatTimestamp(row.created).time,
                                timeMessage: timeFunctions.formatTimestamp(row.created).timeMessage,
                                commentLikes: [],
                                created: row.created
                            }
                        });

                        commentsOutcome.success = true;
                        commentsOutcome.comments = commentsArray;
                        
                        resolve(commentsOutcome);
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(commentsOutcome);
                    }
                })
                
            } catch(err) { 
                reject(commentsOutcome);
            } 
        })
        
    }
    
    //Method A3: Get all Comment Likes
    static async getCommentLikes(commentID)  {
        const connection = db.getConnection(); 
    
        //console.log("CLASS getCommentLikes(commentID) " + commentID)
        //const queryString = "SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_id = ?"
        const queryString = "SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comment_likes INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name WHERE comment_likes.comment_id = ?"
        var commentLikesArray = []
    
        var commentLikesOutcome = {
            success: false,
            commentLikes: []
        }
    
        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [commentID], (err, rows) => {
                    if (!err) {
                        
                        commentLikesArray = rows.map((row) => {
                            //console.log(row)
                            return {
                                commentLikeID: row.comment_like_id,
                                commentID: row.comment_id,
                                likedByUserName: row.liked_by_name,
                                likedByImage: row.image_name, 
                                likedByFirstName: row.first_name, 
                                likedByLastName:row.last_name,
                                commentCreated: row.updated
                            }
                        });
                        
                        commentLikesOutcome.success = true;
                        commentLikesOutcome.commentLikes = commentLikesArray;
                        
                        resolve(commentLikesOutcome);
            
                    } else {

                        console.log("Failed to Select Posts" + err)
                        reject(commentLikesOutcome);
                    }
                })
                
            } catch(err) { 
                reject(commentLikesOutcome);
            } 
        })
    }

    //Method A4: Like a Comment
    static async likeComment(commentID, currentUser)  {
        const connection = db.getConnection(); 
        var createdLike = {}
        
        var likeCommentOutcome = {
            success: 0, 
            successMessage: "", 
            newLike: createdLike, 
            commentID: commentID, 
            currentUser: currentUser,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            const insertString = "INSERT INTO comment_likes (comment_id, liked_by, liked_by_name) VALUES (?, ?, ?)"
            connection.query(insertString, [commentID, 1, currentUser], (err, results) => {
                if (!err) {
    
                    //STEP 3: Get the Users information 
                    console.log("You created a new like " + results.insertId);  
                        const likeQueryString = "SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comment_likes INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name WHERE comment_likes.comment_like_id = ?"
                        connection.query(likeQueryString, [results.insertId], (err, rows) => {
                        if (!err) {
                            
                            createdLike = rows.map((row) => {
                                return {
                                    commentLikeID: row.comment_like_id,
                                    commentID: row.comment_id,
                                    likedByUserName: row.liked_by_name,
                                    likedByImage: row.image_name, 
                                    likedByFirstName: row.first_name, 
                                    likedByLastName:row.last_name,
                                    commentCreated: row.updated
                                }
                            });
                            
         
                            likeCommentOutcome.success = 1;
                            likeCommentOutcome.successMessage = "you liked"
                            likeCommentOutcome.newLike = createdLike;
                            
                            resolve(likeCommentOutcome);
                
                        } else {
                            console.log("Failed to Select the New Like" + err)
                            //res.json({err:err})
                            likeCommentOutcome.errors.push(err)
                            reject(likeCommentOutcome);	
                        }
                    })		
    
                } else {    
                    console.log(err)
                    //res.json({err:err})	
                    likeCommentOutcome.errors.push(err)
                    reject(likeCommentOutcome);
                } 
            }) 
            
        });

    }

    // Method A5: Unlike a Comment
    static async unlikeComment(commentID, currentUser) {
        const connection = db.getConnection(); 
        let removedLike = {};

        let unlikeCommentOutcome = {
            success: 0,
            successMessage: "",
            removedLike: removedLike,
            commentID: commentID,
            currentUser: currentUser,
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                // STEP 1: Get like row to return later
                const getLikeQuery = `
                    SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, 
                        user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name 
                    FROM comment_likes 
                    INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name 
                    WHERE comment_likes.comment_id = ? AND comment_likes.liked_by_name = ?
                    LIMIT 1;
                `;

                connection.query(getLikeQuery, [commentID, currentUser], (err, rows) => {
                    if (err) {
                        unlikeCommentOutcome.errors.push(err);
                        return reject(unlikeCommentOutcome);
                    }

                    if (rows.length === 0) {
                        unlikeCommentOutcome.successMessage = "No like found to remove.";
                        return resolve(unlikeCommentOutcome);
                    }

                    removedLike = rows.map((row) => ({
                        commentLikeID: row.comment_like_id,
                        commentID: row.comment_id,
                        likedByUserName: row.liked_by_name,
                        likedByImage: row.image_name,
                        likedByFirstName: row.first_name,
                        likedByLastName: row.last_name,
                        commentCreated: row.updated
                    }));

                    // STEP 2: Delete the like
                    const deleteQuery = "DELETE FROM comment_likes WHERE comment_id = ? AND liked_by_name = ?";
                    connection.query(deleteQuery, [commentID, currentUser], (delErr, delResult) => {
                        if (delErr) {
                            unlikeCommentOutcome.errors.push(delErr);
                            return reject(unlikeCommentOutcome);
                        }

                        unlikeCommentOutcome.success = 1;
                        unlikeCommentOutcome.successMessage = "you unliked";
                        unlikeCommentOutcome.removedLike = removedLike;

                        return resolve(unlikeCommentOutcome);
                    });
                });
            } catch (err) {
                console.log("Exception in unlikeComment: ", err);
                unlikeCommentOutcome.errors.push(err);
                return reject(unlikeCommentOutcome);
            }
        });
    }


    
    

}

module.exports = Comment;
