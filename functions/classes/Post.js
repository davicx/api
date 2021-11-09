const db = require('./../conn');

class Post {
    constructor(postID) {
        this.postID = postID;
        this.postFrom = "";
        this.postTo = "";
        this.postCaption = "";
    }
    
    //METHODS A: POST RELATED
    //Method A1: Get Post Info 
    getPostInfo() {
        console.log("Post " + this.postID);

        const queryString = "SELECT post_from, post_to, post_caption FROM posts";

        getConnection().query(queryString, [this.postID], (err, rows, fields) => {
            if (err) {
                console.log("Failed to Select Post: " + err)
                res.sendStatus(500)
                return
            }

            const posts = rows.map((row) => {
                return {
                    postFrom: row.post_from,
                    postTo: row.post_to,
                    postCaption: row.post_caption
                }
            });       
            console.log(posts);          
        }) 
    }

    //Method A2: Make a Text Post
    static async createPostText(req)  {
        const connection = db.getConnection(); 
        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const groupID = req.body.groupID 
        const postCaption = req.body.postCaption 
     
        var postOutcome = {
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
                        postOutcome.outcome = 200;       
                        postOutcome.postID = results.insertId;       
                    } else {    
                        postOutcome.outcome = "no worky"
                        postOutcome.errors.push(err);
                    } 
                    resolve(postOutcome);
                }) 
                
            } catch(err) {
                postOutcome.outcome = "rejected";
                console.log("REJECTED " + err);
                reject(postOutcome);
            } 
        });
    }

    //Method A2: Make a Photo Post
    static async createPostPhoto(req, file)  {
        const connection = db.getConnection(); 
        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const groupID = req.body.groupID 
        const postCaption = req.body.postCaption 
        const photoName = file.filename; 
     
        var postOutcome = {
            outcome: 0,
            postID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption, photo_name) VALUES (?, ?, ?, ?, ?, ?, ?)"
    
                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption, photoName], (err, results, fields) => {
                    if (!err) {
                        console.log("You created a new Post with ID " + results.insertId);    
                        postOutcome.outcome = 200;       
                        postOutcome.postID = results.insertId;       
                    } else {    
                        postOutcome.outcome = "no worky"
                        postOutcome.errors.push(err);
                    } 
                    resolve(postOutcome);
                }) 
                
            } catch(err) {
                postOutcome.outcome = "rejected";
                console.log("REJECTED " + err);
                reject(postOutcome);
            } 
        });
    }
}


module.exports = Post;



