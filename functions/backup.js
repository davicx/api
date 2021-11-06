
//APPENDIX
/*
try {
	let response = await newGetUser("frodo no");
	//console.log(response);
	} catch (err) {
	//console.log('That did not go well.')
	}
*/

/*
	//const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE group_id = ? ORDER BY post_id DESC";
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_to = ? ORDER BY post_id DESC";
	var groupPosts = {
		posts: [],
		outcome: 0,
		errors: []
	}

    connection.query(queryString, [groupID], (err, rows) => {
        if (!err) {
			const posts = rows.map((row) => {
				return {
					postID: row.post_id,
					postFrom: row.post_from,
					postTo: row.post_to,
					postCaption: row.post_caption
				}
			});
	
			res.setHeader('Access-Control-Allow-Origin', '*');
			groupPosts.posts = posts;
			groupPosts.outcome = 1;
			res.json({groupPosts: groupPosts});
	   
		} else {
            console.log("Failed to Select Posts" + err)
            //res.sendStatus(500)
            //return
			res.setHeader('Access-Control-Allow-Origin', '*');
			groupPosts.errors.push(err);
			res.json({groupPosts: groupPosts});
		}
    })  
	
*/

	
	/*
	const connection = db.getConnection(); 
	const masterSite = req.body.masterSite 
    const postType = req.body.postType 
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
	const queryString = "INSERT INTO posts (master_site, post_type, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?)"
    
    connection.query(queryString, [masterSite, postType, postFrom, postTo, postCaption], (err, results, fields) => {
        if (!err) {
			//Send Response
			console.log("You created a new Post with ID " + results.insertId);
			res.send("LAST: It worked " + results.insertId);
        } else {
			res.send("Failed to insert new Post: " + err)
            //res.sendStatus(500)
            //return
        } 
	})
	*/
	/*
	const firstName = req.body.create_first_name
	const lastName = req.body.create_last_name
  
	const queryString = "INSERT INTO user_profile (user_name, first_name, last_name) VALUES (?, ?, ?)"
	getConnection().query(queryString, [firstName, firstName, lastName], (err, results, fields) => {
	  if (err) {
		console.log("Failed to insert new user: " + err)
		res.sendStatus(500)
		return
	  }
	  var newUserID = results.insertId;
	  console.log("Inserted a new user with id: ", results.insertId);
  
	  res.end()
	})
*/
	//let postResponse = await Post.postText(req, res);

	/*
	try {
		let response = await hello();
		console.log(response);
	  } catch (err) {
		console.log('That did not go well.')
	  }
	  */
	//res.send(postResponse);



//DOOO 
/*
function newGetUser(myUser) {
	return new Promise((resolve, reject) => {
			if(myUser == "frodo") {
				resolve("It worked you are frodo")    
			} else {
				reject('you are not frodo!')
			}
		})  
}


function getUserName() {
	
	//Database
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '2'";
	let returnUser = "error";
    return new Promise((resolve, reject) => {
		connection.query(queryString, (err, rows, fields) => {
			const users = rows.map((row) => {
				return {
					userName: row.user_name,
					firstName: row.first_name,
					lastName: row.last_name
				}
			});
			returnUser = users[0].userName;
			console.log("DATABASE " + returnUser)
					
			if(returnUser !== "frodo") {
				resolve(returnUser)    
				//resolve('Hiya Matt (RESOLVED)! ' + userName)
			} else {
				reject('Wrong!')
			}
		})  

		
    })
}
*/


