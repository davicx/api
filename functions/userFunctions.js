const db = require('./conn');
//const Notification = require('./classes/Notifications');
const User = require('./classes/User')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Get User Profile 
	1) Function A2: Get all Users 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: Get User Profile
function getUserProfile(req, res) {
    const userName = req.params.userName;
	const connection = db.getConnection(); 
	const queryString = "SELECT first_name, last_name FROM user_profile WHERE user_name = ?";

	connection.query(queryString, [userName], (err, rows) => {
		if (!err) {
			const firstName = rows[0].first_name
			const lastName = rows[0].last_name

			const currentUser = {
				userName: userName,
				firstName: firstName,
				lastName: lastName
			}
			res.json(currentUser);
		} else {
			console.log("Failed to Select User: " + err);
		}
	  
	})

}


//Function A2: Get all Users 
function getAllUsers(req, res) {
    const userName = req.params.userName;
	const connection = db.getConnection(); 
	const queryString = "SELECT * FROM user_login WHERE account_deleted = 0";

	connection.query(queryString, [userName], (err, rows) => {
		if (!err) {
			var usersArray = [];

			rows.map((row) => {
                let currentUser = {
                    userID: row.user_id,
                    userName: row.user_name,
                    userEmail: row.user_email,
                	salt: row.salt,
                    pasword: row.password
                }
				usersArray.push(currentUser);
			});

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json(usersArray);
		} else {
			console.log("Failed to Select User: " + err);
		}
	  
	})

}

 
//Function A: Add a Friend 
function addFriend(req, res) {
	const currentUser = req.body.currentUser;
	const friendName = req.body.friendName;

    console.log(currentUser);
    console.log(friendName);

	res.json({addFriend: currentUser + " added a friend named " + friendName});

}

module.exports = { addFriend, getUserProfile, getAllUsers};









//APPENDIX

	//let currentUser = new User(userName);
	//console.log("Your Name Before " + currentUser.firstName + " " + currentUser.lastName);
	//currentUser.getUserInfo();
	//getUserInfo(currentUser);
	//console.log("Your Name After " + currentUser.firstName + " " + currentUser.lastName);
	//res.json({userProfile: "you got your info " + userName}); 
/*

function getUserInfo(currentUser) {
	currentUser.lastName= "Vasq"

}
*/
	



