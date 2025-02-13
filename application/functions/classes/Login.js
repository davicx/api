const db = require('./../conn');
const timeFunctions = require('../timeFunctions');
const postFunctions = require('../postFunctions');
const dayjs = require('dayjs')
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
dayjs().format()

class Login {
    constructor(loginStatus) {
        this.loginStatus = "";
    }

    //METHODS A: Login Functions
    //Method A1: Login User
    static async loginUser(userName, deviceID) { 
        console.log("loginUser hi!! " + userName)  
    }
    
    //Method A2: Logout User
    static async logoutUser(userName, deviceID ) { 
        const connection = db.getConnection(); 

        console.log("logoutUser " + userName + " " + deviceID)
             
        var logoutOutcome = {
            success: false,
            errors: []
        }

        //Remove all Access Tokens for User 
        const queryString = "DELETE FROM refresh_tokens WHERE user_name= ? AND device_id = ?;"			

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [userName, deviceID], (err, rows) => {
                    if (!err) {
                        logoutOutcome.success = true
                        resolve(logoutOutcome)
            
                    } else {
                        console.log("Failed to log user out" + err)
                        logoutOutcome.errors.push(err)
                        reject(logoutOutcome);
                    }
                })
                
            } catch(err) { 
                logoutOutcome.errors.push(err)
                reject(logoutOutcome);
            } 
        })
        
    }
    
}

module.exports = Login;
