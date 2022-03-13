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
            const queryString = "INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)"
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

    //INSERT USER PROFILE 
    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "INSERT INTO user_profile (user_name, user_id, image_name, root_folder, biography, first_name, last_name, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
           connection.query(queryString, [newUser.userName, newUser.userID, bilboImage, rootFolder, biography, firstName, lastName, newUser.userEmail], (err, results) => {
                if (!err) {
                    console.log("You created a new User with ID " + results.insertId);    
                    registerUserProfileOutcome.message = "you sucesfully registered " + newUser.userName + "!";       
                    registerUserProfileOutcome.outcome = 200;       

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

    //Method A1: Get User Info 
    static async getUserInfo(userName) { 
        const connection = db.getConnection(); 
        console.log("Hiya!!" + userName)
    }

    //Method A2: Get User Login Info
    static async getUserInfo(userName) { 
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