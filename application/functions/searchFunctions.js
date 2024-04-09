const db = require('./conn');
/*
const userFunctions = require('./userFunctions');
const Friend = require('./classes/Friend');
const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');
*/

/*
FUNCTIONS A: All Functions Related to Search 
	1) Function A1: 


*/


//FUNCTIONS A: All Functions Related to Search 
//Function A1: 
async function searchActiveFriendList(currentUser, searchStringRaw) {
    const connection = db.getConnection(); 
    let searchString = searchStringRaw + "%";
    console.log(currentUser)
    console.log(searchString)

    var activeFriendsListOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND friends.friend_user_name LIKE ?";
            //const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0";
            connection.query(queryString, [currentUser, searchString], (err, rows) => {
                console.log(rows)
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}

                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_name;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;

                    friendsArray.push(currentFriend)

                  } 

                if (!err) {
                    //console.log(err)
                    activeFriendsListOutcome.success = true;
                    activeFriendsListOutcome.friendsArray = friendsArray
                    resolve(activeFriendsListOutcome); 

                } else {
                    activeFriendsListOutcome.outcome = 500;
                    resolve(activeFriendsListOutcome);
                }
            })
        } catch(err) {
            //console.log(err)
            activeFriendsListOutcome.outcome = 500;
            reject(activeFriendsListOutcome);
        } 
    })

}



module.exports = { searchActiveFriendList };
