const db = require('./../conn');

class Post {
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
        const postID = req.body.postID 
        const commentStatus = 0;
   
        var commentOutcome = {
            outcome: 0,
            postID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO comments (post_id, comment, comment_type, comment_from, comment_deleted) VALUES (?, ?, ?, ?, ?)"

                connection.query(queryString, [postID, commentCaption, commentType, commentFrom, commentStatus], (err, results) => {
                    if (!err) {
                        console.log("You created a new Post with ID " + results.insertId);    
                        commentOutcome.outcome = 200;       
                        commentOutcome.postID = results.insertId;       
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
}


module.exports = Post;

