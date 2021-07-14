const express = require('express')
const mysql = require('mysql')
const postRouter = express.Router();
let postController = require('./../controllers/postController');
//let notifications = require('../functions/notifications');
//const Post = require('./../models/Post.js')

//Dev: Temp
var cors = require('cors')
postRouter.use(cors())

//GET Routes
//Route 1: Get a Single Post by ID
postRouter.route("/post/:post_id").get(postController.getSinglePost);

//Route 2: Get all Posts to a User 
postRouter.route("/posts/user/:post_to").get(postController.getUserPosts);

//Route 3: Get all Posts to a Group 
postRouter.route("/posts/group/:group_id").get(postController.getGroupPosts);

//Route 4: Get all Posts 
postRouter.route("/posts/all").get(postController.getAllPosts);

//POST Routes
//Route 5: Create a New Post
postRouter.route("/post").post(postController.newPost);

//FUNCTIONS
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})

//Functions: Get Connection
function getConnection() {
    return pool;
}

module.exports = postRouter;


















//SORT

/*
//POST ROUTES
//post/user
//post/group

//Route 5: Make a Post 
//http://localhost:3003/new_post
//post/group/group_id
//post/user/user_id

router.post('/new_post', function(req, res, next) {

    //STEP 1: Insert into posts table 
    const connection = getConnection();
    const postType = req.body.postType
    const postStatus = req.body.postStatus 
    const groupID = req.body.groupID 
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
    const notificationFrom = req.body.postFrom 
    const notificationTo = req.body.postTo 
    const notificationMessage = req.body.notificationMessage 
    const notificationType = req.body.notificationType 
    const notificationLink = req.body.notificationLink 
 
    console.log("POST DATA: " + postType + " " + postStatus + " " + groupID + " " + postFrom + " " + postTo + " " + postCaption);

    /*
    const queryString = "INSERT INTO posts (post_type, post_status, group_id, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?, ?)"
    
    connection.query(queryString, [postType, postStatus, groupID, postFrom, postTo, postCaption], (err, results, fields) => {
        if (err) {
            console.log("Failed to insert new Post: " + err)
            res.sendStatus(500)
            return
        } else {
            console.log("You created a new Post with ID " + results.insertId);
            res.send("It worked ");
        } 
    }) 
    *//*

    //STEP 2: Add New Notifications  
    notifications.createGroupNotification(groupID, notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType);
    res.send("LAST: It worked ");
})

//TEMP
router.get("/groupusers/:group_id", (req, res) => {
    const groupID = req.params.group_id
    
    //Create Query 
    const connection = getConnection();
    //const queryString = "SELECT user_name FROM group_users WHERE active_member = '1' AND group_id = ?";
    const queryString = "SELECT user_name FROM group_users WHERE active_member = '1' AND group_id = ?";

    connection.query(queryString, [groupID], (err, rows, fields) => {
        if (err) {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
        }

        //TEMP
        res.setHeader('Access-Control-Allow-Origin', '*');
        //TEMP
        var groupMembers = new Set();
  

        for (i = 0; i < rows.length; i++) {
            groupMembers.add(rows[i].user_name)
            console.log(rows[i].user_name)
        }
        console.log("_____");
        console.log(groupMembers);

    })     
       
       console.log(groupID);
})
*/


/*
//Route 5: Make a Post 
router.get('/groupusers/:group_id', function(req, res) {
    
    const groupID = req.body.group_id
    console.log(groupID);
   
    //Create Query 
    const connection = getConnection();
    //const queryString = "SELECT user_name FROM group_users WHERE active_member = '1' AND group_id = ?";
    const queryString = "SELECT user_name FROM group_users WHERE group_id = ?";
    // 

    connection.query(queryString, [groupID], (err, rows, fields) => {
        if (err) {
            console.log("Failed to Select Posts" + err)
            res.sendStatus(500)
            return
        }
        //TEMP
        res.setHeader('Access-Control-Allow-Origin', '*');
        //TEMP
        res.json(rows);
    })
  
})
*/


/*
function getActiveGroupMembers($group_id) {
	global $conn;
	
	$result_groups = mysqli_query($conn,"SELECT user_name FROM group_users 
		WHERE group_id = '$group_id'
		AND active_member = '1' ");
		
	$group_members_array = array();
	$group_members_array_count = 0;
	
	//Create Group  
	while($row_groups = mysqli_fetch_array($result_groups)) {	
		//Get Group Information 
		$user_name = $row_groups['user_name'];
		$group_members_array[$group_members_array_count] = $user_name;		
		$group_members_array_count = $group_members_array_count + 1;
	}	
	
	//Build Unique array and reset index 
	$group_members_array = array_unique($group_members_array);	
	$group_members_array =  array_values($group_members_array);
	
	return $group_members_array;
	 
}
*/

//TEMP



//USE CONTROLLER
//router.route("/post").get(postController.getSinglePost);

