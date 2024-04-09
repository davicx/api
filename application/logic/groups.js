const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notifications = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const requestFunctions = require('../functions/requestFunctions')
const groupFunctions = require('../functions/groupFunctions')


/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 
	3) Function A3: Accept Group Invite
	4) Function A4: Leave a Group 
	5) Function A5: Get All Groups User is In 
	6) Function A6: Get Single Group by ID 
	7) Function A7: Get Group Users
*/

//Function A1: Create a New Group
async function createGroup(req, res) {
	const connection = db.getConnection(); 
	var currentUser = req.body.currentUser; 
	var groupName = req.body.groupName
	var groupType = req.body.groupType; 
	var groupPrivate = req.body.groupPrivate;

	//New Group Users 
	var newGroupUsersRaw = req.body.groupUsers;
	var newGroupUsersClean = Functions.cleanUserNameArray(newGroupUsersRaw)
	var newGroupUsers = Functions.removeArrayDuplicates(newGroupUsersClean)

	//Response Outcomes 
	var groupOutcome = {}
	var groupUsersOutcome = {}
	var notification = {}

    var newGroupOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	try {
		groupOutcome = await Group.createGroup(currentUser, groupName, groupType, groupPrivate);

		//STEP 1: Create the Group
		if(groupOutcome.outcome == 1) {
			console.log("STEP 1: You succesfully created a new group with Group ID " + groupOutcome.groupID);
		} else {
			console.log("STEP 1: There was an error creating the group");
			console.log(groupOutcome.errors);
            newGroupOutcome.message("STEP 1: There was an error creating the group")
            newGroupOutcome.errors = groupOutcome.errors;
			res.status(500).json(newGroupOutcome);
			return 
		}

		//STEP 2: Add all the users to the new group
		var groupUsersOutcome = await Group.addNewGroupUsers(groupOutcome.groupID, newGroupUsers, currentUser);
		
		if(groupUsersOutcome.outcome == 1) {
			console.log("STEP 2: You succesfully added the new users");
		} else {
			console.log("STEP 2: There was an error adding the new users");
			console.log(groupUsersOutcome.errors);
            newGroupOutcome.message("STEP 2: There was an error adding the new users")
            newGroupOutcome.errors = groupOutcome.errors;
			res.status(500).json(newGroupOutcome);
			return 
		}


		//STEP 3: Add the Notifications
		console.log("STEP 3: Adding Group Notifications");
		notification = {
			masterSite: "kite",
			notificationFrom: req.body.currentUser,
			notificationMessage: req.body.notificationMessage,
			notificationTo: newGroupUsers,
			notificationLink: req.body.notificationLink,
			notificationType: req.body.notificationType,
			groupID: groupOutcome.groupID
		}
		
		Notifications.createGroupNotification(notification);


		//STEP 4: Add the Requests
		console.log("STEP 4: Adding Group Requests");
		const newRequest = {
			requestType: "new_group",
			requestTypeText: "invited you to join a group",
			sentBy: req.body.currentUser,
			sentTo: newGroupUsers,
			groupID: groupOutcome.groupID
		}

		Requests.newGroupRequest(newRequest) 

	} catch(err) {
		console.log(err);
		console.log("were in the catch now!!");
        newGroupOutcome.message("were in the catch now!")
        newGroupOutcome.errors.push(err)
        res.status(500).json(newGroupOutcome);
		return 
	}

	//STEP 5: Succesfully created the new group
	console.log("STEP 5: Succesfully created the new group, yay!");

    newGroupOutcome.data = {
        groupName: groupName, 
        groupID: groupOutcome.groupID, 
        groupMembers: [req.body.currentUser],
        pendingGroupMembers: groupUsersOutcome.pendingUsers,
    };

	newGroupOutcome.success = true;
    newGroupOutcome.message = "Succesfully created the new group, yay!"
    newGroupOutcome.statusCode = 200;
	
	res.json(newGroupOutcome)
	//res.status(500).json({no:"oh no!"});
}

