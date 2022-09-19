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
    static async createComment(req)  {
        const connection = db.getConnection(); 

        const masterSite = req.body.masterSite 
        const commentCaption = req.body.commentCaption 
        const commentType = req.body.commentType 
        const commentFrom = req.body.commentFrom 
        const commentTo = req.body.commentTo 
        const groupID = req.body.groupID 
        const postID = req.body.postID 
        const listID = req.body.listID 


        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 

        const postCaption = req.body.postCaption 
     
        var commentOutcome = {
            outcome: 0,
            postID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?, ?)"
    
                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption], (err, results, fields) => {
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

