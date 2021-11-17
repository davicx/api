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