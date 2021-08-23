const db = require('./conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Get Group Users
	2) Function A2: Get all Groups a User is in 

*/

//Function A1: Get Group Users
function getGroupUsers(groupID) {
	console.log("get group users for " + groupID);
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
	});

}

module.exports = { getGroupUsers };




































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


