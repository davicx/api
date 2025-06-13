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
    static async getUserProfile(userName) { 
        const connection = db.getConnection(); 
        const queryString = "SELECT * FROM user_profile WHERE user_name = ?";
    
        console.log("CLASS: Profile.getUserProfile for " + userName)
    
        var userProfileOutcome = {
            success: false,
            errors: [],
            userFound: false
        };   
        
        return new Promise((resolve, reject) => {
            try {
                connection.query(queryString, [userName], (err, rows) => {
                    if (err) {
                        console.log("Error querying user profile:", err);
                        userProfileOutcome.errors.push("DB error");
                        userProfileOutcome.errors.push(err);
                        return resolve(userProfileOutcome);
                    }
    
                    if (!rows || rows.length === 0) {
                        // No user found
                        console.log("No user found for", userName);
                        
                        const userProfile = {
                            userName: "row.user_name",
                            userID: "row.user_id",
                            userImage: "row.image_url",
                            biography: "row.biography",
                            storageLocation: "row.storage_location",
                            cloudBucket: "row.cloud_bucket",
                            cloudKey: "cloud_key",
                            firstName: "row.first_name",
                            lastName: "row.last_name",
                            fileName: "row.file_name",
                            fileNameServer: "row.file_name_server"
                        };
        
                        userProfileOutcome.userProfile = userProfile;
                        userProfileOutcome.message = "User not found";
                        userProfileOutcome.userFound = false;
                        return resolve(userProfileOutcome);
                    }
    
                    // User found
                    const row = rows[0];
                    const userProfile = {
                        userName: row.user_name,
                        userID: row.user_id,
                        userImage: row.image_url,
                        biography: row.biography,
                        storageLocation: row.storage_location,
                        cloudBucket: row.cloud_bucket,
                        cloudKey: row.cloud_key,
                        firstName: row.first_name,
                        lastName: row.last_name,
                        fileName: row.file_name,
                        fileNameServer: row.file_name_server
                    };
    
                    userProfileOutcome.userProfile = userProfile;
                    userProfileOutcome.success = true;
                    userProfileOutcome.userFound = true;
    
                    return resolve(userProfileOutcome);
                });
            } catch (err) {
                console.log("Caught exception in getUserProfile:", err);
                userProfileOutcome.errors.push("Unexpected error");
                userProfileOutcome.errors.push(err);
                return resolve(userProfileOutcome);
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
                const queryString = "UPDATE user_profile SET first_name = ?, last_name = ?, biography = ? WHERE user_name = ?";	
        
                connection.query(queryString, [updatedUser.firstName, updatedUser.lastName, updatedUser.biography, 
                    updatedUser.currentUser], (err, rows) => {

                    if (!err) {
                        console.log("CLASS: Profile Status: Success")
                        updateUserProfileStatus.success = true;
                        resolve(updateUserProfileStatus); 
                    } else {
                        console.log("CLASS: Profile Status: Error")
                        console.log(err)
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

    //Method A4: Update Full User Profile 
    static async updateFullUserProfile(updatedUser){ 
        const connection = db.getConnection(); 

        var updateUserProfileStatus = {
            success: false,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {	
                const queryString = "UPDATE user_profile SET first_name = ?, last_name = ?, biography = ?, storage_location = ?, cloud_bucket = ?, cloud_key = ?, image_url = ?, file_name = ?, file_name_server = ? WHERE user_name = ?";	
        
                connection.query(queryString, [updatedUser.firstName, updatedUser.lastName, updatedUser.biography, 
                    updatedUser.storageLocation, updatedUser.cloudBucket, updatedUser.cloudKey, updatedUser.imageURL, updatedUser.fileName, updatedUser.fileNameServer, 
                    updatedUser.currentUser], (err, rows) => {

                    if (!err) {
                        console.log("CLASS: Profile Status: Success")
                        updateUserProfileStatus.success = true;
                        resolve(updateUserProfileStatus); 
                    } else {
                        console.log("CLASS: Profile Status: Error")
                        console.log(err)
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