/*

//LEARNING
//Function A2: Post Learning 
async function postLearning(req, res) {
	const postCaption = req.body.postCaption 
	const postFrom = req.body.postFrom 
	const connection = db.getConnection(); 
	var userResponse = {
		userOutcome: 0,
		errors: [],
		userData: {}
	}

	//Create Query 
	let userId = req.params.id;
	const queryString = "SELECT user_name, email, first_name, last_name FROM user_profile WHERE user_id = '1'";
	connection.query(queryString, [userId], (err, rows, fields) => {

		if (!err) {
			console.log("worked!");

			//Format data
			const users = rows.map((row) => {
			return {
				userName: row.user_name,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name
				}
			});

			userResponse.userOutcome = 1;
			userResponse.userData = users;

		} else {
			console.log("Failed to query for users: " + err);
			userResponse.errors.push("Failed to query for users: " + err)
			//res.sendStatus(500);
			//res.end();
		}
	   res.json(userResponse)
   
	}) 
		
		
	
	//WORKING: The catch is for a rejected promise
	try {
		const userName = await getUserName();
		console.log("YAYYAAY RESPONSE: " + userName);	

	} catch (error) {
		console.log('That did not go well.')
	}
	res.json(postCaption);
	
}
*/
/*

function makeRequest(location) {
    return new Promise((resolve, reject) => {
        console.log(location);
        if(location === "osu") {          
            resolve('Hiya!')
        } else {
            reject('Wrong!')
        }
    })
}
*/












	//createMyNotification();
	//console.log("DV: postLearning Called");
	//let users = await createNotification();
	//console.log(users.data);










/*

function hello() { 
	return new Promise(async function(resolve, reject) {
		const connection = db.getConnection(); 
	
		try {
			const queryString = "SELECT auser_name, first_name, last_name FROM user_profile WHERE user_id = '2'";
	
			connection.query(queryString, (_err, rows, fields) => {
				
				const users = rows.map((row) => {
					return {
						userName: row.user_name,
						firstName: row.first_name,
						lastName: row.last_name
					}
				});
				
  				//resolve(users[0].userName);
				resolve(rows);
			})  
	
		} catch(err) {
			console.log("error " + err)
			reject("no worky!!")
	
		} finally {
			console.log("finally")
			
		}
	});
};

*/
	/*
	const connection = db.getConnection(); 
	return new Promise(async function(resolve, reject) {
		const connection = db.getConnection(); 
		try {
			const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '2'";

			connection.query(queryString, (err, rows, fields) => {
				const users = rows.map((row) => {
					return {
						userName: row.user_name,
						firstName: row.first_name,
						lastName: row.last_name
					}
				});
				let userName = users[0].userName;
				
			})  
			resolve(userName);
		
		} catch (err) {
			reject("no worky!")

		}

	  });
	  */



/*
async function postText(req, res) {
	const connection = db.getConnection(); 
	console.log("DV: postText Called")
	//Logic Flow


    //STEP 1: Insert into posts table
	const masterSite = req.body.masterSite 
    const postType = req.body.postType 
    const groupID = req.body.groupID 
    const listID = req.body.listID 
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
	const postStatus = 1;

	//Posts.newPost(post)

	//STEP 2: Add New Text Notifications 
	const notificationMessage = req.body.notificationMessage;
	const notificationLink = req.body.notificationLink;
	const notificationType = req.body.notificationType;
	
	const newNotification = {
		masterSite: masterSite,
		notificationFrom: postFrom,
		notificationTo: postTo,
		notificationMessage: notificationMessage,
		notificationLink: notificationLink,
		notificationType: notificationType,
		groupID: groupID,
	}
	//Notification.createPostNotification(newNotification);
	//createPostNotification(newNotification);
	createMyNotification();
	res.send(newNotification);
	
}




////
//createPostNotification(newNotification);
async function createMyNotification() {
  try {
    let userObject = await getUsers();
	console.log("USER")
	console.log("_________________________")
    console.log(userObject);
	console.log("_________________________")
} catch (err) {
    console.log('Opps, an error occurred', err);
  }
}


async function getUsers() {
  let matty = await getMatt();

  //DATABASE
  return new Promise(async function(resolve, reject) {
    const connection = db.getConnection(); 
	//SUCCESS
	try {
		const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '1'";
		
		//catch error err!
		connection.query(queryString, (err, rows, fields) => {
			const users = rows.map((row) => {
				return {
					userName: row.user_name,
					firstName: row.first_name,
					lastName: row.last_name
				}
			});

			//Get 
			let davey = users[0].userName;
			let allUsers = [davey, matty];
			let outcome = "success";
			let final = {
				users: allUsers,
				outcome: outcome
			}
			resolve(final);	
			/*
			let hiyaUsers = {
				dv: davey,
				mv: matty
			}
			*//*
			//resolve(outcome);
		})  

	//FAILURE
	} catch(err) {
		console.log("error " + err)
		let allUsers = [];
		let outcome = "failure";
		let final = {
			users: allUsers,
			outcome: outcome
		}
		resolve(final);	
	} finally {
		console.log("finally")
		
	}

  });
}



function getMatt() {
	return new Promise(async function(resolve, reject) {
	  const connection = db.getConnection(); 
  
	  try {
		  const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '2'";
  
		  connection.query(queryString, (err, rows, fields) => {
			  const users = rows.map((row) => {
				  return {
					  userName: row.user_name,
					  firstName: row.first_name,
					  lastName: row.last_name
				  }
			  });

			  resolve(users[0].userName);
		  })  
  
	  } catch(err) {
		  console.log("error " + err)
  
	  } finally {
		  console.log("finally")
		  
	  }
  
	});
  }
  
  
*/



