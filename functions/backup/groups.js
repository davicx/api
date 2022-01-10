const db = require('./conn');
const Group = require('./classes/Group');
const Notification = require('./classes/Notification')
const Requests = require('./classes/Requests');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 
	3) Function A3: Accept Group Invite


FUNCTIONS B: All Functions Related to Groups
	1) Function A1: Create a New Group
	1) Function A2: Invite User to a Group 

*/


//Function A1: Create a New Group
async function createGroup(req, res) {
	var groupOutcome = { groupID: 7}
	var groupUsersOutcome = {}
	var notification = {}

	//STEP 1: Create the Group and Add the New Users
	try {
		groupOutcome = await Group.createGroup(req);

		if(groupOutcome.outcome == 1) {
			groupUsersOutcome = await Group.addGroupUsers(groupOutcome.groupID, req.body.groupUsers, req.body.currentUser);
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

			Notification.createGroupNotification(notification)

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
function addGroupUser(req, res) {
	console.log("Added!")
}

//Function A3: Accept Group Invite
function acceptGroupInvite(req, res) {
	const currentUser = req.body.currentUser;
	const groupID = req.body.groupID;
	const requestID = req.body.requestID;
	Group.acceptGroupInvite(groupID, currentUser, requestID)
	
	res.json({currentUser: currentUser, groupID: groupID});
}


//Function A4: Leave a Group 
function leaveGroup(req, res) {
	const currentUser = req.body.currentUser;
	const groupID = req.body.groupID;
	Group.leaveGroup(currentUser, groupID);
	res.json({leave: "leave"})
}

//Function B1: Get All Groups 
function getAllGroups(req, res) {

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

module.exports = { createGroup, addGroupUser, acceptGroupInvite, getGroup, getGroupUsers, leaveGroup };


