const db = require('./conn');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Requests
	1) Function A1: Get Single Request (Check if it exists)

*/


//Function A1: Get Single Request (Check if it exists)
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


module.exports = { getSingleRequest };

