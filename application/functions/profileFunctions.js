const db = require('./conn');
const fileFunctions = require('./fileFunctions');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());


/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Get Simple User Profile
	3) Function A3: Update User Profile
	4) Function A4: Check User Exists
*/


//Function A1: Get User Image
async function getUserImage(userName) {
    const connection = db.getConnection(); 
    
    console.log(" ")
    console.log("______________________________________________")
    console.log("FUNCTION: getUserImage")
    console.log("Getting User Image for " + userName)

    const userProfileImage = {
        message: "",
        success: false,
        userName: userName,
        userProfileImage: null,
        statusCode: 400
    };

    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT user_profile_id, user_id, user_name, image_name, storage_location, cloud_bucket, cloud_key, image_url, file_name, file_name_server FROM user_profile WHERE user_name = ?"
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    if(rows.length >= 1) {
                        const row = rows[0];
                        
                        // Get the image URL using fileFunctions.getImageURL
                        if(row.storage_location && row.image_url) {
                            fileFunctions.getImageURL(row.storage_location, row.image_url, row.cloud_key)
                                .then(imageURL => {
                                    userProfileImage.userProfileImage = imageURL;
                                    userProfileImage.message = "Successfully retrieved user image for " + userName;
                                    userProfileImage.success = true;
                                    userProfileImage.statusCode = 200;
                                    
                                    console.log("userProfileImage")
                                    console.log(userProfileImage)
                                    console.log("userProfileImage")
                                    console.log("______________________________________________")
                                    console.log("______________________________________________")
                                    console.log(" ")
                                    
                                    resolve(userProfileImage);
                                })
                                .catch(error => {
                                    console.log("Error getting image URL for " + userName + ": " + error);
                                    userProfileImage.message = "Error getting image URL for " + userName;
                                    userProfileImage.success = false;
                                    userProfileImage.statusCode = 500;
                                    resolve(userProfileImage);
                                });
                        } else {
                            userProfileImage.message = "No image data found for " + userName;
                            userProfileImage.success = false;
                            userProfileImage.statusCode = 404;
                            resolve(userProfileImage);
                        }
                    } else {
                        userProfileImage.message = "User not found: " + userName;
                        userProfileImage.success = false;
                        userProfileImage.statusCode = 404;
                        resolve(userProfileImage);
                    }
                } else {
                    console.log("Database error: " + err);
                    userProfileImage.message = "Database error occurred";
                    userProfileImage.success = false;
                    userProfileImage.statusCode = 500;
                    resolve(userProfileImage);
                }
            })
        } catch(err) {
            console.log("Catch error: " + err);
            userProfileImage.message = "Unexpected error occurred";
            userProfileImage.success = false;
            userProfileImage.statusCode = 500;
            reject(userProfileImage);
        } 
    })
}

//REMOVE ALL THIS IS HELPER STUFF 

async function getUserProfile(userName) {
    const connection = db.getConnection(); 
    let currentUser = userName;
    console.log(" ")
    console.log("______________________________________________")
    console.log("FUNCTION: getUserProfile")
    console.log("Getting User Profile for " + currentUser)

    var userProfileOutcome = {
	    data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

    //STEP 1: Get User Profile Information
    let getUserProfileOutcome = await Profile.getUserProfile(currentUser);

    const userProfile = {
        userName: getUserProfileOutcome.userProfile.userName,
        userID: getUserProfileOutcome.userProfile.userID,
        userImage: getUserProfileOutcome.userProfile.userImage,
        biography: getUserProfileOutcome.userProfile.biography,
        firstName: getUserProfileOutcome.userProfile.firstName,
        lastName: getUserProfileOutcome.userProfile.lastName
    };

    //console.log("getUserProfile")
    //console.log(getUserProfileOutcome)
    //console.log("getUserProfile")

    if(getUserProfileOutcome.success == true) {
        userProfileOutcome.message = "We got the user profile for " + currentUser;
        userProfileOutcome.success = true;
        userProfileOutcome.statusCode = 200;

        //Get Correct User Image local or aws
        if(functions.compareStrings(getUserProfileOutcome.storageLocation, "aws") == true) {
            console.log("Get AWS Photo")
        } else {
            console.log("Good to go!")     
        }

        userProfileOutcome.data = userProfile;
    }

    console.log("userProfileOutcome")
    console.log(userProfileOutcome)
    console.log("userProfileOutcome")
    console.log("______________________________________________")
    console.log("______________________________________________")
    console.log(" ")
    res.json(userProfileOutcome)
    //res.status(401).json(userProfileOutcome)
}

async function getSimpleUserProfile(userName) {
    const connection = db.getConnection(); 

    var userOutcome = {
        userName: userName,
        userFound: false,
        userID: 0,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT user_name, user_id, image_name, first_name, last_name FROM user_profile WHERE user_name= ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
						userOutcome.userName = rows[0].user_name;
						userOutcome.userID = rows[0].user_id;
						userOutcome.firstName = rows[0].first_name;
						userOutcome.lastName = rows[0].last_name;
						userOutcome.imageName = rows[0].image_name;

						userOutcome.userFound = true;
                    } else {
						userOutcome.errors.push("We couldn't find a user with the name " + userName);
					}

                    resolve(userOutcome); 

                } else {
                    userOutcome.outcome = 500;
                    resolve(userOutcome);
                }
            })
        } catch(err) {
            userIdOutcome.outcome = 500;
            reject(userIdOutcome);
        } 
    })

}

async function updateUserProfile(currentUser, newUserInformation) {
    const connection = db.getConnection(); 

    var userIdOutcome = {
        userName: userName,
        userFound: false,
        userID: 0,
        errors: []
    }


}


module.exports = { getUserProfile, getSimpleUserProfile, updateUserProfile, getUserImage };
