const mysql = require('mysql')

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
        //console.log("Post " + this.postID + " " + postFrom + " " + postTo);
        console.log("Post " + this.postID);
        //const queryString = "SELECT post_from, post_to, post_caption FROM posts WHERE post_id = ?";
        const queryString = "SELECT post_from, post_to, post_caption FROM posts";

        getConnection().query(queryString, [this.postID], (err, rows, fields) => {
            if (err) {
                console.log("Failed to Select Post: " + err)
                res.sendStatus(500)
                return
            }
            //console.log(post)
            const posts = rows.map((row) => {
                return {
                    postFrom: row.post_from,
                    postTo: row.post_to,
                    postCaption: row.post_caption
                }
            });
            console.log("_________________")
            console.log(posts.length);          
            console.log(posts);          
            console.log("_________________")

        })
    
    }

    //Method A2: Get User Info 
    static postText(caption)  {
        console.log("You made a post! " + caption);
        
        return 777;
    }
}

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})

//Functions: Get Connection
function getConnection() {
    return pool;
}

module.exports = Post;


/*

            
 
            //Output Data
            const users = rows.map((row) => {
                return {
                    userName: row.user_name,
                    email: row.email,
                    firstName: row.first_name,
                    lastName: row.last_name
                }
            });

            res.json(rows);
            res.end()
 
class Post {
    constructor(postID) {
        this.postID = postID;

    }

    get postFrom() {
        return this.postFrom;
    }

    set postFrom(postFrom) {
        this.postFrom = postFrom;
    }    
   
}
 
module.exports = Post;
 
 

class Post {
    constructor(postInput) {
        this.post = postInput.post || 1;
        this.post_from = postInput.post_from || '';
        this.post_to = postInput.post || '';
        this.post_caption = postInput.post_caption || '';

    }

    get post() {
        return this.post;
    }



    get post_from () {
        return this.post_from;
    }

    set post_from(post_from) {
        this.post_from = post_from;
    }

    get post_caption () {
        return this.post_caption;
    }

    set post_caption(post_caption) {
        this.post_caption = post_caption;
    }

      //Method A1: Get User Info 
    getPostInfo() {
        console.log("Hiya Davey!");
    }
  

}

*/
//const Post = require('../../model/config-group');

//let currentPost = new Post(postInput);
 