///
/*

function createNotification() {
	const connection = db.getConnection(); 
	const groupID = 77;
	getGroupUsers(groupID);


	const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '1'";

	return new Promise(resolve => {
		const response = {}

		connection.query(queryString, (err, rows) => {

			//SUCCESS
			if (!err) {
				const users = rows.map((row) => {
					return {
						userName: row.user_name,
						firstName: row.first_name,
						lastName: row.last_name
					}
				});
				console.log(users)
				
				const currentUser = users[0].userName;

		
				response.status = 200
				response.data = currentUser;
			
			//FAILURE
			} else {
				console.log("Failed to Select Users from this Group " + err)
				response.status = 500
				response.data = groupUsers;
			}	
			resolve(response);	
			//console.log(groupUsers);
		})
	});	

 */
///


/*
const oracledb = require('oracledb');        
const dbConfig = require('./db-config.js');      
const employees = require('./employees.js');

async function startApp() {
  try {
    await oracledb.createPool(dbConfig);

    let emp = await employees.getEmployee(101);

    console.log(emp);
  } catch (err) {
    console.log('Opps, an error occurred', err);
  }
}

startApp();

const oracledb = require('oracledb');

function getEmployee(empId) {
  return new Promise(async function(resolve, reject) {
    let conn; // Declared here for scoping purposes.

    try {
      conn = await oracledb.getConnection();

      console.log('Connected to database');

      let result = await conn.execute(
        `select *
        from employees
        where employee_id = :emp_id`,
        [empId],
        {
          outFormat: oracledb.OBJECT
        }
      );

      console.log('Query executed');

      resolve(result.rows[0]);
    } catch (err) {
      console.log('Error occurred', err);

      reject(err);
    } finally {
      // If conn assignment worked, need to close.
      if (conn) {
        try {
          await conn.close();

          console.log('Connection closed');
        } catch (err) {
          console.log('Error closing connection', err);
        }
      }
    }
  });
}

module.exports.getEmployee = getEmployee;

*/
////
/*
function createNotification() {
	const connection = db.getConnection(); 
	const groupID = 77;
	getGroupUsers(groupID);


	const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '1'";

	return new Promise(resolve => {
		const response = {}

		connection.query(queryString, (err, rows) => {

			//SUCCESS
			if (!err) {
				const users = rows.map((row) => {
					return {
						userName: row.user_name,
						firstName: row.first_name,
						lastName: row.last_name
					}
				});
				console.log(users)
				
				const currentUser = users[0].userName;

		
				response.status = 200
				response.data = currentUser;
			
			//FAILURE
			} else {
				console.log("Failed to Select Users from this Group " + err)
				response.status = 500
				response.data = groupUsers;
			}	
			resolve(response);	
			//console.log(groupUsers);
		})
	});	
*/

	/*
	//const groupID = 77;
	console.log("createNotification");
	//getGroupUsers(groupID);
	const connection = db.getConnection(); 
	//const notification = { notificationCaption: "hiya"}
	
	
	//Select User
	const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '1'";
	connection.query(queryString, (err, rows, fields) => {
	
		//Handle Error 
		if (err) {
			console.log("Failed to query for users: " + err);
			res.sendStatus(500);
			res.end();
		}
	 
		//Format data
		const users = rows.map((row) => {
			return {
				userName: row.user_name,
				firstName: row.first_name,
				lastName: row.last_name
			}
		});
		
		const currentUser = users.userName;
		console.log(currentUser);
		//let users = "davey"
		//return users;
	
	})  	
	*/ /*

}
*/
/*

function getGroupUsers(groupID) {
	console.log("getGroupUsers " + groupID)	

}
*/

