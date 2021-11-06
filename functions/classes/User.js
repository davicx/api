const db = require('./../conn');

class User {
    constructor(userName) {
        this.userName = userName;
        this.firstName = "";
        this.lastName = "";
        this.database = ""
    }
    

    //METHODS A: USER RELATED
    //Method A1: Get User Info 
    async getUserInfo() {
        this.lastName = "v"
 
        const connection = db.getConnection(); 
        console.log("getUserInfo " + this.userName);
        
        const queryString = "SELECT first_name, last_name FROM user_profile WHERE user_name = ?";

        connection.query(queryString, [this.userName], (err, rows, fields) => {
            if (!err) {
                this.firstName = rows[0].first_name
                this.lastName = rows[0].last_name
                //console.log("_________________")        
                //.log(user.firstName + " " + user.lastName);     
                console.log("from server " + rows[0].first_name + " " + rows[0].last_name);     
                //console.log();     
                //console.log("_________________")     
                //res.sendStatus(500)
                //return
            } else {
                console.log("Failed to Select User: " + err);
            }
          
        })
    
    }


}

module.exports = User;

/*
class User {
    constructor(id) { ... }
        goOnline() { ... }
        addBadge(type) { ... }
        get _isOnline() {  
        return fetch(`/${this.username}/online`)
            .then(response => response.json())  
            .then(data => data.isOnline)  
            .catch(error => { throw error; });  
    } 
}

const myUser = new User ('acb33259');

// Functionality
myUser.goOnline();

// Attribute
if (await myUser.isOnline) {

    // Functionality
    myUser.addBadge('online');
}
*/

//APPENDIX
/*
    //Connect to Database 
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'shareshare'
    })

    //Create Query 
    let userId = req.params.id;
    const queryString = "SELECT user_name, email, first_name, last_name FROM user_profile WHERE user_id = ?";
    connection.query(queryString, [userId], (err, rows, fields) => {

    //Handle Error 
    if (err) {
        console.log("Failed to query for users: " + err);
        res.sendStatus(500);
        res.end();
    }
    
    console.log("I think we fetched users successfully");

*/

    /*

    //Method A2: Get User Info 
    getFriendList(userName)  {
        //console.log("My friends! " + userName);
        return "My friends! " + userName;
    }
    */

/*
    get userName() {
        return this.userName;
    }

    set userName(name) {
        this.userName = name;
    }    


    */
/*


    get post_from () {
        return this.post_from;
    }

    set post_from(post_from) {
        this.post_from = post_from;
    }

public $userID = "";
	public $userName = "";
	public $firstName = "";
	public $lastName = "";
	public $gender = "";
	public $fullUserName = "";
	public $email = "";
	public $biography = "";
	public $userImage = "";
	public $totalFriends = 0;
	public $totalFollowers = 0;
	public $totalFollowing = 0;
	public $totalGroups = 0;	
	public $totalPosts = 0;	
	public $totalLists = 0;
*/
    
