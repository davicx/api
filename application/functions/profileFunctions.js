const db = require('./conn');
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

//REMOVE ALL THIS IS HELPER STUFF 

//Function A1: Get User Profile
async function getUserProfile(userName) {
    const connection = db.getConnection(); 

    //STEP 1: User Profile Class to get information
    console.log("getUserProfile")

}

//Function A2: Get Simple User Profile
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

//Function A3: Update User Profile
async function updateUserProfile(currentUser, newUserInformation) {
    const connection = db.getConnection(); 

    var userIdOutcome = {
        userName: userName,
        userFound: false,
        userID: 0,
        errors: []
    }


}


module.exports = { getUserProfile, getSimpleUserProfile, updateUserProfile };
