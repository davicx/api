const db = require('./../conn');


/*
FUNCTIONS A: PROFILE RELATED
	1) Method A1: Get User Info 

*/
class Profile {
    constructor(userName) {
        this.userName = userName;
        this.firstName = "";
        this.lastName = "";
    }
    

    //METHODS A: PROFILE RELATED
    //Method A1: Get User Profile Info 
    static async getUserProfile(userName){ 
        const connection = db.getConnection(); 
        const queryString = "SELECT user_id, user_name, image_name, first_name, last_name FROM user_profile WHERE user_name = ?";

        var userProfileOutcome = {
            success: false,
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
                            userName: rows[0].user_name,
                            userImage: rows[0].image_name,
                            firstName: rows[0].first_name,
                            lastName: rows[0].last_name
                        }

                        userProfileOutcome.userProfile = userProfile;
                        userProfileOutcome.success = true; 
 
                    } else {
                        console.log("error getting user profile")    
                        userProfileOutcome.errors.push("no worky")
                        userProfileOutcome.success = false; 
                        userProfileOutcome.errors.push(err);
                    } 
                    
                    resolve(userProfileOutcome);
                }) 
                
            } catch(err) {
                console.log("catch error getting group users")    
                userProfileOutcome.errors.push("no worky")
                userProfileOutcome.success = false; 
                userProfileOutcome.errors.push(err);
                reject(userProfileOutcome);
            } 
        });
    }
     
    //Method A2: Get Simple Profile Info 
    static async getSimpleUserProfile(userName){ 
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

    //Method A3: Update User Profile 
    static async updateUserProfile(updatedUser){ 
        const connection = db.getConnection(); 

        var updateUserProfileStatus = {
            success: false,
            errors: []
        }
    
        return new Promise(async function(resolve, reject) {
            try {	
                const queryString = "UPDATE user_profile SET image_name = ?, first_name = ?, last_name = ?, biography = ? WHERE user_name = ?";	
        
                connection.query(queryString, [updatedUser.imageName, updatedUser.firstName, updatedUser.lastName, updatedUser.biography, updatedUser.currentUser], (err, rows) => {
                    if (!err) {
                        console.log("CLASS: Profile Status: Success")
                        updateUserProfileStatus.success = true;
                        resolve(updateUserProfileStatus); 
                    } else {
                        console.log("CLASS: Profile Status: Error")
                        updateUserProfileStatus.errors.push(err);
                        resolve(updateUserProfileStatus);
                    }
                })
            } catch(err) {
                console.log("CLASS: Profile Status: Catch Error")
                updateUserProfileStatus.errors.push(err);
                reject(updateUserProfileStatus);
            } 
        })
    }

}

module.exports = Profile;