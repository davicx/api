const db = require('./conn');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Requests
	1) Function A1: Get Pending Requests
	2) Function A2: Get Single Request (Check if it exists)
    3) Function A3: Check status of Request
    4) Function A4: Remove Request 


*/


//Function A1: Get All Pending Requests
async function getPendingRequests(userName) {
    const connection = db.getConnection(); 

    var userFriendsOutcome = {
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND user_profile.account_active = 1"
            connection.query(queryString, [userName], (err, rows) => {

                const friendsArray = rows.map((row) => {
                    return {
                        friendUserName: row.friend_user_name,
                        friendID: row.friend_id,
                        friendUserImage: row.image_name
                        
                    }
                });
                
                userFriendsOutcome.friendsArray = friendsArray;

                if (!err) {
                    resolve(userFriendsOutcome); 

                } else {
                    userFriendsOutcome.outcome = 500;
                    resolve(userFriendsOutcome);
                }
            })
        } catch(err) {
            userFriendsOutcome.outcome = 500;
            reject(userFriendsOutcome);
        } 
    })
}

//Function A2: Get Single Request (Check if it exists)
async function getSingleRequest(requestID) {
    const connection = db.getConnection(); 

    var requestOutcome = {
        requestExists: 0,
		request: {},
		errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT * FROM pending_requests WHERE request_id = ?"			
            
            connection.query(queryString, [requestID], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
						requestOutcome.requestExists = 1;
						requestOutcome.request.requestType =  rows[0].request_type;
						requestOutcome.request.requestTypeText =  rows[0].request_type_text;
						requestOutcome.request.requestIsPending =  rows[0].request_is_pending;
						requestOutcome.request.sentBy =  rows[0].sent_by;
						requestOutcome.request.sentTO =  rows[0].sent_to;
                    } else {
						requestOutcome.errors.push("We couldn't find a request with ID " + requestID);
					}

                    resolve(requestOutcome); 

                } else {
                    groupUserStatus.outcome = 500;
                    resolve(requestOutcome);
                }
            })
        } catch(err) {
            groupUserStatus.outcome = 500;
            reject(requestOutcome);
        } 
    })

}

//Function A3: Check status of Request
async function getRequestStatus(sentBy, sentTo, requestType) {
    const connection = db.getConnection(); 

    var requestOutcome = {
        requestExists: false,
        message: "",
		request: {},
		errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
         const queryString = "SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = ? AND sent_to = ? AND request_type = ?";		
            
            connection.query(queryString, [sentBy, sentTo, requestType], (err, rows) => {
                if (!err) {

                    if(rows.length >= 1){
						requestOutcome.requestExists = true;
						requestOutcome.request.requestType =  rows[0].request_type;
						requestOutcome.request.requestTypeText =  rows[0].request_type_text;
						requestOutcome.request.requestIsPending =  rows[0].request_is_pending;
						requestOutcome.request.sentBy =  rows[0].sent_by;
						requestOutcome.request.sentT =  rows[0].sent_to;
                    } else {
						requestOutcome.message = ("We couldn't find a request for " + sentBy + " " + sentTo + " " + requestType);
					}

                    resolve(requestOutcome); 

                } else {
                    requestOutcome.errors.push(err);
                    resolve(requestOutcome);
                }
            })
        } catch(err) {
            requestOutcome.errors.push(err);
            reject(requestOutcome);
        } 
    })

}

//Function A4: Remove Request 
async function updateRequestStatus(requestType, sentBy, sentTo) {
    const connection = db.getConnection(); 

    var updateRequestOutcome = {
        requestUpdated: false,
        message: "",
		errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {

         const queryString = "UPDATE pending_requests SET request_is_pending = 0 WHERE request_type = ? AND sent_by = ? AND sent_to = ?"

            connection.query(queryString, [requestType, sentBy, sentTo], (err, rows) => {
                if (!err) { 
                    updateRequestOutcome.requestUpdated = true
                    updateRequestOutcome.message = "The request type " + requestType + " from " + sentBy + " " + sentTo + " was updated"
                    resolve(updateRequestOutcome); 

                } else {
                    updateRequestOutcome.errors.push(err);
                    resolve(updateRequestOutcome);
                }
            })
        } catch(err) {
            updateRequestOutcome.errors.push(err);
            reject(updateRequestOutcome);
        } 
    })

}

module.exports = { getSingleRequest, getRequestStatus, getPendingRequests, updateRequestStatus };

