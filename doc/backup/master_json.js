//POST: Text to a User
{
	"masterSite": "kite",
	"postType": "text",
    "postFrom": "davey",
    "postTo": "sam",
    "groupID": 0,
    "listID": 0,
    "postCaption": "Hi sam this is new! Do you wanna garden today again! The weather is perfect! Or we could hike!",   
	"postURL": "http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/posts",
    "notificationMessage": "Posted a Message",  
    "notificationType": "new_post_text",
    "notificationLink": "http://localhost:3003/posts/group/77"          
}

//POST: Text to a Group
{
	"masterSite": "kite",
	"postType": "text",
    "postFrom": "davey",
    "postTo": 77,
    "groupID": 77,
    "listID": 0,
    "postCaption": "Hi sam this is new! Do you wanna garden today again! The weather is perfect! Or we could hike!",   
    "notificationMessage": "Posted a Message",  
    "notificationType": "new_post_text",
    "notificationLink": "http://localhost:3003/posts/group/77"          
}

//POST: Simple Post 
{
    "postType": "text",
    "postStatus": 1,
    "groupID": 77,
    "postFrom": "david",
    "postTo": "sam",
    "postCaption": "Hiya sam wanna garden today again! The weather is perfect! Or we could hike!",
    "notificationMessage": "Posted a Message",  
    "notificationType": "new_post_text",
    "notificationLink": "http://localhost:3003/posts/group/77"          
}
