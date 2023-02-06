const express = require('express')
const postRouter = express.Router();
const postFunctions = require('../functions/postFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
//const db = require('../functions/conn');
const db = require('../functions/conn');


/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Post Text
	2) Function A2: Post Video
	3) Function A3: Post Photo
	4) Function A4: Post Article
 
FUNCTIONS B: All Functions Related to getting Posts
	1) Function B1: Get all Group Posts
	2) Function B2: Get all User Posts 
	3) Function B3: Get Single Post by ID 
	4) Function B4: Get All Posts

    postFunctions.postText(req, res);

*/

//FUNCTIONS A: All Functions Related to Posts
postRouter.post('/post/temp', function(req, res) {
	 postFunctions.postTemp(req, res);
})

//Route A1: Post Text
postRouter.post('/post/text', function(req, res) {
    postFunctions.postText(req, res);
})

//Route A2: Post Photo
postRouter.post('/post/photo', function(req, res) {
    postFunctions.postPhoto(req, res);
})

//Route A3: Post Video

//Route A4: Post Article

//FUNCTIONS B: All Functions Related to getting Posts
//Route B1: Get all Group Posts
//Route B2: Get all User Posts 
//Route B3: Get Single Post by ID 
postRouter.get("/posts/:post_id", (req, res) => {
	postFunctions.getSinglePost(req, res);
})

//Route B4: Get All Posts
postRouter.get("/posts", (req, res) => {
    console.log("Get all Posts")
	postFunctions.getAllPosts(req, res);
})



module.exports = postRouter;



















