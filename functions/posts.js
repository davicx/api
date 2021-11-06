const db = require('./conn');
const Notification = require('./classes/Notifications');
const Post = require('./classes/Post')
const groupFunctions = require('./groups')

//const groupFunctions = require('./groups')

/*
FUNCTIONS A: All Functions Related to Making a Post
	1) Function A1: Post Text  
	2) Function A2: Post a Photo
	3) Function A3: Post a Video
	4) Function A4: Post an Article
	5) Function A5: Post a File 

FUNCTIONS B: All Functions Related to Getting Posts
	1) Function B1: Get Posts to a Group
	2) Function B2: Get Posts to a User
	3) Function B3: Get Single Post by ID 
	4) Function B4: Get all Posts  

*/

//FUNCTIONS A: All Functions Related to Making a Post
//Function A1: Post Text
async function postText(req, res) {
	var postOutcome = {};
	
	//STEP 1: Create Post
	postOutcome = await Post.createPostText(req);

	//STEP 2: Create Notification
	if(postOutcome.outcome == 1) {
		//Notification.createGroupPostNotification(req);
	}

	res.json(postOutcome);
	
}

//Function A2: Post a Photo
function postPhoto(req, res) {
	console.log("You posted a Photo!")

	res.json(req.body);
	
}

//Function A3: Post a Video
function postVideo(req, res) {
	console.log("You posted a Video!")

	res.json(req.body);
	
}

//FUNCTIONS B: All Functions Related to Getting Posts
//Function B1: Get Posts to a Group
function getGroupPosts(req, res) {
    const connection = db.getConnection(); 
	const groupID = req.params.group_id;
	console.log("groupID " + groupID);
    
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
}


//Function B2: Get Posts to a User
function getUserPosts(req, res) {
    const connection = db.getConnection(); 
	const userName = req.params.user_name;
	console.log("user_name " + userName);
    
	//const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE group_id = ? ORDER BY post_id DESC";
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_to = ? ORDER BY post_id DESC";
	var userPosts = {
		posts: [],
		outcome: 0,
		errors: []
	}

    connection.query(queryString, [userName], (err, rows) => {
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
			userPosts.posts = posts;
			userPosts.outcome = 1;
			res.json({userPosts: userPosts});
	   
		} else {
            console.log("Failed to Select Posts" + err)
            //res.sendStatus(500)
            //return
			res.setHeader('Access-Control-Allow-Origin', '*');
			userPosts.errors.push(err);
			res.json({userPosts: userPosts});
		}
    })  
}

//Function B3: Get Single Post by ID 
function getSinglePost(req, res) {
    const connection = db.getConnection(); 
	const postID = req.params.post_id;
	console.log("postID " + postID);
    
	//const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE group_id = ? ORDER BY post_id DESC";
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_id = ? ORDER BY post_id DESC";
	var singlePost = {
		outcome: 0,
		errors: []
	}

    connection.query(queryString, [postID], (err, rows) => {
        if (!err) {
			const post = {
				postID: rows[0].post_id,
				postFrom: rows[0].post_from,
				postTo: rows[0].post_to,
				postCaption: rows[0].post_caption
			}
	
			res.setHeader('Access-Control-Allow-Origin', '*');
			singlePost.post = post;
			singlePost.outcome = 1;
			res.json({singlePost: singlePost});
	   
		} else {
            console.log("Failed to Select Posts" + err)
            //res.sendStatus(500)
            //return
			res.setHeader('Access-Control-Allow-Origin', '*');
			singlePost.errors.push(err);
			res.json({singlePost: singlePost});
		}
    })  

}


//Function B4: Get all Posts  
function getAllPosts(req, res) {
	const connection = db.getConnection(); 
	const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts ORDER BY post_id DESC LIMIT 10";

	connection.query(queryString, (err, rows) => {
		if (err) {
			console.log("Failed to Select Posts" + err)
			res.sendStatus(500)
			return
		}

		const posts = rows.map((row) => {
			return {
				postID: row.post_id,
				postFrom: row.post_from,
				postTo: row.post_to,
				postCaption: row.post_caption
			}
		});

		res.setHeader('Access-Control-Allow-Origin', '*');
		res.json(posts);

	})  
}


module.exports = { postText, postPhoto, postVideo, getGroupPosts, getSinglePost, getAllPosts, getUserPosts};












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
