const db = require('./../conn');

class Requests {
    constructor(requestID) {
        this.requestID = requestID;
    }
    
    //METHODS A: REQUEST RELATED
    //Method A1: Create a Request 
    
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
									console.log("You created a new Request with ID " + results.insertId);    
								} else {    
									console.log(err)
								} 
							}) 			
						} else {
							console.log("NO MAKEY " + requestTo  + " " + existingRequestCount);
						}

					} else {
						console.log("Failed to Select Requests: " + err);
					}
				})
			}
        }
		
	//Function End
    }
//Class End 
}

module.exports = Requests;

