const db = require('./conn');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to User
	1) Function A1: Get User ID from Username
	1) Function A2: Get all User Friends

*/



//Function A1: Get User ID from Username
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


module.exports = { getUserID };
