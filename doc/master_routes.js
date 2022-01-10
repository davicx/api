
//POST Related 
/*

//POST ROUTES


//GET ROUTES
//Route B1: Get Posts to a Group
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/posts/group/77
//Route: http://localhost:3003/posts/group/77

//Route B2: Get Posts to a User
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/posts/user/davey
//Route: http://localhost:3003/posts/user/davey

//Route B3: Get Single Post by ID 
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/posts/4
//Route: http://localhost:3003/posts/4


//Route B4: Get all Posts 
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/posts/all
//Route: http://localhost:3003/posts/all

//Response:
	
posts = [
	{
		postID: 1,
		postType: "text",
		groupID: 77,
		listID: 0,
		postFrom: "davey",
		postTo: "frodo",
		postCaption: "Hiya Frodo!! The weather is perfect!",
		fileName: "",
		fileNameServer: "",
		fileUrl: "",
		videoURL: "",
		videoCode: "",
		created	"2021-11-14T23:34:12.000Z"
	}
]	

//GROUP Related
//POST ROUTES


//GET ROUTES
//Route B1: Get All Groups a User is In
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/group/user/1
//Route: http://localhost:3003/group/user/1

//Route B2: Get Single Group by ID 
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/group/77
//Route: http://localhost:3003/group/77

//Route B3: Get Group Users (Not needed) 
//Route: http://hellofour-env.eba-mymqvrea.us-west-2.elasticbeanstalk.com/group/users/1
//Route: http://localhost:3003/group/users/1







////////////////////////////////////////////////
////////////////////////SORT////////////////////
////////////////////////////////////////////////

/*
{
  fieldname: 'postImage',
  originalname: 'hiya.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'C:/wamp/www/sites/api/uploads',
  filename: '1636934039341hiya.jpg',
  path: 'C:\\wamp\\www\\sites\\api\\uploads\\1636934039341hiya.jpg',
  size: 182337
}
result
{
  ETag: '"72653cbde20adeab37c6bcb570226a08"',
  Location: 'https://kite-post-photo-upload.s3.us-west-2.amazonaws.com/1636934039341hiya.jpg',
  key: '1636934039341hiya.jpg',
  Key: '1636934039341hiya.jpg',
  Bucket: 'kite-post-photo-upload'
}

*/




////
//GET ROUTES

/*
postRouter.get("/posts/user/:user_name", (req, res) => {
    postFunctions.getUserPosts(req, res);
})


postRouter.get("/posts/:post_id", (req, res) => {
	postFunctions.getSinglePost(req, res);
})


postRouter.get("/posts", (req, res) => {
	postFunctions.getAllPosts(req, res);
})

////





//All Posts to a Group (GET)
http://localhost:3003/posts/group/77

//All Posts to a User (GET)
http://localhost:3003/posts/user/vasquezd

//New Post (POST)
http://localhost:3003/post
*/

//POST: Text to a User
/*
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



*/

/*
//USER ROUTES
/*
//Route 1: Get a Single Post by ID
postRouter.route("/post/:post_id").get(postController.getSinglePost);

//Route 2: Get all Posts to a User 
postRouter.route("/posts/user/:post_to").get(postController.getUserPosts);

//Route 3: Get all Posts to a Group 
postRouter.route("/posts/group/:group_id").get(postController.getGroupPosts);

//Route 4: Get all Posts 
postRouter.route("/posts/all").get(postController.getAllPosts);

//POST Routes
//Route 5: Create a New Post
postRouter.route("/post").post(postController.newPost);

*/
/*

//User Related 
Route 1: Get User Info
Route 2: Update User Info
Route 3: Update User Photo
Route 3: Delete User 

//Friend Related 
Route 3: Send a Friend Request
Route 4: Cancel a Friend Request
Route 4: Accept a Friend Request
Route 4: Decline a Friend Request
Route 5: Remove a Friend



Route 1: Get Post by ID
Route 2: Get all Posts

POST A1: Post Text 

//Login Related 
*/

//LOGIN AND REGISTRATION ROUTES
/*
Route 1: Login 
Route 2: Register a New User
Route 2: Request Password Reset
Route 2: Request Username 
Route 2: 
Route 2: 


*/

//ACTIVITY 

//NOTIFICATIONS

//GROUP
//Group Related 
//Route 5: Accept a Group Request
//Route 5: Decline a Group Request
//POSTS


//VERIFICATION LOGIC




