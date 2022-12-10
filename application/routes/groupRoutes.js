const express = require('express')
const db = require('../../functions/conn');
const groupRouter = express.Router();
const groupFunctions = require('./../../functions/groupFunctions')
//app.use(express.json());

//USER ROUTES
//Route A1: Create a New Group
groupRouter.post('/group/create/', function(req, res) {
    groupFunctions.createGroup(req, res);
})

/*
//Route A2: Invite Users to a Group 
groupRouter.post('/group/invite/', function(req, res) {
    groupFunctions.addGroupUsers(req, res);
})

//Route A3: Join Group 
groupRouter.post('/group/join/', function(req, res) {
    groupFunctions.acceptGroupInvite(req, res);
})

//Route A4: Leave a Group
groupRouter.post('/group/leave/', function(req, res) {
    groupFunctions.leaveGroup(req, res);
})

//GET ROUTES
//Route B1: Get All Groups a User is In
groupRouter.get("/group/user/:userName", (req, res) => {
    groupFunctions.getUserGroups(req, res);
})

//Route B2: Get Single Group by ID 
groupRouter.get("/group/:groupID", (req, res) => {
    groupFunctions.getGroup(req, res);
})

//Route B3: Get Group Users 
groupRouter.get("/group/users/:groupID", (req, res) => {
    groupFunctions.getGroupUsers(req, res);
})

*/

//Need to make SQL query get all the groups a user is in and there name 
groupRouter.get("/groups/:userName", (req, res) => {
    //groupFunctions.getUserGroups(req, res);
    const connection = db.getConnection(); 
	const userName = req.params.userName;

	const queryString = "SELECT * FROM group_users WHERE user_name = ? AND active_member = 1";

    /*
    SELECT group_id FROM group_users WHERE user_name=? AND is_default_group = '1'
    
    $sql = "SELECT group_users.user_name, group_users.active_member, user_login.user_name, user_login.account_deleted
    FROM group_users INNER JOIN user_login
    ON group_users.user_name = user_login.user_name
    WHERE group_id = '$group_id' 
    AND active_member = '1' 
    AND account_deleted = '0'";
    */

    connection.query(queryString, [userName], (err, rows) => {
        if (!err) {
			var groupList = [];
			rows.map((row) => {
                console.log(row)
                let currentGroup = {
                    groupID: row.group_id,
                    groupName: "row.group_name"
                }
				//groupList.push(row.group_id);
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
})


/*

*/



module.exports = groupRouter;




