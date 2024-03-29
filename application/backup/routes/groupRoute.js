const express = require('express')
const groupRouter = express.Router();
const postFunctions = require('../../functions/postFunctions')
const groupFunctions = require('../../functions/groupFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../../functions/conn');


groupRouter.get("/groups/user/:user_name", verifyUser, (req, res) => {
    const currentUser = req.authorizationData.currentUser;
    console.log("_____________________________________")
    //const responseMessage = req.responseMessage;
    console.log(currentUser)
    console.log("_____________________________________")
    groupFunctions.getUserGroups(req, res, currentUser);

})




function verifyUser(req, res, next) {
    //48 hour token refresh every 24 hours 
    console.log("_____________________________________")
    var responseMessage = {
        validateToken: "token validation",
        noToken: false,
        tokenExpired: false,
        validToken: true
    }
    
    //STEP 1: Determine Auth Type 
    var cookieToken = req.cookies.accessToken;
    const authHeader = req.headers['authorization'];
    headerToken = authHeader && authHeader.split(' ')[1]
    var tokenType = ""
    
    if(cookieToken != undefined) {
        tokenType = "cookie"
    } else if(headerToken != undefined) {
        tokenType = "header"
    } else {
        tokenType = null;
    }

    //STEP 2: 
    if(tokenType == "cookie") {
        var token = req.cookies.accessToken;
    } else if(tokenType == "header") {
        var token = authHeader && authHeader.split(' ')[1]
    } else {
        var token = null;
    }

    console.log("STEP 1: the token is from " + tokenType)
    console.log("STEP 2: The token " + token)

    //STEP 3: Verify the Token 
    if (token == null) {
        console.log("STEP 3: You didn't present a token, no beuno!")
        //return res.sendStatus(401)
        responseMessage.noToken = true
        res.status(401).json(responseMessage)
    } else {
        console.log("STEP 3: There is a token so we can verify")
    }

    //STEP 4: Check still has time on it (move to first middle ware check for refresh, then validate)
    var decoded = jwt_decode(token);
    const tokenCreated = decoded.exp;
    const tokenFinished = decoded.iat;
    const dateTokenIsGoodTell =  new Date(decoded.exp * 1000)
    var stillGood = false 


    //current date in seconds since epoch
    var d = new Date();
    var currentSecondsSinceEpoch = Math.round(d.getTime() / 1000);
    const tokenLifeSeconds = (tokenCreated - tokenFinished);
    const tokenLifeMinutes = tokenLifeSeconds / 60;

    const timeBeforeRefresh = 60;
    //If expires - timeBeforeRefresh is greater then today get a new token 

    console.log("Token life in seconds " + tokenLifeSeconds)
    console.log("Token life in minutes " + tokenLifeMinutes)
    console.log("")
    
    if(tokenFinished - tokenCreated) {
        stillGood = true
        responseMessage.tokenExpired = false;
        console.log("STEP 4: There is still time on the token. It is good until " + dateTokenIsGoodTell) 
        console.log("STEP 4: There is still time on the token. It has " + (tokenLifeSeconds + (tokenFinished - currentSecondsSinceEpoch)) + " seconds left")
    } else {
        responseMessage.tokenExpired = true;
        console.log("STEP 4: The token ran out of time need to refresh")
    }

    //STEP 5: Verify Token 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
            console.log("STEP 5: The token was a good one!")
            req.authorizationData = authorizationData
            req.responseMessage = responseMessage;
            next();
        } else {
            console.log("STEP 5: The token was no good try to get a new one with refresh token ")
            responseMessage.validToken = false;
            console.log(responseMessage)
            res.status(401).json(responseMessage)
        }
    })

}



module.exports = groupRouter;






    //console.log("currentSecondsSinceEpoch " + currentSecondsSinceEpoch)
    //console.log("tokenCreated " + tokenCreated)
    //console.log("tokenFinished " + tokenFinished)
    //console.log("Time remaining " + (currentSecondsSinceEpoch - tokenFinished))

    //console.log((tokenCreated - tokenFinished) / 60 / 60)
    //console.log((tokenCreated - tokenFinished) / 60 / 60 / 24)
    /*
    when to get new token 
    if(tokenCreated - tokenFinished) / 60 / 60 < 24) {
    }
    */





















///////////
//const cors = require('cors');
//postRouter.use(cors())
//const app = express()
//Middleware 
/*
const express = require('express')
const app = express()

const myLogger = function (req, res, next) {
  console.log('LOGGED')
  next()
}

app.use(myLogger)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000)
*/
///////////

