const db = require('./conn');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to User
	1) Function A1: Get Simple User Information  
	2) Function A2: Get User ID from Username 
	3) Function A2: Get all User Friends


*/


//Function A1: Get Simple User Information 
async function getUserInformation(userName) {
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


//Function A2: Get User ID from Username
async function getUserID(userName) {
    const connection = db.getConnection(); 

    var userIdOutcome = {
        userName: userName,
        userFound: false,
        userID: 0,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT user_name, user_id, account_deleted FROM user_login WHERE user_name= ?"			
            
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
						userIdOutcome.userID = rows[0].user_id;
						userIdOutcome.userFound = true;
                    } else {
						userIdOutcome.errors.push("We couldn't find a user with the name " + userName);
					}

                    resolve(userIdOutcome); 

                } else {
                    userIdOutcome.outcome = 500;
                    resolve(userIdOutcome);
                }
            })
        } catch(err) {
            userIdOutcome.outcome = 500;
            reject(userIdOutcome);
        } 
    })

}


module.exports = { getUserInformation, getUserID };
