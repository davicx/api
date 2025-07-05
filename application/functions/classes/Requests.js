const db = require('./../conn');

/*
FUNCTIONS B: REQUEST RELATED	
	1) Method B1: Accept Friend Request
	2) Method B2: Decline Friend Request
	3) Method B3: Accept Group Request
	4) Method B4: Decline Group Request
	5) Method B5: Accept List Request
	6) Method B6: Decline List Request
*/

//Need a method to clean requests find all unaccepted invites and add to that user in case there was a mistake
class Requests {
    constructor(requestID) {
        this.requestID = requestID;
    }
    
    //METHODS A: REQUEST RELATED
    //Method A1: Create a Request 
	static async newSingleRequest(newRequest)  {
		const connection = db.getConnection(); 
		const masterSite = "kite";
        const requestType = newRequest.requestType;
        const requestTypeText = newRequest.requestTypeText;
        const requestIsPending = 1;
		const requestFrom = newRequest.sentBy;
        const requestTo = newRequest.sentTo;
        const groupID = newRequest.groupID;

        //Create request 
		if(requestTo != requestFrom) {
	
			//Step 1: Check if there is already a request 
			const queryString = "SELECT COUNT(*) AS requestCount FROM pending_requests WHERE request_type = ? AND sent_by = ? AND sent_to = ? AND request_is_pending = '1' AND group_id = ?"			
			const insertString = "INSERT INTO pending_requests (master_site, request_type, request_type_text, request_is_pending, sent_by, sent_to, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)"

			connection.query(queryString, [newRequest.requestType, requestFrom, requestTo, groupID], (err, rows) => {
				if (!err) {

					//Step 2: Insert Record if it is new 
					const existingRequestCount = rows[0].requestCount;	
							
					if(existingRequestCount == 0) {
						//console.log("MAKEY " + requestTo + " " + existingRequestCount);
						connection.query(insertString, [masterSite, requestType, requestTypeText, requestIsPending, requestFrom, requestTo, groupID], (err, results) => {
							if (!err) {
								console.log("You created a new Request with ID " + results.insertId);    
							} else {    
								console.log(err)
							} 
						}) 			
					} else {
						console.log("NO MAKEY: there is already a request to " + requestTo  + " " + existingRequestCount);
					}

				} else {
					console.log("Failed to Select Requests: " + err);
				}
			})
		}
        
		
	//Function End
    }
	
    //Method A2: Create a Group Request 
    static async newGroupRequest(newRequest)  {
		const masterSite = "kite";
        const connection = db.getConnection(); 
        const requestType = newRequest.requestType;
        const requestTypeText = newRequest.requestTypeText;
        const requestIsPending = 1;
        const groupUsers = newRequest.sentTo;
        const requestFrom = newRequest.sentBy;
        const groupID = newRequest.groupID;

        //Create request and Loop over members
        for(let i = 0; i < groupUsers.length; i++) {
			let requestTo =  groupUsers[i];
			if(requestTo != requestFrom) {
		
				//Step 1: Check if there is already a request 
				const queryString = "SELECT COUNT(*) AS requestCount FROM pending_requests WHERE request_type = ? AND sent_by = ? AND sent_to = ? AND request_is_pending = '1' AND group_id = ?"			
				const insertString = "INSERT INTO pending_requests (master_site, request_type, request_type_text, request_is_pending, sent_by, sent_to, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)"

				connection.query(queryString, [newRequest.requestType, requestFrom, requestTo, groupID], (err, rows) => {
					if (!err) {

						//Step 2: Insert Record if it is new 
						const existingRequestCount = rows[0].requestCount;	
								
						if(existingRequestCount == 0) {
							//console.log("MAKEY " + requestTo + " " + existingRequestCount);
							connection.query(insertString, [masterSite, requestType, requestTypeText, requestIsPending, requestFrom, requestTo, groupID], (err, results) => {
								if (!err) {
									console.log("You created a new Request with ID " + results.insertId + " for user " + requestTo
									);    
								} else {    
									console.log(err)
								} 
							}) 			
						} else {
							console.log("NO MAKEY: there is already a request to " + requestTo  + " " + existingRequestCount);
						}

					} else {
						console.log("Failed to Select Requests: " + err);
					}
				})
			}
        }
		
	//Function End
    }

	//Method A2: Create a Group Request with wait
	static async newGroupRequestWAIT(newRequest) {
		const masterSite = "kite";
		const connection = db.getConnection(); 
		const requestType = newRequest.requestType;
		const requestTypeText = newRequest.requestTypeText;
		const requestIsPending = 1;
		const groupUsers = newRequest.sentTo;
		const requestFrom = newRequest.sentBy;
		const groupID = newRequest.groupID;

		const queryString = "SELECT COUNT(*) AS requestCount FROM pending_requests WHERE request_type = ? AND sent_by = ? AND sent_to = ? AND request_is_pending = '1' AND group_id = ?"			
		const insertString = "INSERT INTO pending_requests (master_site, request_type, request_type_text, request_is_pending, sent_by, sent_to, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)"

		// helper to run query as a promise
		function queryAsync(query, params) {
			return new Promise((resolve, reject) => {
				connection.query(query, params, (err, rows) => {
					if (err) reject(err);
					else resolve(rows);
				});
			});
		}

		//Create request and Loop over members
		for(let i = 0; i < groupUsers.length; i++) {
			let requestTo =  groupUsers[i];
			if(requestTo != requestFrom) {
				try {
					//Step 1: Check if there is already a request 
					const rows = await queryAsync(queryString, [requestType, requestFrom, requestTo, groupID]);

					//Step 2: Insert Record if it is new 
					const existingRequestCount = rows[0].requestCount;	

					if(existingRequestCount == 0) {
						const insertResult = await queryAsync(insertString, [masterSite, requestType, requestTypeText, requestIsPending, requestFrom, requestTo, groupID]);
						console.log("You created a new Request with ID " + insertResult.insertId + " for user " + requestTo);    
					} else {
						console.log("NO MAKEY: there is already a request to " + requestTo  + " " + existingRequestCount);
					}
				} catch (err) {
					console.log("Request Error for user " + requestTo + ": " + err);
				}
			}
		}

		//Function End
	}

	//Method A3: Delete a Request
	static async deleteSingleRequest(requestType, sentBy, sentTo)  {
		const connection = db.getConnection(); 
		//request_type sent_by sent_to  friend_request

        var deleteRequestStatus = {
            requestRemoved: false,
            requestType: requestType,
            currentUser: sentBy,
            friendName: sentTo,
            errors: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "DELETE FROM pending_requests WHERE request_type = ? AND sent_by = ? AND sent_to = ?"

                connection.query(queryString, [requestType, sentBy, sentTo], (err) => {
                    if (!err) {
                        deleteRequestStatus.requestRemoved = true;

                        resolve(deleteRequestStatus);
                    } else {
                        console.log(err)
                        deleteRequestStatus.errors.push(err);
                        resolve(deleteRequestStatus);
                    }
                })  
            } catch(err) {
                console.log(err)
                deleteRequestStatus.errors.push(err);
                reject(deleteRequestStatus);
            } 
        });
	
    }

	

//Class End 
}

module.exports = Requests;

