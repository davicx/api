const db = require('../functions/conn');

const searchFunctions = require('../functions/searchFunctions');
/*
const Group = require('../functions/classes/Group');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions');
const requestFunctions = require('../functions/requestFunctions');
const notifications = require('./notifications');
const Friend = require('../functions/classes/Friend');
*/
/*
FUNCTIONS A: All Functions Related to Searching for Friends 
	1) Function A1: Search for your Active Friends 
	2) Function A2: Search for a Group

*/

//FUNCTIONS A: All Functions Related to Searching for Friends 
//Function A1: Search for your Active Friends 
async function searchActiveFriends(req, res) {
    const currentUser = req.params.user_name;
    const searchString = req.params.search_string;

	if(searchString == "") {
		console.log("no search")
	} else {
		console.log("ok search")
	}
    
	console.log(searchString)

    var activeFriendListOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

    var activeFriendList = await searchFunctions.searchActiveFriendList(currentUser, searchString);
  
    if(activeFriendList.success == true) {
        activeFriendListOutcome.data = activeFriendList.friendsArray
        activeFriendListOutcome.message = activeFriendList.friendsArray.length
        activeFriendListOutcome.success = true;
        activeFriendListOutcome.statusCode = 200;
    }
    
    res.json(activeFriendListOutcome)

}

//Function A2: Search for a Group
async function searchGroups(req, res) {
    const currentUser = req.params.user_name;
    const searchString = req.params.search_string;
    
    var searchGroupsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

    
    res.json(searchGroupsOutcome)

}

module.exports = { searchActiveFriends, searchGroups }
