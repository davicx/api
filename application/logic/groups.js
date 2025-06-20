const db = require('../functions/conn');

const Group = require('../functions/classes/Group');
const Notifications = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const requestFunctions = require('../functions/requestFunctions')
const groupFunctions = require('../functions/groupFunctions');
const { S3Outposts } = require('aws-sdk');

const uploadFunctions = require('../functions/uploadFunctions');
const cloudFunctions = require('../functions/cloudFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_GROUPS_BUCKET_NAME

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')


/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Get Groups for a User
	3) Function A3: Invite User to a Group 
	4) Function A4: Accept Group Invite
	5) Function A5: Leave a Group 
	6) Function A6: Get All Groups User is In 
	7) Function A7: Get Single Group by ID 
	8) Function A8: Get Group Users
	9) Function A9: Update Group Information
*/

//Function A1: Create a New Group (local to local)
async function createGroup(req, res) {
	const connection = db.getConnection(); 

	//Handle Upload 
	uploadFunctions.uploadGroupPhotoLocal(req, res, async function (err) {	
		var currentUser = req.body.currentUser; 
		var groupName = req.body.groupName
		var groupType = req.body.groupType; 
		var groupPrivate = req.body.groupPrivate;
		
		var headerMessage = "New Group created by " + currentUser
		console.log(headerMessage);

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

		newGroupOutcome.data = {
			groupName: "groupName", 
			groupImage: "groupImage",
			groupID: "groupID", 
			groupMembers: [""],
			pendingGroupMembers: [""],
		};

		//STEP 1: Get Group Users from the Input Form 
		var newGroupUsers = groupFunctions.processGroupUsers(req);
		console.log("STEP 1: Get Group Users from the Input Form ")

		//STEP 2: Get new File and Check it is valid (an image and not to big)
		const uploadOutcome = groupFunctions.handleUploadResult(req, err);
		console.log("STEP 2: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadOutcome.uploadSuccess)

		newGroupOutcome.message = uploadOutcome.message;
		newGroupOutcome.statusCode = uploadOutcome.statusCode;
	
		if (!uploadOutcome.uploadSuccess) {
			console.log("STEP 2: (ERROR) Get new File and Check it is valid (an image and not to big)")

			return res.status(400).json(newGroupOutcome);
		}
		
		//STEP 3: Create and upload the File to add to the database
		console.log("STEP 3: Create the File to add to the database")
		const uploadFile = groupFunctions.buildUploadFileObject(req, uploadOutcome);

		try { 

			//STEP 4: Create the Group
			groupOutcome = await Group.createGroup(currentUser, uploadFile, groupName, groupType, groupPrivate);

			if(groupOutcome.outcome == 1) {
				console.log("STEP 4: You succesfully created a new group with Group ID " + groupOutcome.groupID);
			} else {
				console.log("STEP 4: There was an error creating the group");
				console.log(groupOutcome.errors);
				newGroupOutcome.message = "STEP 5: There was an error creating the group";
				newGroupOutcome.errors = groupOutcome.errors;
				res.status(500).json(newGroupOutcome);
				return 
			}

			//STEP 5: Add all the users to the new group
			var groupUsersOutcome = await Group.addNewGroupUsers(groupOutcome.groupID, newGroupUsers, currentUser);

			if(groupUsersOutcome.outcome == 1) {
				console.log("STEP 5: You succesfully added the new users");
			} else {
				console.log("STEP 5: There was an error adding the new users");
				console.log(groupUsersOutcome.errors);
				newGroupOutcome.message = "STEP 5: There was an error adding the new users";
				newGroupOutcome.errors = groupOutcome.errors;
				res.status(500).json(newGroupOutcome);
				return 
			}

			//STEP 6: Send Notifications and Requests
			console.log("STEP 6: Adding Group Notifications");
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

			console.log("STEP 6: Adding Group Requests");
			const newRequest = {
				requestType: "new_group",
				requestTypeText: "invited you to join a group",
				sentBy: req.body.currentUser,
				sentTo: newGroupUsers,
				groupID: groupOutcome.groupID
			}

			Requests.newGroupRequest(newRequest) 

		} catch (err) {
			console.error("Error occurred while creating group:", err);
			newGroupOutcome.message = "An unexpected error occurred during group creation";
			newGroupOutcome.errors.push(err);
			return res.status(500).json(newGroupOutcome);
		}

		//STEP 7: Create Response
		newGroupOutcome.success = true;
		newGroupOutcome.message = "Succesfully created the new group, yay!"
		newGroupOutcome.statusCode = 200;
		newGroupOutcome.data = {
			groupName: groupName, 
			groupImage: uploadFile.fileURL,
			groupID: groupOutcome.groupID, 
			groupMembers: [req.body.currentUser],
			pendingGroupMembers: groupUsersOutcome.pendingUsers,
		};

		Functions.addFooter()
		res.json(newGroupOutcome)
	})
}

//Function A2: Create a New Group (local to AWS)
async function createGroupLocalAWS(req, res) {
	const connection = db.getConnection(); 

	//Handle Upload 
	uploadFunctions.uploadGroupPhotoLocal(req, res, async function (err) {	
		var currentUser = req.body.currentUser; 
		var groupName = req.body.groupName
		var groupType = req.body.groupType; 
		var groupPrivate = req.body.groupPrivate;
		
		var headerMessage = "New Group created by " + currentUser
		console.log(headerMessage);

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

		newGroupOutcome.data = {
			groupName: "groupName", 
			groupImage: "groupImage",
			groupID: "groupID", 
			groupMembers: [""],
			pendingGroupMembers: [""],
		};

		//STEP 1: Get Group Users from the Input Form 
		var newGroupUsers = groupFunctions.processGroupUsers(req);
		console.log("STEP 1: Get Group Users from the Input Form ")

		//STEP 2: Get new File and Check it is valid (an image and not to big)
		const uploadOutcome = groupFunctions.handleUploadResult(req, err);
		console.log("STEP 2: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadOutcome.uploadSuccess)

		newGroupOutcome.message = uploadOutcome.message;
		newGroupOutcome.statusCode = uploadOutcome.statusCode;
	
		if (!uploadOutcome.uploadSuccess) {
			console.log("STEP 2: (ERROR) Get new File and Check it is valid (an image and not to big)")

			return res.status(400).json(newGroupOutcome);
		}
		
		//STEP 3: Create and upload the File to add to the database
		console.log("STEP 3: Create the File to add to the database")

		var uploadFile = {}

		if (!uploadOutcome.containsFile) {
			uploadFile.fileMimetype = "image/png";
			uploadFile.originalname = "group_image.png";
			uploadFile.fileNameServer = "group_image.png";
			uploadFile.fileURL = "http://localhost:3003/kite-groups-us-west-two/group_image.png";
			uploadFile.cloudKey = "no_cloud_key";
			uploadFile.bucket = "kite-groups-us-west-two";
			uploadFile.storageType = "local";
		}

		//STEP 2: 
		console.log("STEP 2: Upload to AWS")
		let file = req.file
		console.log("file")
		console.log(file)
		console.log("file")
		const fileExtension = mime.extension(file.mimetype) 
		const result = await awsStorage.uploadPost(file)

		console.log("result")
		console.log(result)
		console.log("result")

		//File Information
		var uploadFile = {}
		uploadFile.fileMimetype = file.mimetype; 
		uploadFile.originalname = file.originalname; //file_name
		uploadFile.fileNameServer = file.filename; //file_name_server

		//Settings: Local 
		//uploadFile.fileURL = file.path; //file_url
		//uploadFile.cloudKey = file.path; //cloud_key
		//uploadFile.bucket = file.destination; //cloud_bucket	
		//uploadFile.storageType = "aws"; //storage_type
		
		//Settings: Cloud
		uploadFile.fileURL = result.Location; // file_url
		uploadFile.cloudKey = result.Key; //cloud_key 
		uploadFile.bucket = result.Bucket; // cloud_bucket 	
		uploadFile.storageType = "aws"; //storage_type		

		try { 

			//STEP 4: Create the Group
			groupOutcome = await Group.createGroup(currentUser, uploadFile, groupName, groupType, groupPrivate);

			if(groupOutcome.outcome == 1) {
				console.log("STEP 4: You succesfully created a new group with Group ID " + groupOutcome.groupID);
			} else {
				console.log("STEP 4: There was an error creating the group");
				console.log(groupOutcome.errors);
				newGroupOutcome.message = "STEP 5: There was an error creating the group";
				newGroupOutcome.errors = groupOutcome.errors;
				res.status(500).json(newGroupOutcome);
				return 
			}

			//STEP 5: Add all the users to the new group
			var groupUsersOutcome = await Group.addNewGroupUsers(groupOutcome.groupID, newGroupUsers, currentUser);

			if(groupUsersOutcome.outcome == 1) {
				console.log("STEP 5: You succesfully added the new users");
			} else {
				console.log("STEP 5: There was an error adding the new users");
				console.log(groupUsersOutcome.errors);
				newGroupOutcome.message = "STEP 5: There was an error adding the new users";
				newGroupOutcome.errors = groupOutcome.errors;
				res.status(500).json(newGroupOutcome);
				return 
			}

			//STEP 6: Send Notifications and Requests
			console.log("STEP 6: Adding Group Notifications");
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

			console.log("STEP 6: Adding Group Requests");
			const newRequest = {
				requestType: "new_group",
				requestTypeText: "invited you to join a group",
				sentBy: req.body.currentUser,
				sentTo: newGroupUsers,
				groupID: groupOutcome.groupID
			}

			Requests.newGroupRequest(newRequest) 

		} catch (err) {
			console.error("Error occurred while creating group:", err);
			newGroupOutcome.message = "An unexpected error occurred during group creation";
			newGroupOutcome.errors.push(err);
			return res.status(500).json(newGroupOutcome);
		}

		//STEP 7: Create Response
		let signedURL = await cloudFunctions.getSignedURL(uploadFile.cloudKey)

		newGroupOutcome.success = true;
		newGroupOutcome.message = "Succesfully created the new group, yay!"
		newGroupOutcome.statusCode = 200;
		newGroupOutcome.data = {
			groupName: groupName, 
			groupImage: signedURL,
			groupID: groupOutcome.groupID, 
			groupMembers: [req.body.currentUser],
			pendingGroupMembers: groupUsersOutcome.pendingUsers,
		};

		Functions.addFooter()
		res.json(newGroupOutcome)
	})
}


//Function A2: Get Full Groups to Display
async function getGroups(req, res) {
	const connection = db.getConnection(); 
	const currentUser = req.params.user_name;

	var groupOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

	var groupsArray = []

	//STEP 1: Get the Groups List 
	let groupUsers = await Group.getGroupsUserIsIn(currentUser)
	console.log("STEP 1: Get the Groups List status: " + groupUsers.status)


	//STEP 2: Get Individual Group Information
	const userGroupList = groupUsers.groupIDs 
	console.log("STEP 2: Get Individual Group Information")

	
	for (let i = 0; i < userGroupList.length; i++) {
		let currentGroup = {
			groupID: "",
			groupName: "",
			groupImage: "",
			activeMembers: [],
			pendingMembers: []
		}

		let groupID = userGroupList[i];

		console.log(userGroupList[i])

		//Step 2A: Get the Groups Information (name, image, users)
		let currentGroupInformation = await Group.getGroupInformation(groupID)	
		console.log(currentGroupInformation)
		
		//Step 2A: Get the Groups Users
		let currentGroupUsers = await Group.getGroupUsers(groupID)	
		//console.log(currentGroupUsers)
		currentGroup.groupID = groupID
		currentGroup.groupName = currentGroupInformation.groupName
		currentGroup.groupImage = currentGroupInformation.groupImage
		currentGroup.activeMembers = currentGroupUsers.groupUsers
		currentGroup.pendingMembers = currentGroupUsers.pendingGroupUsers

		groupsArray.push(currentGroup)


	} 

	groupOutcome.data = groupsArray

	res.json(groupOutcome)
	
}


//Function A3: Invite User to a Group 
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

//Function A4: Accept Group Invite
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

//Function A5: Leave a Group 
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

//Function A6: Get All Groups User is In 
async function getUserGroups(req, res) {
    const connection = db.getConnection(); 
	const currentUser = req.params.user_name;
	const groupID = req.params.group_id;

	var groupsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

	//console.log("getUserGroups: This was the decoded user from the token")

	console.log("getUserGroups")

	const groupUsersOutcome = await Group.getGroupsUserIsIn(currentUser);
	
	if(groupUsersOutcome.status == 200) {
		groupsOutcome.data = groupUsersOutcome.groupIDs
		groupsOutcome.message = "We got the groups!"
		groupsOutcome.success = true
		groupsOutcome.statusCode = 200
	}

	res.json(groupsOutcome)
}

//Function A7: Get Single Group by ID 
async function getGroup(req, res) {
	const groupID = req.params.groupID;
	
	res.json({toDo: "Need"});

}

//Function A8: Get Group Users
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

//Function A9: Update Group Information
async function updateGroup(req, res) {
    const groupID = req.body.groupID;
    const groupName = req.body.groupName;
    const groupType = req.body.groupType;
    const groupPrivate = req.body.groupPrivate;
    const groupImage = req.body.groupImage;

    let updateOutcome = {
        success: false,
        statusCode: 500,
        errors: [],
        groupID: groupID
    };

    try {
        const result = await Group.updateGroup(groupID, groupName, groupType, groupPrivate, groupImage);
        if (result.status === 200) {
            updateOutcome.success = true;
            updateOutcome.statusCode = 200;
        } else {
            updateOutcome.errors = result.errors;
        }
    } catch (err) {
        updateOutcome.errors.push(err);
    }
    res.json(updateOutcome);
}

module.exports = { createGroup, createGroupLocalAWS, getGroups, addGroupUsers, acceptGroupInvite, getUserGroups, getGroup, getGroupUsers, leaveGroup, updateGroup };




		/*
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
		*/




		/*
		console.log("STEP 2: Upload Post to API")
		//Error 2A: File too large
		if (err instanceof multer.MulterError) {
			console.log("Error 2A: File too large")
			newGroupOutcome.message = "Error 2A: File too large"
	
		//Error 2B: Not Valid Image File
		} else if (err) {
			console.log("Error 2B: Not Valid Image File")
			newGroupOutcome.message = "Error 2B: Not Valid Image File"

		//Success 2A: No Multer Errors
		} else {
			let file = req.file
			console.log("Success 2A: No Multer Errors")

			//Success 1B: Success Upload File
			if(file !== undefined) {
				console.log("Success 2B: Success Upload File")
				uploadSuccess = true   

			//Error 1C: No File 	
			} else {
				console.log("Error 2C: No File mah dude!")
				newGroupOutcome.message = "Error 2C: No File mah dude!"
			} 
		}
		*/


/*
var newGroupUsersRaw

try {
	// Parse from JSON string (because form-data treats it as string)
	newGroupUsersRaw = JSON.parse(req.body.groupUsers);
} catch (e) {
	console.error("Invalid groupUsers format");
	newGroupUsersRaw = []; // or handle error properly
}

var newGroupUsersClean = Functions.cleanUserNameArray(newGroupUsersRaw)
var newGroupUsers = Functions.removeArrayDuplicates(newGroupUsersClean)
*/