//APP

//Function A1: Post Text 
/*
async function postText(req, res) {
    const connection = db.getConnection(); 
	console.log("DV: postText Called")

    //STEP 1: Insert into posts table
	const masterSite = req.body.masterSite 
    const postType = req.body.postType 
    const groupID = req.body.groupID 
    const listID = req.body.listID 
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
	const postStatus = 1;


	//STEP 2: Add New Text Notifications 
	const notificationMessage = req.body.notificationMessage;
	const notificationLink = req.body.notificationLink;
	const notificationType = req.body.notificationType;
	
	const newNotification = {
		masterSite: masterSite,
		notificationFrom: postFrom,
		notificationTo: postTo,
		notificationMessage: notificationMessage,
		notificationLink: notificationLink,
		notificationType: notificationType,
		groupID: groupID,
	}
	Notification.createPostNotification(newNotification);

	res.send(newNotification);
	
*/
	//WORKS
	/*
    const queryString = "INSERT INTO posts (master_site, post_type, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?)"
    
    connection.query(queryString, [masterSite, postType, postFrom, postTo, postCaption], (err, results, fields) => {
        if (!err) {
			
			//STEP 2: Create Notifications
			const newNotification = {
				masterSite: masterSite,
				notificationFrom: postFrom,
				notificationTo: postTo,
				notificationMessage: notificationMessage,
				notificationLink: notificationLink,
				notificationType: notificationType,
				groupID: groupID,
			}
			console.log(newNotification)

			//Notification.createNotification(newNotification);
			//res.send("POST DATA: " + postFrom + " " + postTo + " " + postCaption)

			//Send Response
			console.log("You created a new Post with ID " + results.insertId);
			res.send("LAST: It worked " + results.insertId);
        } else {
			console.log("Failed to insert new Post: " + err)
            res.sendStatus(500)
            return
        } 
    }) 
	*/
	/*
}

module.exports = { postText, postLearning };

/*
	//STEP 2: Add New Text Notifications 
	$notification_message = $_POST["notification_message"];
	$notification_link    = $_POST["notification_link"];	
	$notification_type    = $_POST["notification_type"];	
	$notification_from    = $post_from;
	
	$Current_Notification = new Notifications($logged_in_user);
	$notification_to_array = getActiveGroupMembers($group_id);
	$notification_to_count = count($notification_to_array);

	//Loop Through all Group Member and Send them a Notification 
	for($x = 0; $x < $notification_to_count; $x++) {
		$notification_to = $notification_to_array[$x];				
		$Current_Notification->createGroupNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type, $group_id);
	}		
	
*/







