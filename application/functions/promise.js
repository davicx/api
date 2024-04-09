/*
Data 
- Current User
- Post or Comment ID
Message: ""
Status code: 200
Errors: [] 
Outcome Success: true or false

var commentOutcome = {
    data: [],
    success: false,
    message: "", 
    statusCode: 200,
    errors: [], 
    currentUser: currentUser
}

var functionOutcome = {
    data: [],
    success: false,
    message: "", 
    errors: [], 
}    
*/

async function examplePromise() {
    const postID = 1;
    var commentOutcome = {
        outcome: 0,
        postID: 0,
        errors: []
    }

    return new Promise(async function(resolve, reject) {
        try {
            const queryString = "INSERT INTO comments (post_id VALUES (?)"

            connection.query(queryString, [postID], (err, results) => {
                if (!err) {
                    console.log("You created a new Post with ID " + results.insertId);    
                    commentOutcome.outcome = 200;       
                    commentOutcome.postID = results.insertId;       
                } else {    
                    commentOutcome.outcome = "no worky"
                    commentOutcome.errors.push(err);
                } 
                resolve(commentOutcome);
            }) 
            
        } catch(err) {
            commentOutcome.outcome = "rejected";
            console.log("REJECTED " + err);
            reject(commentOutcome);
        } 
    });
}

