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
    const salt = newUser.salt

    //INSERT USER
    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)"
           connection.query(queryString, [newUser.userName, newUser.userEmail, salt, password], (err, results) => {
            console.log(err)
                if (!err) {
                    console.log("You created a new User with ID " + results.insertId);    
                    registerUserOutcome.outcome = 1;       
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
    const connection = db.getConnection(); 
    var registerUserProfileOutcome = {
        outcome: "",
        message: "",
        errors: []
    }
 
    const biography = "They are (or were) a little people, about half our height, and smaller than the bearded dwarves"
    const bilboImage = "frodo.jpg"
    const rootFolder = newUser.userName
    const firstName = newUser.fullName
    const lastName = newUser.fullName
    const university = "osu"
    const postView = ""

    //INSERT USER PROFILE 
    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "INSERT INTO user_profile (user_name, user_id, image_name, root_folder, biography, university, post_view, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
           connection.query(queryString, [newUser.userName, newUser.userID, bilboImage, rootFolder, biography, university, postView, firstName, lastName, newUser.userEmail], (err, results) => {
                if (!err) {
                    console.log("You created a new User with ID " + results.insertId);    
                    registerUserProfileOutcome.message = "you sucesfully registered " + newUser.userName + "!";       
                    registerUserProfileOutcome.outcome = 1;       

                } else {    
                    registerUserProfileOutcome.outcome = "no worky"
                    registerUserProfileOutcome.errors.push(err);
                } 
                resolve(registerUserProfileOutcome);
            }) 
            
        } catch(err) {
            registerUserProfileOutcome.outcome = "rejected";
            console.log("REJECTED " + err);
            reject(registerUserProfileOutcome);
        } 
    });
  }

    //Method A4: Get User Friends 
    static async getUserFriends(userName) { 
        const connection = db.getConnection(); 
        const queryString = "SELECT user_id, image_name, first_name, last_name FROM user_profile WHERE user_name = ?";

        var userProfileOutcome = {
            status: 500,
            errors: [],
        }   
        
        return new Promise(async function(resolve, reject) {
            try {
                
                connection.query(queryString, [userName], (err, rows) => {
                    
                    if (!err) {
                        rows.map((row) => {
                            console.log(row)
                        }); 

                        const userProfile = {
                            userName: userName,
                            userID: rows[0].user_id,
                            userImage: rows[0].image_name,
                            firstName: rows[0].first_name,
                            lastName: rows[0].last_name
                        }

                        userProfileOutcome.userProfile = userProfile;
                        userProfileOutcome.status = 200; 
 
                    } else {
                        console.log("error getting user profile")    
                        userProfileOutcome.errors.push("no worky")
                        userProfileOutcome.errors.push(err);
                    } 
                    
                    resolve(userProfileOutcome);
                }) 
                
            } catch(err) {
                console.log("catch error getting group users")    
                userProfileOutcome.errors.push("no worky")
                userProfileOutcome.errors.push(err);
                reject(userProfileOutcome);
            } 
        });
        
        /*
        ADD THIS CODE TO THE ABOVE 
	const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.friend_id, friends.request_pending, user_login.user_name, user_login.user_id, user_login.account_deleted FROM user_login INNER JOIN friends ON user_login.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND user_login.account_deleted = 0"

	connection.query(queryString, [userName], (err, rows) => {
		if (!err) {
			var friendsArray = [];
			var friendCount = 0;

			rows.map((row) => {
                let currentUser = {
                    friendUserName: row.friend_user_name,
                    friendID: row.friend_id,
					friendCount: friendCount
                }
				friendCount = friendCount + 1;

				friendsArray.push(currentUser);
			});

			//res.setHeader('Access-Control-Allow-Origin', '*');
			res.json(friendsArray);
		} else {
			console.log("Failed to Select User: " + err);
		}
	  
	})
        */
    }

    //Method A1: Get User Info 
    static async getUserInfo(userName) { 
        const connection = db.getConnection(); 
        console.log("Hiya!!" + userName)
    }
    
    //Method A1: Get User Profile Info 
    static async getUserProfile(userName){ 
        const connection = db.getConnection(); 
        const queryString = "SELECT user_id, image_name, first_name, last_name FROM user_profile WHERE user_name = ?";

        var userProfileOutcome = {
            status: 500,
            errors: [],
        }   
        
        return new Promise(async function(resolve, reject) {
            try {
                
                connection.query(queryString, [userName], (err, rows) => {
                    
                    if (!err) {
                        rows.map((row) => {
                            console.log(row)
                        }); 

                        const userProfile = {
                            userName: userName,
                            userID: rows[0].user_id,
                            userImage: rows[0].image_name,
                            firstName: rows[0].first_name,
                            lastName: rows[0].last_name
                        }

                        userProfileOutcome.userProfile = userProfile;
                        userProfileOutcome.status = 200; 
 
                    } else {
                        console.log("error getting user profile")    
                        userProfileOutcome.errors.push("no worky")
                        userProfileOutcome.errors.push(err);
                    } 
                    
                    resolve(userProfileOutcome);
                }) 
                
            } catch(err) {
                console.log("catch error getting group users")    
                userProfileOutcome.errors.push("no worky")
                userProfileOutcome.errors.push(err);
                reject(userProfileOutcome);
            } 
        });
    }
     
    //Method A2: Get User Login Info 
    static async getUserLoginInfo(userName) {  
        const connection = db.getConnection(); 
        const queryString = "SELECT user_id, salt, password FROM user_login WHERE user_name = ?";

        var currentUser = { userName: userName}

        var userLoginOutcome = {
            status: 500,
            currentUser: currentUser,
            errors: [],
        }   
        
        return new Promise(async function(resolve, reject) {
            try {
                
                connection.query(queryString, [userName], (err, rows) => {
                    
                    if (!err) {
                        rows.map((row) => {
                            console.log(row)
                        }); 
                        userLoginOutcome.currentUser.userID = rows[0]
                        userLoginOutcome.currentUser.salt = rows[1]
                        userLoginOutcome.currentUser.password = rows[2]
                        userLoginOutcome.status = 200; 
 
                    } else {
                        console.log("error getting group users")    
                        userLoginOutcome.errors.push("no worky")
                        userLoginOutcome.errors.push(err);
                    } 
                    
                    resolve(userLoginOutcome);
                }) 
                
            } catch(err) {
                console.log("catch error getting group users")    
                userLoginOutcome.errors.push("no worky")
                userLoginOutcome.errors.push(err);
                reject(groupUsersResponse);
            } 
        });
    }
}

module.exports = User;