/*
function getGroupUsers(groupID) {
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
	console.log("calling");

	return new Promise(resolve => {
		const response = {}
		const groupUsers = new Set();

		connection.query(queryString,[groupID], (err, rows) => {
			if (!err) {
				rows.map((row) => {
					groupUsers.add(row.user_name)  
				});
				response.status = 200
				response.data = groupUsers;
			} else {
				console.log("Failed to Select Users from this Group " + err)
				//res.sendStatus(500)
				response.status = 500
				response.data = groupUsers;
			}	
			resolve(response);	
			//console.log(groupUsers);
		})
	});	

}
*/


//APPENDIX
	
	/*
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
	
	var groupUsersSet = new Set();
	var groupUsersResponse = {
		outcome: 0,
		groupUsers: [],
		errors: [],
	}

	//GET GROUP USERS
	return new Promise(async function(resolve, reject) {
		try {
			
			connection.query(queryString, [groupID], (err, rows) => {
				
				if (!err) {
					rows.map((row) => {
						groupUsersSet.add(row.user_name) 
					}); 
					groupUsersResponse.outcome = 1;
					groupUsersResponse.groupUsers = Array.from(groupUsersSet);    
				} else {
					console.log("error getting group users")    
					groupUsersResponse.outcome = "no worky"
					groupUsersResponse.errors.push(err);
				} 
				
				resolve(groupUsersResponse);
			}) 
			
		} catch(err) {
			groupUsersResponse.outcome = "rejected";
			console.log("REJECTED ");
			reject(groupUsersResponse);
		} 
		
		//resolve(groupUsersResponse);
	});
	*/

/*
	$logged_in_user 		= $_POST["logged_in_user"];	
	$master_site 			= $_POST["master_site"];	
	$group_name 			= $_POST["group_name"]; 
	$notification_message 	= $_POST["notification_message"];	
	$notification_link 		= $_POST["notification_link"];	
	$notification_type 		= $_POST["notification_type"];	
	$notification_from 		= $_POST["notification_from"];	
	$selected_friends 		= $_POST["selected_friends"];	
	$selected_friends_count = count($selected_friends);	
	$group_key				= uniqid(microtime(),1);
	$request_type			= "new_group";

	//STEP 1: Create New Group 
	//Part 1: Create new group and insert into groups table 
	$insert = $conn->prepare("INSERT INTO groups (group_type, created_by, group_key, group_name) VALUES (?,?,?,?) ");
	$insert->bind_param('ssss', $request_type, $logged_in_user, $group_key, $group_name);
	
	//Part 2: Select group ID and use this to populate the rest of the fields		
	if ($insert->execute()) {
		$query = "SELECT group_id FROM groups WHERE group_key ='$group_key' AND created_by = '$logged_in_user' LIMIT 1";
		$result = mysqli_query($conn, $query);
		$row = mysqli_fetch_assoc($result);
		$new_group_id = $row['group_id'];
		$group_id = $row['group_id'];
	}

	//Part 3: Create a Class and Add all Users to this Group
	$Current_Group = new Group($new_group_id);
	$Current_Group->createGroupExistingUsers($request_type, $logged_in_user, $selected_friends, $new_group_id, $group_key);	

	//STEP 2: Create Requests 
	for($x = 0; $x < $selected_friends_count; $x++) {
		$friend_invited_current = $selected_friends[$x];
		$Current_Request = new Requests($logged_in_user);	
		echo $Current_Request->createGroupPendingRequest($master_site, $group_id, $logged_in_user, $friend_invited_current);			
	}
		
	//STEP 3: Create Notifications 
	$Current_Notification = new Notifications($logged_in_user);
	for($x = 0; $x < $selected_friends_count; $x++) {
		$notification_to = $selected_friends[$x];
		echo $Current_Notification->createGroupInviteNotification($master_site, $notification_from, $notification_to, $notification_message, $notification_link, $notification_type, $group_id);
	}	

	*/



	
	//res.json({test: "test"})
    /* 
			
			////
			newNotification = {
				masterSite: "kite",
				notificationFrom: req.body.currentUser,
				notificationMessage: req.body.notificationMessage,
				notificationLink: req.body.notificationLink,
				notificationType: req.body.notificationType,
				groupID: groupOutcome.groupID
			}
			Notification.createGroupNotification(newNotification);
			
			console.log("notification " + groupOutcome.groupID);
			console.log("request " + groupOutcome.groupID);
			
	if(groupOutcome.outcome == 1) {
		console.log("worked!")
		res.json(groupOutcome);
	} else {
		console.log("no worked!")
		res.json(groupOutcome)
	}
			//
		//

		//Create Notifications and Requests



	var postOutcome = {};
	
	//STEP 1: Create Post
	postOutcome = await Post.createPostText(req);
	console.log("YOUR NEW POST ID! " + postOutcome.postID)

	//STEP 2: Create Notification
	if(postOutcome.outcome == 1) {
		Notification.createGroupNotification(req);
		Requests.createGroupRequest(req);
		res.json(postOutcome);
	} else {
		console.log(postOutcome);
		res.sendStatus(500);
		return 
	}
	 */

	/*
	async function fetchAndUpdatePosts() {
	const posts = await fetchPosts().catch(() => {
		console.log('error in fetching posts');
	});
	
	if (posts) {
		doSomethingWithPosts(posts);
	}
	} 
	*/


	//WORKS NEED TO MOVE 
	/*



	//Part 2: Select group ID and use this to populate the rest of the fields		


	//Part 3: Create a Class and Add all Users to this Group

	//STEP 2: Create Requests 

		
	//STEP 3: Create Notifications 
	*/




