//Function A2: Invite User to a Group 
async function addGroupUsers(req, res) {
	const connection = db.getConnection(); 
	const groupID = req.body.groupID;
	var invitedUsersRaw = req.body.invitedUsers;
	//var invitedUsersArray = Functions.convertElementsLowercase(invitedUsersRaw) 
	var invitedUsersArray = Functions.cleanUserNameArray(invitedUsersRaw) 
	var invitedUsers = Functions.removeArrayDuplicates(invitedUsersArray);
	
	//Remove the current user from invitedUsers
	var addGroupUsersOutcome = {
		data: {},
		success: false,
		statusCode: 500,
		message: "",
		errors: [],
		currentUser: req.body.currentUser
	}

	//STEP 1: Check that there is a group that currently exists
	const groupStatus = await groupFunctions.checkGroupExists(groupID)

	if(groupStatus.groupExists >= 1) {

		//STEP 2: Check the status of the added users to see if they are already in the group
		const userGroupStatus = await groupFunctions.checkUserGroupStatus(invitedUsers, groupID)

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
		addGroupUsersOutcome.success = true;
		addGroupUsersOutcome.statusCode = 200;
		addGroupUsersOutcome.message = "You added users to the group";
		addGroupUsersOutcome.data.addedUsers = addedGroupUsersArray;
		addGroupUsersOutcome.data.existingUsers = userGroupStatus.existingUsers;
			
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
		console.log("STEP 1: Check that there is a group that currently exists groupStatus.groupExists =" + groupStatus.groupExists);

		//STEP 2: Make sure there is a Request and add the User to the Group 
		const currentRequest = await requestFunctions.getSingleRequest(requestID)

		if(currentRequest.requestExists == 1) {
			console.log("STEP 2: There is a Request that matches the one sent")
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
			console.log("STEP 2: This request was not found in the database")

			acceptGroupInviteOutcome.outcome = 500;
			acceptGroupInviteOutcome.errors.push("NO request " + requestID + " exists")			
		}

	} else {
		console.log("STEP 1: No Group Exists with this group Number");
		acceptGroupInviteOutcome.outcome = 500;
		acceptGroupInviteOutcome.errors.push("NO group " + groupID + " exists")
	}

	//console.log(acceptGroupInviteOutcome);
	
	
	res.json(acceptGroupInviteOutcome);
}

//Function A4: Leave a Group 
async function leaveGroup(req, res) {
	const currentUser = req.body.currentUser;
	const groupID = req.body.groupID;


	var leaveGroupOutcome = {
		leaveGroupID: groupID,
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

	//STEP 1: Check if user is in group
	var userInGroupStatus = await groupFunctions.checkUserInGroup(currentUser, groupID);
	console.log(userInGroupStatus)

	//STEP 2: Remove User
	//Step 2A: The User was in the group and removed 
	if(userInGroupStatus.userInGroup == true) {
		var leaveGroupStatus = await Group.leaveGroup(currentUser, groupID);

		if(leaveGroupStatus.errors.length == 0) {
			leaveGroupOutcome.message = currentUser + " was sucesfully removed from the group"
			leaveGroupOutcome.success = true;
			leaveGroupOutcome.statusCode = 200;
		}

	//Step 2B: The user was not in the group so no action was taken 
	} else {
		leaveGroupOutcome.message = currentUser + " was not in the group"
		leaveGroupOutcome.success = true;
		leaveGroupOutcome.statusCode = 200;
	}
	
	res.json(leaveGroupOutcome)

}

//Function A5: Get All Groups User is In 
function getUserGroups(req, res) {
    const connection = db.getConnection(); 
	const currentUser = req.authorizationData.currentUser;
	console.log("getUserGroups: This was the decoded user from the token")
    console.log(req.currentUser)
	console.log("getUserGroups")
	//console.log("File: groupFunctions Function: getUserGroups")

	const queryString = "SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1"; 

    connection.query(queryString, [currentUser], (err, rows) => {
        if (!err) {
			var groupList = [];
			rows.map((row) => {
                let currentGroup = {
                    groupID: row.group_id,
                    groupName: row.group_name
                }

				groupList.push(currentGroup);
			});

			res.json({groups: groupList} );

        } else {
            console.log("Failed to Select Post")
            console.log(err)
            res.sendStatus(500)
            return
		}
    })

}

//Function A6: Get Single Group by ID 
async function getGroup(req, res) {
	const groupID = req.params.groupID;
	const groupOutcome = await Group.getGroupUsers(groupID);
	Group.getGroup(groupID) 
	console.log(" You got " +  groupID);
	res.json({groupOutcome: groupOutcome});

}

//Function A7: Get Group Users
async function getGroupUsers(req, res) {
	const groupID = req.params.groupID;
	const groupOutcome = await Group.getGroupUsers(groupID);
	console.log(" You got " +  groupID);

    var groupUsersOutcome = {
		data: {},
		message: "", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: req.body.currentUser
	}

	const groupUsers = {
		groupID: groupID,
		activeGroupUsers: groupOutcome.groupUsers,
		pendingGroupUsers: groupOutcome.pendingGroupUsers,
	}

	groupUsersOutcome.data = groupUsers;

	res.json(groupUsersOutcome);

}

module.exports = { createGroup, addGroupUsers, acceptGroupInvite, getUserGroups, getGroup, getGroupUsers, leaveGroup };


