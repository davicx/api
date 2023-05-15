const db = require('./conn');
const userFunctions = require('./userFunctions');
//const Requests = require('./classes/Requests');
//const Functions = require('./functions');
//app.use(express.json());

/*
FUNCTIONS A: All Functions Related to Friends
	1) Function A1: Get Single Request (Check if it exists)

*/



//Function A1: Check if Users are Friends
async function checkFriendshipStatus(userOne, userTwo) {
    var friendKey = userOne + "" + userTwo;
   
    const connection = db.getConnection();
    //Status
    /*
    1: Currently Friends
    2: Friendship Pending
    3: Not Friends
    4: No Data
    */ 

    var friendshipOutcome = {
        friendshipStatus: 4,
		errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            
            const queryString = "SELECT * FROM friends WHERE friend_key = ?"			
            
            connection.query(queryString, [friendKey], (err, rows) => {
                if (!err) {           
                    if(rows.length >= 1){
                        if(rows[0].request_pending > 0) {
                            friendshipOutcome.friendshipStatus = 2
                        } else {
                            friendshipOutcome.friendshipStatus = 1
                        }
                        
                        console.log(rows[0])
			
                    } else {
                        friendshipOutcome.friendshipStatus = 3
						//friendshipOutcome.errors.push("We couldn't find anything " + requestID);
					}
                    console.log(friendshipOutcome)
                    resolve(friendshipOutcome); 

                } else {
                    friendshipOutcome.errors.push(err)
                    resolve(friendshipOutcome);
                }
            })
        } catch(err) {
            friendshipOutcome.errors.push(err)
            reject(friendshipOutcome);
        } 
    })
    
}


module.exports = { checkFriendshipStatus };