//APPENDIX

/*
	//PROMISE RETURN
	return new Promise((resolve, reject) => {
		
		//Make Query 
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

			//Resolve Promise
			if(groupUsersResponse.outcome != 0) {
				resolve(groupUsersResponse); 
			} else {
				reject(groupUsersResponse);
			}

		})  

	})  
*/
	





/*
function simpleGetGroupUsers(groupID) {
	console.log("get group users for " + groupID);
	var groupUsersResponse = {
		outcome: 1,
		groupUsers: ["davey"],
		errors: [],
	}

	return new Promise((resolve, reject) => {
		if(groupID == 77) {
			resolve(groupUsersResponse); 
		} else {
			groupUsersResponse.outcome = 0;
			reject(groupUsersResponse);
		}
	})  
}
function simpleGET() { 
	//WORKS
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
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
}
*/






/*
	return new Promise((resolve, reject) => {
		const connection = db.getConnection(); 
		const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
	
		var groupUsersResponse = {
			outcome: 1,
			groupUsers: ["davey"],
			errors: [],
		}
*/
		
  //DATABASE
  /*
  return new Promise(async function(resolve, reject) {
    const connection = db.getConnection(); 
	
	//SUCCESS
	try {
		const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '1'";
		
		//catch error err!
		connection.query(queryString, (err, rows, fields) => {
			const users = rows.map((row) => {
				return {
					userName: row.user_name,
					firstName: row.first_name,
					lastName: row.last_name
				}
			});

			//Get 
			let davey = users[0].userName;
			let allUsers = [davey];
			let outcome = "success";
			let final = {
				users: allUsers,
				outcome: outcome
			}
			resolve(final);	
	
		})  

	//FAILURE
	} catch(err) {
		console.log("error " + err)
		let allUsers = [];
		let outcome = "failure";
		let final = {
			users: allUsers,
			outcome: outcome
		}
		reject(final);	
	} 
	*/

		/*

		//Outcome
		if(groupUsersResponse.outcome = 1) {
			resolve(groupUsersResponse)    
		} else {
			reject(err)
		}

		//Try to Fetch the Data Here
		connection.query(queryString, [userId], (err, rows, fields) => {
			if (!err) {
				console.log("worked!");
		
			} else {
				console.log("Failed to query for users: " + err);
			}

		}) 
		*/
	
		/*
			var userResponse = {
		userOutcome: 0,
		errors: [],
		userData: {}
	}

	//Create Query 
	let userId = req.params.id;
	const queryString = "SELECT user_name, email, first_name, last_name FROM user_profile WHERE user_id = '1'";
	connection.query(queryString, [userId], (err, rows, fields) => {

		if (!err) {
			console.log("worked!");

			//Format data
			const users = rows.map((row) => {
			return {
				userName: row.user_name,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name
				}
			});

			userResponse.userOutcome = 1;
			userResponse.userData = users;

		} else {
			console.log("Failed to query for users: " + err);
			userResponse.errors.push("Failed to query for users: " + err)
			//res.sendStatus(500);
			//res.end();
		}
	   res.json(userResponse)
   
	}) 
		
		*/
		/*
		
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";

	connection.query(queryString,[groupID], (err, rows) => {
		if (err) {
			console.log("Failed to Select Users from this Group " + err)
			res.sendStatus(500)
			return
		}
		const groupUsers = new Set()

		rows.map((row) => {
			groupUsers.add(row.user_name)  

		});
		//console.log(groupUsers);
		return groupUsers;
	})  
		*/
		/*
		const groupUsers = new Set()
		groupUsers.add("davey")  
		groupUsers.add("sam")
		groupUsersOutcome.outcome = 1;
		groupUsersOutcome.groupUsers = groupUsers;
		*/



