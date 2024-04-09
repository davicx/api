
/*
		let userName = allUsersArray[i].userName.toLowerCase();

		if(yourFriendsSet.has(userName)) {
			allUsersArray[i].friendStatusMessage = "friends";
			allUsersArray[i].friendStatus = true;

			//When they match get their friend status
			const friendPendingStatus = getFriendStatus(userName, yourFriendsArray);

			//TYPE 1: Friends
			if(friendPendingStatus.friendshipPending == 0) {
				allUsersArray[i].friendStatusMessage = "You are friends";
				allUsersArray[i].friendStatus = "friends";

			} else {

				//TYPE 1: Request Pending (You invited them and it is pending their request)
				if(friendPendingStatus.sentBy.localeCompare(userName) == 0) {
					allUsersArray[i].friendStatusMessage = "Request Pending (You invited them and it is pending their request)";
					allUsersArray[i].friendStatus = "friends_request_pending_them";

				//TYPE 2: Invite Pending (They requested you and you can accept)	
				} else {
					allUsersArray[i].friendStatusMessage = "Invite Pending (They requested you and you can accept)";
					allUsersArray[i].friendStatus = "friends_request_pending_you";
				}

			}

		} else if(userName.toLowerCase().localeCompare(allUsersArray[i].userName.toLowerCase()) == 0 ) {
			allUsersArray[i].friendStatusMessage = "This is you";
			allUsersArray[i].friendStatus = "not_friends";
		}
		else {
			allUsersArray[i].friendStatusMessage = "not friends";
			allUsersArray[i].friendStatus = "not_friends";
		}
	}

	*/


/*
user: {
    userInformation {
        "friendUserName": "davey",
        "friendID": 39,
        "friendUserImage": "frodo.jpg"
    }

    friendshipStatus {
        "friendshipStatusCode": 1,
        "friendshipStatus": "friends",
        "friendStatusMessage": "This is you",
        "sentBy": "davey",
    }
} 


"friendshipStatus": "friends" [1]
"friendshipStatus": "friendship_pending_them" [2]
"friendshipStatus": "friendship_pending_you" [3]
"friendshipStatus": "not_friends" [4]

		//TYPE 1: Currently Friends 
		//TYPE 2: Friendship Request Pending (them)
		//TYPE 3: Friendship Invite Pending (you)
		//TYPE 4: Not Friends
		//TYPE 5: No Data
{
  friendUserName: 'frodo3',
  friendID: 45,
  friendUserImage: 'frodo.jpg',
  friendshipPending: 1,
  sentBy: 'frodo3'
}
HIIII
{
  userName: 'vasquezd',
  imageName: '12.jpg',
  firstName: 'David',
  lastName: 'Vasquez',
  biography: 'My Biography'
}
    {
            "friendUserName": "davey",
            "friendID": 39,
            "friendUserImage": "frodo.jpg",
            "friendshipPending": 0,
            "sentBy": "davey",
            "friendStatusMessage": "This is you",
            "friendStatus": true
        }
*/


