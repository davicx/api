const db = require('./conn');
const Functions = require('../functions/functions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_GROUPS_BUCKET_NAME
const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');
const Group = require('./classes/Group');

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')


/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Check if users are already in the group
	2) Function A2: Check if Group exists (by ID)
	3) Function A3: Check if a User is in a Group
	10) Function A10: Get a users total Groups Count

*/

//GROUP FUNCTIONS
//Function A1: Check if users are already in the group
async function checkUserGroupStatus(invitedUsers, groupID)  {
    const connection = db.getConnection(); 

    var groupUserStatus = {
        outcome: 200,
		existingUsers: [],
		newUsers: []
    }
    return new Promise(async function(resolve, reject) {
        const existingUsersSet = new Set();
        try {
            
            const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ?"			
            
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {
                    for(let i = 0; i < rows.length; i++) {
                        const userName = rows[i].user_name.toLowerCase();
                        existingUsersSet.add(userName)
                    }

                    let existingUsers = Array.from(existingUsersSet);
                    groupUserStatus.existingUsers = existingUsers;
                    groupUserStatus.newUsers = invitedUsers.filter(item=>existingUsers.indexOf(item)==-1);

                    resolve(groupUserStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupUserStatus);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            reject(groupUserStatus);
        } 
    })

}

//Function A2: Check if Group exists (by ID)
async function checkGroupExists(groupID)  {
    const connection = db.getConnection(); 

    var groupExistsStatus = {
        outcome: 500,
		groupExists: 0,
        createdBy: "",
		errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT created_by FROM shareshare.groups WHERE group_id = ?"			
            
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
                        groupExistsStatus.outcome = 200;
                        groupExistsStatus.groupExists = rows.length;
                        groupExistsStatus.createdBy = rows[0].created_by
                    } 

                    resolve(groupExistsStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupExistsStatus);
                }
            })
        } catch(err) {
            groupExistsStatus.outcome = 500;
            reject(groupExistsStatus);
        } 
    })

}

//Function A3: Check if a User is in a Group
async function checkUserInGroup(userName, groupID)  {
    const connection = db.getConnection(); 

    var groupUserStatus = {
        outcome: 200,
		userName: userName
    }

    return new Promise(async function(resolve, reject) {
        const existingUsersSet = new Set();
        try {
            
            const queryString = "SELECT user_name, active_member FROM group_users WHERE group_id = ? AND user_name = ?"			
            
            connection.query(queryString, [groupID, userName], (err, rows) => {
                if (!err) {
                    if(rows.length > 0) {
                        groupUserStatus.userInGroup = true
                    } else {
                        groupUserStatus.userInGroup = false
                    }

                    resolve(groupUserStatus); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(groupUserStatus);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            reject(groupUserStatus);
        } 
    })

}

//Function A10: Get a users total Groups Count
async function getUserGroupCount(userName) {
    const connection = db.getConnection();
    
    var userGroupCountOutcome = {
        userName: userName,
        groupCount: 0,
        success: false,
        errors: []
    }

    return new Promise(function(resolve, reject) {
        try {
            const queryString = "SELECT COUNT(group_users.primary_id) AS group_count FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND group_users.active_member = 1 AND shareshare.groups.group_deleted = 0";
            connection.query(queryString, [userName], (err, rows) => {
                if (!err) {
                    if(rows && rows.length > 0) {
                        userGroupCountOutcome.groupCount = rows[0].group_count;
                        userGroupCountOutcome.success = true;
                    } else {
                        userGroupCountOutcome.errors.push("Could not get group count for " + userName);
                    }
                    resolve(userGroupCountOutcome);
                } else {
                    userGroupCountOutcome.errors.push(err);
                    resolve(userGroupCountOutcome);
                }
            });
        } catch(err) {
            userGroupCountOutcome.errors.push(err);
            reject(userGroupCountOutcome);
        }
    });
}

function processGroupUsers(req) {
    let newGroupUsersRaw;

    try {
        // STEP 1: Parse JSON string to array
        newGroupUsersRaw = JSON.parse(req.body.groupUsers);
    } catch (e) {
        console.error("Invalid groupUsers format");
        newGroupUsersRaw = [];
    }

    // STEP 2: Clean user names
    const newGroupUsersClean = Functions.cleanUserNameArray(newGroupUsersRaw);

    // STEP 3: Remove duplicates
    const newGroupUsers = Functions.removeArrayDuplicates(newGroupUsersClean);

    return newGroupUsers; // Optionally return the final array
}

async function createGroupAndUsers(currentUser, uploadFile, groupName, groupType, groupPrivate, groupUsers) {
	const groupOutcome = await Group.createGroup(currentUser, uploadFile, groupName, groupType, groupPrivate);
	if (groupOutcome.outcome !== 1) {
		return {
			success: false,
			message: "Error creating group",
			errors: groupOutcome.errors
		};
	}

	const groupID = groupOutcome.groupID;
	const usersOutcome = await Group.addNewGroupUsers(groupID, groupUsers, currentUser);
	if (usersOutcome.outcome !== 1) {
		return {
			success: false,
			message: "Error adding group users",
			errors: usersOutcome.errors
		};
	}

	return {
		success: true,
		groupID
	};
}

async function sendGroupNotificationsAndRequests(currentUser, groupUsers, groupID, message, link, type) {
	const notification = {
		masterSite: "kite",
		notificationFrom: currentUser,
		notificationMessage: message,
		notificationTo: groupUsers,
		notificationLink: link,
		notificationType: type,
		groupID
	};
	Notifications.createGroupNotification(notification);

	const request = {
		requestType: "new_group",
		requestTypeText: "invited you to join a group",
		sentBy: currentUser,
		sentTo: groupUsers,
		groupID
	};
	Requests.newGroupRequest(request);
}


module.exports = { checkUserGroupStatus, checkGroupExists, checkUserInGroup, getUserGroupCount, processGroupUsers, createGroupAndUsers, sendGroupNotificationsAndRequests }










/*
function handleUploadResult(req, err) {
	const uploadOutcome = {
		uploadSuccess: false,
		containsFile: false,
		message: "",
		statusCode: 500
	};

	console.log("STEP 2: Upload File to API");

	if (err instanceof multer.MulterError) {
		console.log("Error 2A: File too large");
		uploadOutcome.message = "Error 2A: File too large";
		uploadOutcome.containsFile = true;
		uploadOutcome.statusCode = 413;
	} else if (err) {
		console.log("Error 2B: Not Valid Image File");
		uploadOutcome.message = "Error 2B: Not Valid Image File";
        uploadOutcome.containsFile = true;
		uploadOutcome.statusCode = 415;
	} else {
		let file = req.file;
		console.log("Success 2A: No Multer Errors");

		if (file !== undefined) {
			console.log("Success 2B: Success Upload File");
			uploadOutcome.uploadSuccess = true;
            uploadOutcome.containsFile = true;
			uploadOutcome.message = "Success 2B: Success Upload File";
			uploadOutcome.statusCode = 200;
		} else {
			console.log("No File mah dude! we will use a default");
            uploadOutcome.uploadSuccess = true;
            uploadOutcome.containsFile = false;
			uploadOutcome.message = "No File mah dude! we will use a default";
			uploadOutcome.statusCode = 200;
		}
	}

	return uploadOutcome;
}
*/