/*

//CREATE POST 
//Route A1: Post Text
postRouter.post('/post/text', function(req, res) {
    postFunctions.postText(req, res);
})

//Route A2: Post Photo
postRouter.post('/post/photo', function(req, res) {
    postFunctions.postPhoto(req, res);
})

//Route A3: Post Video
postRouter.post('/post/video', function(req, res) {
    postFunctions.postVideo(req, res);
})

//UPDATE POSTS
postRouter.post('/post/update/text', function(req, res) {
    postFunctions.postUpdateText(req, res);
})

*/
//GET POSTS 
//Route B1: Get Posts to a Group
/*
postRouter.get("/posts/group/:group_id", (req, res) => {
    accessToken = req.cookies.accessToken;
    refreshToken = req.cookies.refreshToken;
    console.log("___________________")
    console.log("accessToken " + accessToken)
    console.log("___________________")
  
    postFunctions.getGroupPosts(req, res);
})
*/

/*
//postRouter.get("/posts/group/:group_id", verifyUser, (req, res) => {
postRouter.get("/posts/group/:group_id", (req, res) => {
    //const currentUser = req.authorizationData.currentUser;

    //TEMP
    console.log("_____________________________________")
    var cookieAccessToken = req.cookies.accessToken;
    var cookieRefreshToken = req.cookies.accessToken;
    var authHeader = req.headers['authorization'];
    var headerAccessToken = authHeader && authHeader.split(' ')[1]
    
    if(!cookieAccessToken) {
      cookieAccessToken = "no cookieAccessToken"
    }   
    if(!cookieRefreshToken) {
      cookieRefreshToken = "no cookieRefreshToken"
    }   
    if(!headerAccessToken) {
     headerAccessToken = "no headerAccessToken"
    }   
    console.log("cookieAccessToken " + cookieAccessToken)
    console.log("cookieRefreshToken " + cookieRefreshToken)
    console.log("headerAccessToken " + headerAccessToken)
    //console.log("The Current User Asking for Posts")
    //console.log(currentUser)
    
       console.log("_____________________________________")
    var cookieAccessToken = req.cookies.accessToken;
    var cookieRefreshToken = req.cookies.accessToken;
    var authHeader = req.headers['authorization'];
    var headerAccessToken = authHeader && authHeader.split(' ')[1]
    
    if(!cookieAccessToken) {
      cookieAccessToken = "no cookieAccessToken"
    }   
    if(!cookieRefreshToken) {
      cookieRefreshToken = "no cookieRefreshToken"
    }   
    if(!headerAccessToken) {
     headerAccessToken = "no headerAccessToken"
    }   
  
    const response = {
      currentUser: userName,
      cookieAccessToken: cookieAccessToken, 
      cookieRefreshToken: cookieRefreshToken,
      headerAccessToken: headerAccessToken,
    }
  
    console.log("___________________")
    console.log(response)
    console.log("___________________")
    //console.log("The Current User Asking for Posts")
    //console.log(currentUser)
    console.log("_____________________________________")
    
    console.log("_____________________________________")
    
    postFunctions.getGroupPosts(req, res);
})


*/


//Route B3: Get Single Post by ID 
/*
postRouter.get("/posts/:post_id", (req, res) => {
	postFunctions.getSinglePost(req, res);
})
*/

//Route B4: Get all Posts 
/*
postRouter.get("/posts", (req, res) => {
    console.log("Get all Posts")
	postFunctions.getAllPosts(req, res);

})
*/

//Route B5: Get all Posts Pagination
/*
postRouter.get("/pagination", (req, res) => {
    console.log("Get all Posts")
	postFunctions.getAllPostsPagination(req, res);
*/
    /*
    app.get('/fruit/:fruitName/:fruitColor', function(req, res) {
    var data = {
        "fruit": {
            "apple": req.params.fruitName,
            "color": req.params.fruitColor
        }
    }; 

    send.json(data);
});

    *//*

})
*/




//TEMP
/*
postRouter.get("/posts/group/error", (req, res) => {
    res.status(500).send({error: 'hello i failed'});
})

*/


























//APPENDIX

