const express = require('express')
const postRouter = express.Router();
const postFunctions = require('../functions/postFunctions')
const posts = require('../logic/posts')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');
const middlewares = require('../functions/middlewareFunctions')

/*
FUNCTIONS A: All Routes Related to Posts
	1) Function A1: Post Text
	2) Function A2: Post Photo
	3) Function A3: Post Photo to AWS
	4) Function A4: Post Photo all AWS
 
FUNCTIONS B: All Routes Related to getting Posts
	1) Function B1: Get all Group Posts
	2) Function B2: Get all User Posts 
	3) Function B3: Get Single Post by ID 
	4) Function B4: Get All Posts

FUNCTIONS C: All Routes Related to Post Actions
	1) Function C1: Like a Post
	2) Function C2: Unlike a Post 
	3) Function C3: Select all Likes
	4) Function C4: Select all Likes for a Post
	5) Function C5: Delete a Post
	6) Function C6: Edit a Post 

*/

//FUNCTIONS A: All Functions Related to Posts
//Route A1: Post Text
postRouter.post('/post/text', function(req, res) {
    posts.postText(req, res);
})

//Route A2: Post Photo
postRouter.post('/post/photo/local', async function(req, res) {
	posts.postPhoto(req, res)
	//res.json({hi:"hi"})
})
  
/*
postRouter.post('/post/photo/local', function(req, res) {
    posts.postPhoto(req, res);
})
*/
//Route A3: Post Photo Local to AWS

//Route A4: Post Photo AWS to AWS


//Route A5: Post Video
postRouter.post('/post/video', function(req, res) {
    posts.postVideo(req, res);
})

//Route A6: Post Article
postRouter.post('/post/article', function(req, res) {
    posts.postArticle(req, res);
})

//FUNCTIONS B: All Functions Related to getting Posts
//Route B1: Get all Group Posts
postRouter.get("/posts/group/:group_id", middlewares.verifyUser, (req, res) => {
    posts.getAllGroupPosts(req, res);
})

//Route B2: Get Group Posts Pagination
postRouter.get("/posts/group/:group_id/:page", middlewares.verifyUser, (req, res) => {
    posts.getGroupPosts(req, res);
})

//Route B2: Get all User Posts 
postRouter.get("/posts/user/:user_name/:page", middlewares.verifyUser, (req, res) => {
    posts.getAllUserPosts(req, res);
})
//Route B3: Get Single Post by ID 
postRouter.get("/posts/:post_id", (req, res) => {
	posts.getSinglePost(req, res);
})

//Route B4: Get All Posts
postRouter.get("/posts", (req, res) => {
	posts.getAllPosts(req, res);
})

//FUNCTIONS C: All Functions Related to Post Actions
//Function C1: Like a Post
postRouter.post('/post/like', function(req, res) {
    posts.likePost(req, res);
})

//Function C2: Unlike a Post 
postRouter.post('/post/unlike', function(req, res) {
	posts.unlikePost(req, res);
})

//Function C3: Select all Likes
postRouter.get("/post/likes", (req, res) => {
	posts.getAllLikes(req, res);
})

//Function C4: Select all Likes for a Post
postRouter.get("/post/likes/:post_id", (req, res) => {
	posts.getPostLikes(req, res);
})

//Function C5: Delete a Post
postRouter.post("/post/delete/", (req, res) => {
	posts.deletePost(req, res);
})

//Function C6: Edit a Text Post 
postRouter.post("/post/caption/edit/", (req, res) => {
	posts.editPost(req, res);
})


module.exports = postRouter;



