/*

function getGroupUsersORIGINAL(groupID) {
	console.log("get group users for " + groupID)
	
	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
	console.log("calling");

	return new Promise(resolve => {
		const response = {}
		const groupUsers = new Set();

		connection.query(queryString,[groupID], (err, rows) => {
			if (!err) {
				rows.map((row) => {
					groupUsers.add(row.user_name)  
				});
				response.status = 200
				//let array = Array.from(mySet);
				response.data = Array.from(groupUsers);
			} else {
				console.log("Failed to Select Users from this Group " + err)
				//res.sendStatus(500)
				response.status = 500
				response.data = groupUsers;
			}	
			resolve(response);	
			//console.log(groupUsers);
		})
	});	
	
}
*/

/*

function getMatt() {
	return new Promise(async function(resolve, reject) {
	  const connection = db.getConnection(); 
  
	  try {
		  const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '2'";
  
		  connection.query(queryString, (err, rows, fields) => {
			  const users = rows.map((row) => {
				  return {
					  userName: row.user_name,
					  firstName: row.first_name,
					  lastName: row.last_name
				  }
			  });

			  resolve(users[0].userName);
		  })  
  
	  } catch(err) {
		  console.log("error " + err)
  
	  } finally {
		  console.log("finally")
	  }
  
	});
  }
  */

/*
// Function A1: Get Group Users (Make Async)
function getGroupUsers(groupID) {

	const connection = db.getConnection(); 
	const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";

	connection.query(queryString,[groupID], (err, rows) => {
		if (err) {
			console.log("Failed to Select Users from this Group " + err)
			res.sendStatus(500)
			return
		}
		const groupUsers = new Set()

		rows.map((row) => {
			groupUsers.add(row.user_name)  

		});
		//console.log(groupUsers);
		return groupUsers;
	})  
	
	const groupUsers = new Set()
	groupUsers.add("davey")  
	groupUsers.add("sam")
	

	//return groupUsers;
}
*/

//APPENDIX
/*

        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const postCaption = req.body.postCaption 
        const queryString = "INSERT INTO posts (master_site, post_type, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?)"
    
        connection.query(queryString, [masterSite, postType, postFrom, postTo, postCaption], (err, results, fields) => {
            if (!err) {
                console.log("You created a new Post with ID " + results.insertId);
   
            } else {    
                console.log("No worky");    
                //res.sendStatus(500)
                //return
            } 
        }) 
        */


