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
							console.log("MAKEY " + requestTo + " " + existingRequestCount);
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

/*
		global $conn;
	
		$request_type 		= "new_group";
		$request_type_text  = "New Group Invite";
		$request_is_pending = 1;
	
		//STEP 1: Make sure Notification is not a duplicate
		$result_request = mysqli_query($conn, "SELECT * FROM pending_requests WHERE request_type = 'new_group' 
			AND sent_by = '$logged_in_user' 
			AND sent_to = '$friend_invited_current' 
			AND request_is_pending = '1' 
			AND group_id = '$group_id' 
			AND friend_id = '0'");	
		
		$pending_request_found_count = mysqli_num_rows($result_request);

		if($pending_request_found_count < 1) {
			
			//STEP 2: Only Create a Request for Users who were just invited 
			if (strcasecmp($friend_invited_current, $logged_in_user) !=0) {
				$sql = 'INSERT INTO pending_requests (master_site, request_type, request_type_text, request_is_pending, sent_by, sent_to, group_id, updated, created) 
					VALUES (?,?,?,?,?,?,?, NOW(), NOW())';			  
				$stmt = $conn->stmt_init();
				$stmt = $conn->prepare($sql);
				// bind parameters and insert the details into the database
				$stmt->bind_param('sssissi', $master_site, $request_type, $request_type_text, $request_is_pending, $logged_in_user, $friend_invited_current, $group_id);
				//$stmt->execute();	
				if ($stmt->execute()) {
					echo "New record created successfully";
				} else {
					echo "Error: <br>" . mysqli_error($conn);
				}	
			}
		}

	}	

//Step 2: Add Pending Requests- Insert into pending users 
for($x = 0; $x < $total_new_friends; $x++) {
    $friend_invited_current = $selected_friends[$x];
    $sql = 'INSERT INTO pending_requests (request_type, request_type_text, request_is_pending, sent_by, sent_to, group_id, updated, created) 
        VALUES (?,?,?,?,?,?, NOW(), NOW())';			  
    $stmt = $conn->stmt_init();
    $stmt = $conn->prepare($sql);
    // bind parameters and insert the details into the database
    $stmt->bind_param('ssissi', $request_type, $request_type_text, $request_is_pending, $logged_in_user, $friend_invited_current, $group_id);
    $stmt->execute();				
}
*/


