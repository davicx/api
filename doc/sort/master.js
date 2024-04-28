//USERS
/*
//BASE
"friendName": "sam",
"friendImage": "sam.jpg",
"firstName": "sam",
"lastName": "gamgee",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",

"friendKey": "friends",


//Get all your friends
"friendName": "sam",
"friendImage": "sam.jpg",
"firstName": "sam gamgee",
"lastName": "sam gamgee",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
"requestPending": 0,
"requestSentBy": "davey",
"friendshipKey": "friends"

"friendName": "sam",
"friendImage": "sam.jpg",
"firstName": "sam gamgee",
"lastName": "sam gamgee",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
"requestPending": 1,
"requestSentBy": "davey"


//List of Someones Friends
"friendID": 39,
"friendName": "davey",
"friendImage": "frodo.jpg",
"firstName": "davey v",
"lastName": "davey v",
"friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
"requestPending": 0,
"requestSentBy": "davey",
"alsoYourFriend": 1


//FRIENDS
/*
Status: 
    1) Friends: 
    2) Friend Invite: They invited you (you accept)
    3) Friend Request:- You sent an invite to them (they accept) 
    4) Not Friends: You can invite them 
    5) You: This is you  

//TYPE 1: You are Currently Friends - "friends"
//TYPE 2: Friendship Invite Pending (you) - "invite_pending"
    a) Accept or Decline 
//TYPE 3: Friendship Request Pending (them) - "request_pending"
    a) Cancel 
//TYPE 4: Not Friends - "not_friends"
//TYPE 5: This is you - "you"

*/


//LIKES



//RESPONSE 
/*
Data 
  - Post or Comment ID
Message: ""
Status code: 200
Errors: [] 
Outcome Success: true or false
Current User

//Reponse Example 
{
    "data": {
        "addedUsers": [],
        "existingUsers": [
            "davey",
            "david",
            "sam",
            "merry",
            "bilbo"
        ]
    },
    "success": true,
    "statusCode": 200,
    "message": "You added users to the group",
    "errors": [],
    "currentUser": "davey"
}

//Login Example
{
    "data": {
        "loginSuccess": true,
        "loggedInUser": "davey",
        "validUser": true,
        "passwordCorrect": true,
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhVmV5IiwiaWF0IjoxNjgzMTU4MzU2LCJleHAiOjE2ODMxNjE5NTZ9.FPlSUqiyLA9treCdS_WeCszLvbFiuebbueUnrFJHmV0",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhVmV5IiwiaWF0IjoxNjgzMTU4MzU2fQ.YqqShtEejCBGIgKC1kxcQwt80B1TMtGpQcChfR2bZto"
    },
    "success": true,
    "message": "daVeywas succesfully logged in!",
    "statusCode": 200,
    "errors": [],
    "currentUser": "davey"
}
*/

 