const db = require('./conn');
const Functions = require('../functions/functions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_POSTS_BUCKET_NAME

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
			console.log("Error 2C: No File mah dude!");
            uploadOutcome.containsFile = false;
			uploadOutcome.message = "Error 2C: No File mah dude!";
			uploadOutcome.statusCode = 400;
		}
	}

	return uploadOutcome;
}



module.exports = { checkUserGroupStatus, checkGroupExists, checkUserInGroup, processGroupUsers, handleUploadResult }







