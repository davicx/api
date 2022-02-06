const db = require('./../conn');

class User {
    constructor(userName) {
        this.userName = userName;
        this.firstName = "";
        this.lastName = "";
    }
    

    //METHODS A: USER RELATED
  //Method A1: Register User 
  static async registerUserLogin(newUser) {
    const connection = db.getConnection(); 
    var registerUserOutcome = {
        outcome: "",
        userID: 0,
        errors: []
    }
    const password = newUser.password
    console.log(password)

    //INSERT USER
    return new Promise(async function(resolve, reject) {
        try {
            //    $sql = 'INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)';
            const queryString = "INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)"

            //connection.query(queryString, [newUser.userName, newUser.userEmail, newUser.salt, newUser.hashedPassword], (err, results) => {
            connection.query(queryString, [newUser.userName, newUser.userEmail, newUser.salt, password], (err, results) => {
                if (!err) {
                    console.log("You created a new User with ID " + results.insertId);    
                    registerUserOutcome.outcome = 200;       
                    registerUserOutcome.userID = results.insertId;    

                } else {    
                    registerUserOutcome.outcome = "no worky"
                    registerUserOutcome.errors.push(err);
                } 
                resolve(registerUserOutcome);
            }) 
            
        } catch(err) {
            registerUserOutcome.outcome = "rejected";
            console.log("REJECTED " + err);
            reject(registerUserOutcome);
        } 
    });
  }


  static async registerUserProfile(newUser) {
    console.log("you registered! " + newUser.userName)

    
  }
    /*
  //METHODS A: POST RELATED
    //Method A1: Make a Text Post
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

    */
    //Method A1: Get User Info 
    async getUserInfo() {
        this.lastName = "v"
 
        const connection = db.getConnection(); 
        console.log("getUserInfo " + this.userName);
        
        const queryString = "SELECT first_name, last_name FROM user_profile WHERE user_name = ?";

        connection.query(queryString, [this.userName], (err, rows, fields) => {
            if (!err) {
                this.firstName = rows[0].first_name
                this.lastName = rows[0].last_name
                //console.log("_________________")        
                //.log(user.firstName + " " + user.lastName);     
                console.log("from server " + rows[0].first_name + " " + rows[0].last_name);     
                //console.log();     
                //console.log("_________________")     
                //res.sendStatus(500)
                //return
            } else {
                console.log("Failed to Select User: " + err);
            }
        })
    }


}

module.exports = User;