const db = require('./conn');
//const Notification = require('./classes/Notifications');
const User = require('./classes/User')

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Post Text  

FUNCTIONS B: All Functions Related to Getting Posts
	1) Function B1: Get Posts to a Group

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: Post Text

 
function addFriend(req, res) {
    console.log(req.body.currentUser);
    console.log(req.body.friend);
	const friend = req.body.friend;
	res.json({addFriend: "you added a friend named " + friend});
}

function getUserProfile(req, res) {
    const userName = req.params.userName;
	let currentUser = new User(userName);
	currentUser.getUserInfo();
	
	res.json({userProfile: "you got your info " + userName});
}


module.exports = { addFriend, getUserProfile};




