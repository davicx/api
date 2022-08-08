const db = require('./conn');
//const Notification = require('./classes/Notifications');
const User = require('./classes/User')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Get User Profile 
	2) Function A2: Get Users Friends
	3) Function A3: Get all Users 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: Get User Profile
async function getUserProfile(req, res) {
    const userName = req.params.userName;
	const userProfileResponse = await User.getUserProfile(userName)

	res.json({userProfile: userProfileResponse.userProfile} );
}


//Route B2: Get User Friends  
async function getUserFriends(req, res) {
    const userName = req.params.userName;
	const connection = db.getConnection(); 


	
	/*
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

			res.setHeader('Access-Control-Allow-Origin', '*');
			res.json(friendsArray);
		} else {
			console.log("Failed to Select User: " + err);
		}
	  
	})
	*/

}

 


//Function A3: Get all Users 
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

			//res.setHeader('Access-Control-Allow-Origin', '*');
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

	res.json({addFriend: currentUser + " (Need to do) added a friend named " + friendName});

}

module.exports = { addFriend, getUserProfile, getAllUsers, getUserFriends};









//APPENDIX
/*
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
*/


