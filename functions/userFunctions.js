const db = require('./conn');
//const Notification = require('./classes/Notifications');
const User = require('./classes/User')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Get User Profile 

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

 
//Function A2: Add a Friend 
function addFriend(req, res) {
	const currentUser = req.body.currentUser;
	const friendName = req.body.friendName;

    console.log(currentUser);
    console.log(friendName);

	res.json({addFriend: currentUser + " added a friend named " + friendName});

}

module.exports = { addFriend, getUserProfile};









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
	



