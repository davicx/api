const db = require('./conn');
const Group = require('./classes/Group');
const Notifications = require('./classes/Notification')
const Requests = require('./classes/Requests');
const Functions = require('./functions');
const requestFunctions = require('./requestFunctions')
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 
	3) Function A3: Accept Group Invite
	4) Function A4: Leave a Group 

FUNCTIONS B: All Functions Related to Groups
	1) Function A1: Create a New Group
	1) Function A2: Invite User to a Group 

*/

//Function B1: Get All Groups User is In 
function getUserGroups(req, res, currentUser) {
    const connection = db.getConnection(); 
	console.log("Function: getUserGroups")

	//const queryString = "SELECT * FROM group_users WHERE user_name = ? AND active_member = 1";
	const queryString = "SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1"; 

    connection.query(queryString, [currentUser], (err, rows) => {
		console.log(err)
        if (!err) {
			var groupList = [];
			rows.map((row) => {
                let currentGroup = {
                    groupID: row.group_id,
                    groupName: row.group_name
                }

				groupList.push(currentGroup);
			});

			//res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({groups: groupList} );

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
	/*
	const connection = db.getConnection(); 
	const userName = req.params.userName;

	const queryString = "SELECT group_id FROM group_users WHERE user_name = ? AND active_member = 1";

    connection.query(queryString, [userName], (err, rows) => {
        if (!err) {
			var groupList = [];
			rows.map((row) => {
				groupList.push(row.group_id);
			});

			//res.setHeader('Access-Control-Allow-Origin', '*');
			res.json({groups: groupList} );

        } else {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
		}
    })
	*/
}


//Function A1: Create a New Group
async function createGroup(req, res) {
	var groupOutcome = { groupID: 7}
	var groupUsersOutcome = {}
	var notification = {}
	
	//STEP 1: Create the Group and Add the New Users
	try {
		groupOutcome = await Group.createGroup(req);

		//TO DO: Add individually or the promise wont handle error (in Group Class)
		if(groupOutcome.outcome == 1) {
			groupUsersOutcome = await Group.addNewGroupUsers(groupOutcome.groupID, req.body.groupUsers, req.body.currentUser);
			console.log(groupUsersOutcome);
		} 

		//STEP 2: Add the Notifications and Requests
		if(groupUsersOutcome.outcome == 1) {
			notification = {
				masterSite: "kite",
				notificationFrom: req.body.currentUser,
				notificationMessage: req.body.notificationMessage,
				notificationTo: req.body.groupUsers,
				notificationLink: req.body.notificationLink,
				notificationType: req.body.notificationType,
				groupID: groupOutcome.groupID
			}

			Notifications.createGroupNotification(notification);

			const newRequest = {
				requestType: "new_group",
				requestTypeText: "invited you to join a group",
				sentBy: req.body.currentUser,
				sentTo: req.body.groupUsers,
				groupID: groupOutcome.groupID
			}

			Requests.newGroupRequest(newRequest) 
		}

	} catch(err) {
		console.log(err);
		console.log("were in the catch now!!");
	}
	res.json({groupID: groupOutcome.groupID});
	
}


//Function A2: Invite User to a Group 
async function addGroupUsers(req, res) {
	const connection = db.getConnection(); 
	const groupID = req.body.groupID;
	var invitedUsersRaw = req.body.invitedUsers;
	var invitedUsersArray = Functions.convertElementsLowercase(invitedUsersRaw) 
	var invitedUsers = Functions.removeArrayDuplicates(invitedUsersArray);
	
	//Remove the current user from invitedUsers
	var addGroupUsersOutcome = {
		outcome: 200,
		existingUsers: [],
		addedUsers: [],
		messages: [],
		errors: []
	}

	//STEP 1: Check that there is a group that currently exists
	//MAKE SURE INVITER IS IN THE GROUP!
	const groupStatus = await Functions.checkGroupExists(groupID)

	if(groupStatus.groupExists >= 1) {

		//STEP 2: Check the status of the added users to see if they are already in the group
		const userGroupStatus = await Functions.checkUserGroupStatus(invitedUsers, groupID)

		//STEP 3: Add them to the Group
		var groupUsersToAdd = userGroupStatus.newUsers;
		var addedGroupUsersArray = [];

		for(let i = 0; i < groupUsersToAdd.length; i++) {
			let invitedUser = groupUsersToAdd[i];
			const addGroupUserStatus = await Group.addGroupUser(groupID, invitedUser);
			if(addGroupUserStatus.userAdded == 1) {
				addedGroupUsersArray.push(invitedUser)
			}
			//console.log(addGroupUserStatus);
		} 
		
		//STEP 4: Send Notification and Request to all Added Users 
		const notification = {
			masterSite: "kite",
			notificationFrom: req.body.currentUser,
			notificationMessage: req.body.notificationMessage,
			notificationTo: addedGroupUsersArray,
			notificationLink: req.body.notificationLink,
			notificationType: req.body.notificationType,
			groupID: groupID
		}

		Notifications.createGroupNotification(notification)

		const newRequest = {
			requestType: "group_invite",
			requestTypeText: "invited you to join a group",
			sentBy: req.body.currentUser,
			sentTo: addedGroupUsersArray,
			groupID: groupID
		}

		Requests.newGroupRequest(newRequest) 
		console.log(newRequest);
		addGroupUsersOutcome.addedUsers = addedGroupUsersArray;
		addGroupUsersOutcome.existingUsers = userGroupStatus.existingUsers;
	} else {
		const message = "No users added because this group does not exist"
		addGroupUsersOutcome.messages.push(message);
	}
	
	res.json(addGroupUsersOutcome)

}


//Function A3: Accept Group Invite
async function acceptGroupInvite(req, res) {
	const currentUser = req.body.currentUser;
	const groupID = req.body.groupID;
	const requestID = req.body.requestID;
	console.log(requestID);
	var acceptGroupInviteOutcome = {
		outcome: 200,
		messages: [],
		errors: []
	}
	
	//STEP 1: Check that there is a group that currently exists 
	const groupStatus = await Functions.checkGroupExists(groupID)

	if(groupStatus.groupExists >= 1) {

		//STEP 2: Make sure there is a Request and add the User to the Group 
		const currentRequest = await requestFunctions.getSingleRequest(requestID)

		if(currentRequest.requestExists == 1) {
			
			//Accept the Invite 
			Group.acceptGroupInvite(groupID, currentUser, requestID)

			//Create a Notification to let the Inviter know you have joined the group
			if(currentRequest.request.requestIsPending == 1) {
				const notificationMessage = currentUser + " accepted your Group Invite"
				const notificationLink = "http://localhost:3003/group/" + groupID;
		
				const notification = {
					masterSite: "kite",
					notificationFrom: currentUser,
					notificationMessage: notificationMessage,
					notificationTo: [currentRequest.request.sentBy],
					notificationLink: notificationLink,
					notificationType: "accepted_group_invite",
					groupID: groupID
				}
				//Also prevent notifications from duplicating 
				Notifications.createGroupNotification(notification);
			}

		} else {
			acceptGroupInviteOutcome.outcome = 500;
			acceptGroupInviteOutcome.errors.push("NO request " + requestID + " exists")			
		}

	} else {
		acceptGroupInviteOutcome.outcome = 500;
		acceptGroupInviteOutcome.errors.push("NO group " + groupID + " exists")
	}

	//console.log(acceptGroupInviteOutcome);
	
	
	res.json(acceptGroupInviteOutcome);
}


//Function A4: Leave a Group 
function leaveGroup(req, res) {
	const currentUser = req.body.currentUser;
	const groupID = req.body.groupID;
	Group.leaveGroup(currentUser, groupID);
	res.json({leave: "leave"})
}




//Function B2: Get Single Group by ID 
async function getGroup(req, res) {
	const groupID = req.params.groupID;
	const groupOutcome = await Group.getGroupUsers(groupID);
	Group.getGroup(groupID) 
	console.log(" You got " +  groupID);
	res.json({groupOutcome: groupOutcome});

}


//Function B3: Get Group Users
async function getGroupUsers(req, res) {
	const groupID = req.params.groupID;
	const groupOutcome = await Group.getGroupUsers(groupID);
	console.log(" You got " +  groupID);
	const groupUsers = {
		activeGroupUsers: groupOutcome.groupUsers,
		pendingGroupUsers: groupOutcome.pendingGroupUsers,
	}

	res.json({groupUsers});

}

//module.exports = { createGroup };
module.exports = { createGroup, addGroupUsers, acceptGroupInvite, getUserGroups, getGroup, getGroupUsers, leaveGroup };









//APPENDIX
	//groupUsersOutcome = await Group.addGroupUsers(groupID, groupUsers, currentUser);
/*
			notificationFrom: req.body.postFrom,
			notificationMessage: req.body.notificationMessage,
			notificationTo: groupUsers,
			notificationLink: req.body.notificationLink,
			notificationType: req.body.notificationType,
    "currentUser": "davey",
    "groupID": 79,
    "users": ["Sam", "Frodo", "Merry"],
    "notificationMessage": "Invited you to a new Group",  
    "notificationType": "group_invite",
    "notificationLink": "http://localhost:3003/group/79"  
*/
	//Loop over and use single invite
	//Group.addGroupUser("sam")
	//res.json(groupUsersOutcome)
	//res.json({hi: "hi"})


/*
////
const notification = {
	masterSite: "kite",
	notificationFrom: req.body.currentUser,
	notificationMessage: req.body.notificationMessage,
	notificationTo: req.body.groupUsers,
	notificationLink: req.body.notificationLink,
	notificationType: req.body.notificationType,
	groupID: groupOutcome.groupID
}

Notification.createGroupNotification(notification)

const newRequest = {
	requestType: "new_group",
	requestTypeText: "invited you to join a group",
	sentBy: req.body.currentUser,
	sentTo: req.body.groupUsers,
	groupID: groupOutcome.groupID
}
////
*/

/*
async function checkUserGroupStatus(groupUser, groupID)  {
	const connection = db.getConnection(); 

	var addGroupUsersOutcome = {
		outcome: 200,
		newUsers: [],
		currentUsers: [],
		errors: []
	}

	return new Promise((resolve, reject) => {
		try {
			//const queryString = "SELECT COUNT(*) AS requestCount FROM group_users WHERE user_name = ? AND group_id = ?"
			const queryString = "SELECT user_name FROM group_users WHERE user_name = ? AND group_id = ? LIMIT 1"
	
			connection.query(queryString, [groupUser, groupID], (err, rows) => {
				//console.log(rows[0].requestCount);
				addGroupUsersOutcome.outcome = 200;
				addGroupUsersOutcome.newUsers.push(rows[0].requestCount);
				addGroupUsersOutcome.newUsers.push("ooof");
				addGroupUsersOutcome.newUsers.push("test");
				//console.log(addGroupUsersOutcome);
				//console.log(rows[0].user_name);
				let user = rows[0].user_name;
				resolve(user)
				//resolve(addGroupUsersOutcome)
			}) 
			
			
		} catch (err) {
			addGroupUsersOutcome.outcome = 500;
			addGroupUsersOutcome.errors.push(err);
			reject(addGroupUsersOutcome)
		}	
	})
}
*/

	
	//res.json(addGroupUsersOutcome)
	/*
	var groupStatus;

	try {
		groupStatus = await checkUserGroupStatus(invitedUsers, groupID);
		console.log(groupStatus)
	} catch(err) {
		console.log(err)	
	}
	*/


	/*

	console.log(groupUser);

	return new Promise((resolve, reject) => {
		const queryString = "SELECT COUNT(*) AS requestCount FROM group_users WHERE user_name = ? AND group_id = ?"

		connection.query(queryString, [groupUser, groupID], (err, rows) => {
			if (!err) {
				resolve(rows[0].requestCount);
			} else {    
				reject(err);
				console.log(err)
			} 
		
		}) 

	});
	*/



////
//TYPE 1: Try catch
/*
async function addGroupUser(req, res) {
	const groupID = req.body.groupID;
	const connection = db.getConnection(); 
	const invitedUsers = req.body.invitedUsers;
	const groupUsers = req.body.groupUsers;
	var groupStatus;

	try {
		groupStatus = await checkUserGroupStatus(groupUsers, groupID);
		console.log(groupStatus)
	} catch(err) {
		console.log(err)	
	}

	res.json({hi:"hi"})
}

async function checkUserGroupStatus(groupUsers, groupID)  {
	return new Promise((resolve, reject) => {
		if(1 == 2) {
			resolve('data');
		} else {
			reject('some error')
		}
	});
}
*/

//TYPE 2: Try catch in Promise
/*
async function addGroupUser(req, res) {
	const groupID = req.body.groupID;
	const connection = db.getConnection(); 
	const invitedUsers = req.body.invitedUsers;
	const groupUsers = req.body.groupUsers;
	var groupStatus;

	groupStatus = await checkUserGroupStatus(groupUsers, groupID);
	console.log(groupStatus)

	res.json({hi:"hi"})
}

async function checkUserGroupStatus(groupUsers, groupID)  {
	return new Promise((resolve, reject) => {

		try {
			resolve('data');
		} catch(err) {
			reject('some error')	
		}
	});
}
*/

////

	/*
	const groupUser = invitedUsers[0];
	var groupStatus = {
		outcome: 200,
		newUsers: []
	}

	try {
		for(let i = 0; i < invitedUsers.length; i++) {
			let invitedUser = invitedUsers[i];
			let user = await checkUserGroupStatus(invitedUser, groupID);
			console.log(user);
			groupStatus.newUsers.push(user);
		}
		
		res.json(groupStatus)	
		//groupStatus = await checkUserGroupStatus(invitedUsers, groupID);
		//res.json(groupStatus)
	} catch(err) {
		console.log(err)	
		res.json(groupStatus)
	}
	*/