/*
postRouter.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });


postRouter.post("/learning", (req, res) => {
    console.log("hiya!");
    myReponse = {
      firstName: req.body.firstName,
      lastName: req.body.lastName
    }
    res.json({ response: myReponse });
}) 


*/


    /*
    //WORKS
    const connection = db.getConnection(); 
	const queryString = "SELECT user_namea FROM group_users WHERE group_id = ? AND active_member = '1'";
    var groupUsersSet = new Set();
    const groupID = 77;
    	
    var groupUsersResponse = {
        outcome: 1,
        groupUsers: [],
        errors: [],
    }

    connection.query(queryString,[groupID], (err, rows) => {
        if (!err) {
            console.log("No error")
            rows.map((row) => {
                groupUsersSet.add(row.user_name) 
            });
            groupUsersResponse.groupUsers = Array.from(groupUsersSet);;

        } else {
            //console.log("Failed to Select Users from this Group " + err)
            groupUsersResponse.outcome = 0;
            groupUsersResponse.errors.push("Failed to Select Users from this Group " + err);
        }	
        res.json(groupUsersResponse);
    })  
    */





//CLEAN 
//const Post = require('./../../functions/classes/Post');
//const User = require('./../../functions/classes/User');
//const notifications = require('./../../functions/notifications');


//ROUTE 1: Post Text
/*
postRouter.post('/post/oldtext', function(req, res) {
    postFunctions.postText(req, res);



    //WORKS
    const connection = db.getConnection(); 
	const queryString = "SELECT user_namea FROM group_users WHERE group_id = ? AND active_member = '1'";
    var groupUsersSet = new Set();
    const groupID = 77;
    	
    var groupUsersResponse = {
        outcome: 1,
        groupUsers: [],
        errors: [],
    }

    connection.query(queryString,[groupID], (err, rows) => {
        if (!err) {
            console.log("No error")
            rows.map((row) => {
                groupUsersSet.add(row.user_name) 
            });
            groupUsersResponse.groupUsers = Array.from(groupUsersSet);;

        } else {
            //console.log("Failed to Select Users from this Group " + err)
            groupUsersResponse.outcome = 0;
            groupUsersResponse.errors.push("Failed to Select Users from this Group " + err);
        }	
        res.json(groupUsersResponse);
    })  
    
})
*/

//ROUTE 1: Post Learing

/*
postRouter.post('/post/learning', function(req, res) {
    //postFunctions.postLearning(req, res);
    const groupID = 77;
    const connection = db.getConnection(); 
    const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";

    //Make Query
    connection.query(queryString,[groupID], (err, rows) => {

        if (!err) {
            console.log("No error")
            rows.map((row) => {
                console.log("HIYA " + row.user_name); 
            });
            

        } else {
            console.log("error");
        }	

    })  
    res.json("HI");
})

*/








/*
//WORKS
    //STEP 1: Insert into posts table
    //const postFrom = req.body.postFrom 
    //const postTo = req.body.postTo 
    //const postCaption = req.body.postCaption 
    //const connection = db.getConnection(); 
    //console.log("POST DATA: " + postFrom + " " + postTo + " " + postCaption);
    //Post.postText(req, res)
    //

    //Works
    
    const queryString = "INSERT INTO posts (post_from, post_to, post_caption) VALUES (?, ?, ?)"
    
    connection.query(queryString, [postFrom, postTo, postCaption], (err, results, fields) => {
        if (err) {
            console.log("Failed to insert new Post: " + err)
            res.sendStatus(500)
            return
        } else {
            console.log("You created a new Post with ID " + results.insertId);
            res.send("LAST: It worked " + results.insertId);
        } 
    }) 

	
*/
/*
postRouter.post('/post', function(req, res) {

    //STEP 1: Insert into posts table
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
    const connection = db.getConnection(); 
    console.log("POST DATA: " + postFrom + " " + postTo + " " + postCaption);
    const queryString = "INSERT INTO posts (post_from, post_to, post_caption) VALUES (?, ?, ?)"
    
    connection.query(queryString, [postFrom, postTo, postCaption], (err, results, fields) => {
        if (err) {
            console.log("Failed to insert new Post: " + err)
            res.sendStatus(500)
            return
        } else {
            console.log("You created a new Post with ID " + results.insertId);
            res.send("LAST: It worked " + results.insertId);
        } 
    }) 
	
})
*/

































//ORGANIZE
//CLEAN


//ROUTE 3: Get all Posts to a User 




//ROUTE 4: Make a Text Post
/*
postRouter.post('/post/text', function(req, res) {

    //STEP 1: Insert into posts table 
    //const connection = getConnection();
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
    
    //STEP 2: Add New Notifications  
    //notifications.createGroupNotification(groupID, notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType);
    res.send("LAST: It worked ");
})
*/

