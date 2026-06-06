//USER

//NEW
/*
//TYPE 1: You are Currently Friends - "friends"
//TYPE 2: Friendship Invite Pending (you) - "invite_pending"
//TYPE 3: Friendship Request Pending (them) - "request_pending"
//TYPE 4: Not Friends - "not_friends"
//TYPE 5: This is you - "you"

"data": {
    "userName": "davey",
    "userID": 1,
    "userImage": "http://localhost:3003/kite-us-west-two/profile/profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg",
    "firstName": "David",
    "lastName": "Vasquez",
    "biography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
    "friendshipKey": "you",
    "requestPending": 0,
    "requestSentBy": "davey",
    "alsoYourFriend": 1
},

"data": {
    "userName": "davey",
    "userID": 1,
    "userImage": "http://localhost:3003/kite-us-west-two/profile/profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg",
    "firstName": "David",
    "lastName": "Vasquez",
    "biography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
    "friendshipKey": "friends",
    "requestPending": 0,
    "requestSentBy": "davey",
    "alsoYourFriend": 1
},
*/



//ORIGINAL
/*
"data": {
    "userName": "davey",
    "userID": 1,
    "userImage": "http://localhost:3003/kite-us-west-two/profile/profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg",
    "biography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
    "firstName": "David",
    "lastName": "Vasquez"
},


{
    "friendID": 2,
    "friendName": "frodo",
    "friendImage": "http://localhost:3003/kite-us-west-two/profile/profileImage-1754179017959-192682793-image.jpg",
    "firstName": "Mr Frodo",
    "lastName": "Baggins",
    "friendBiography": "They are (or were) a little people, about half our height, and smaller than the bearded dwarves",
    "requestPending": 0,
    "requestSentBy": "davey",
    "friendshipKey": "friends",
    "alsoYourFriend": 1
}
*/

//POST
/*
{
    "postID": 545,
    "postType": "text",
    "groupID": 70,
    "listID": 0,
    "postFrom": "davey",
    "postTo": "frodo",
    "friendshipStatus": "friends",
    "postCaption": "Hiya!! Wanna go on a Hike!",
    "fileName": "",
    "fileNameServer": "hiya.jpg",
    "fileUrl": "empty",
    "videoURL": "empty",
    "videoCode": "empty",
    "postDate": "04/27/2024",
    "postTime": "4:06 pm",
    "timeMessage": "a day ago",
    "created": "2024-04-27T23:56:07.000Z",
    "commentsArray": [],
    "postLikesArray": [],
    "simpleLikesArray": []
}

//COMMENT in [commentsArray]
/*
    "commentID": 208,
    "postID": 545,
    "commentCaption": "Yes lets go hike!",
    "commentFrom": "davey",
    "friendshipStatus": "friends",
    "userName": "davey",
    "imageName": "password",
    "firstName": "david v",
    "lastName": "v",
    "commentLikes": [],
    "created": "2024-04-28T22:55:01.000Z",
    "commentLikeCount": 0
*/

//COMMENT LIKE in [commentLikes]
/*
{
    "commentLikeID": 81,
    "commentID": 208,
    "likedByUserName": "davey",
    "friendshipStatus": "friends",
    "likedByImage": "password",
    "likedByFirstName": "david v",
    "likedByLastName": "v",
    "commentCreated": "2024-04-28T22:57:18.000Z"
}
*/


//LIKE [postLikesArray]
/*
{
    "postLikeID": 199,
    "postID": 537,
    "likedByUserName": "davey",
    "friendshipStatus": "friends",
    "likedByImage": "davey.jpg",
    "likedByFirstName": "davey v",
    "likedByLastName": "davey v",
    "timestamp": "2023-11-13T00:56:44.000Z"
}
*/

//SIMPLE LIKE: Simple Likes Array
/*
"simpleLikesArray": [
    "davey",
    "sam"
]
*/