/*



    //Method A2: Make a Post
    static async postTextOld(req)  {
        const connection = db.getConnection(); 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const postCaption = req.body.postCaption 
        
        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "SELECT user_name, first_name, last_name FROM user_profile WHERE user_id = '2'";
        
                connection.query(queryString, (err, rows, fields) => {
                    const users = rows.map((row) => {
                        return {
                            userName: row.user_name,
                            firstName: row.first_name,
                            lastName: row.last_name
                        }
                    });
      
                    resolve(users[0].userName);
                })  
        
            } catch(err) {
                console.log("error " + err)
                reject("error")
        
            } finally {
                console.log("finally")
                
            }
        
          });

    }
 */
        /*
        const connection = db.getConnection(); 
        const queryString = "SELECT user_name FROM group_users WHERE group_id = ? AND active_member = '1'";
        console.log("calling");
    
        return new Promise(resolve => {
            const postResponse = {}
            const groupUsers = new Set();
    
            connection.query(queryString,[groupID], (err, rows) => {
                if (!err) {
                    rows.map((row) => {
                        groupUsers.add(row.user_name)  
                    });
                    postResponse.status = 200
                    postResponse.data = groupUsers;
                } else {
                    console.log("Failed to Select Users from this Group " + err)
                    //res.sendStatus(500)
                    postResponse.status = 500
                    postResponse.data = groupUsers;
                }	
                resolve(response);	
        
            })
        });	
        */
        /*
        //console.log("POST DATA!: " + postFrom + " " + postTo + " " + postCaption);

        const postResponse = {
            status: 200,
            postStatus: "success"
        }

        return postResponse;
        */

/*
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
*/

/*
static async createPostTextNOWORK(req)  {
    const connection = db.getConnection(); 
    const masterSite = req.body.masterSite 
    const postType = req.body.postType 
    const postFrom = req.body.postFrom 
    const postTo = req.body.postTo 
    const postCaption = req.body.postCaption 
        
    var postOutcome = {
        outcome: "success",
        postID: 1,
        errors: []
    }
    //INSERT POST
    return new Promise(async function(resolve, reject) {

            const queryString = "INSERT INTO posts (master_site, post_type, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?)"

            connection.query(queryString, [masterSite, postType, postFrom, postTo, postCaption], (err, results, fields) => {
                if (!err) {
                    console.log("You created a new Post with ID " + results.insertId);
                    
                } else {    
                    console.log("No worky");   
                    console.log(err); 
                    postOutcome.outcome = "no worky"
                    //res.sendStatus(500)
                    //return
                } 
               
            }) 
    
        if(1 == 2) {
            resolve(postOutcome);
        } else {
            console.log("error " + err)
            reject(err)
        }
    
 
    
      });
}
*/
/*

            
 
            //Output Data
            const users = rows.map((row) => {
                return {
                    userName: row.user_name,
                    email: row.email,
                    firstName: row.first_name,
                    lastName: row.last_name
                }
            });

            res.json(rows);
            res.end()
 
class Post {
    constructor(postID) {
        this.postID = postID;

    }

    get postFrom() {
        return this.postFrom;
    }

    set postFrom(postFrom) {
        this.postFrom = postFrom;
    }    
   
}
 
module.exports = Post;
 
 

class Post {
    constructor(postInput) {
        this.post = postInput.post || 1;
        this.post_from = postInput.post_from || '';
        this.post_to = postInput.post || '';
        this.post_caption = postInput.post_caption || '';

    }

    get post() {
        return this.post;
    }



    get post_from () {
        return this.post_from;
    }

    set post_from(post_from) {
        this.post_from = post_from;
    }

    get post_caption () {
        return this.post_caption;
    }

    set post_caption(post_caption) {
        this.post_caption = post_caption;
    }

      //Method A1: Get User Info 
    getPostInfo() {
        console.log("Hiya Davey!");
    }
  

}

*/
//const Post = require('../../model/config-group');

//let currentPost = new Post(postInput);
 