//ROUTE 5: Make a Photo Post
//ROUTE 6: Make a Video Post
//ROUTE 7: Make an Article Post
//ROUTE 8: Make an File Post
//ROUTE 9: Update a Post
//ROUTE 10: Delete a Post 
/*
postRouter.get("/posts", (req, res) => {
    const postOne = {postCaption: "Hiya Summer!", postType: "text"}
    const postTwo = {postCaption: "Hiya Fall!", postType: "text"}
    const postThree = {postCaption: "Hiya Winter!", postType: "video"}

    //Create new post
    let postID = 84;
    
    let currentPost = new Post(postID);
    currentPost.getPostInfo();
    
    let newPostID = Post.postText("hi");
    console.log("Your Post ID: " + newPostID);
    notifications.sayHi();
    //currentPost.postCaption = "hiya!"
    //currentPost.postStatus = "hiya!"
    //currentPost.postStatus = "no status"
    //console.log(currentPost.postID + " " + currentPost.postCaption + " " + currentPost.postStatus);

    //Create new User
    //let userName = "davey";
    //let currentUser = new User(userName);
    //console.log(currentUser.userName);
    

    currentUser.getUserInfo(userName);
    currentUser.getFriendList(userName);
   
    console.log(myFriends);



    res.json([postOne, postTwo, postThree])
})

module.exports = postRouter;
*/
/*
//let postController = require('./../controllers/postController');
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



*/
















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
        var cors = require('cors')
        postRouter.use(cors())
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

//POST WORKS I THINK?
/*
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
    

    //STEP 2: Add New Notifications  
    notifications.createGroupNotification(groupID, notificationFrom, notificationTo, notificationMessage, notificationLink, notificationType);
    res.send("LAST: It worked ");
})
*/






//ORGANIZE
//const mysql = require('mysql')

//const User = require('./classes/user');
//app.use(posts);
//app.use(express.json());

/*
//TYPE 5: Simple POST request 
app.post('/post', function(req, response) {
  response.send(req.body);

  //console.log(req.body.postFrom + " " + req.body.postTo + " " + req.body.postCaption);
    const postType = req.body.postType
  const postStatus = req.body.postStatus
  const groupID = req.body.groupID
  const postFrom = req.body.postFrom
  const postTo = req.body.postTo
  const postCaption = req.body.postCaption
  const notificationMessage = req.body.notificationMessage
  const notificationType = req.body.notificationType
  const notificationLink = req.body.notificationLink

  console.log(postType + " " + postFrom + " " + postTo + " " + postCaption + " " + notificationMessage + " " + notificationType + " " + notificationLink);

  const queryString = "INSERT INTO posts (post_type, post_status, group_id, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?, ?)"
  getConnection().query(queryString, [postType, postStatus, groupID, postFrom, postTo, postCaption], (err, results, fields) => {
    if (err) {
      console.log("Could not insert the post " + err)
      response.sendStatus(500)
      return
    }
    var newPostID = results.insertId;
    console.log("Inserted a new post with id: ", newPostID);
    const post_outcome = "Inserted a new post with id: " + newPostID;
    response.setHeader('Content-Type', 'application/json');

    const outcome = {"post_outcome": post_outcome};
    response.write(JSON.stringify(outcome));
    response.end();
  })
})

//ROUTE 4: Simple Post Response from Database
app.get("/posts", (req, res) => {

  //Create Query 
  const connection = getConnection();
  const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts LIMIT 5";

  connection.query(queryString, (err, rows) => {
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


//Functions: Get Connection
function getConnection() {
  return mysql.createConnection({
    host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gCtLRbXMWWS2SwNg',
    database: 'shareshare'
    //host: 'localhost',
    //user: 'root',
    //password: '',
    //database: 'shareshare'
  })
}



app.get("/friends", (req, res) => {
  let userName = "davey";
  let currentUser = new User(userName);
  console.log(currentUser.userName);
  currentUser.getUserInfo(userName);
  currentUser.getFriendList(userName);
  let myFriends = currentUser.getFriendList(userName);
  res.send(myFriends);

  res.send()
})


 



  /*
  //Create Query 
  const queryString = "SELECT host FROM mysql.user WHERE User = 'root';";

  getConnection().query(queryString, (err, rows) => {
      if (err) {
          console.log("Failed to Select New User: " + err)
          res.sendStatus(500)
          return
      }

      //Output Data
      const posts = rows.map((row) => {
          return {
              postFrom: row.post_from,
              postTo: row.post_to,
              postCaption: row.post_caption
          }      
      }); 
      res.json(posts);
      //res.json(rows);  
      res.end()
  })

  */