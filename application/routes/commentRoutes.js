const express = require('express')
const commentRouter = express.Router(); 
const comments = require('../logic/comments')
const cors = require('cors');
commentRouter.use(cors())

/*
FUNCTIONS A: All Functions Related to Comments
	1) Function A1: Post a new Comment
 
FUNCTIONS B: All Functions Related to getting Comments
	1) Function B1: Get all Comments to a Post
	2) Function B2: Get all Comments

FUNCTIONS C: All Functions Related to Comment Actions
	1) Function C1: Like a Comment
	2) Function C2: Unlike a Comment 

*/

//COMMENT ROUTES
//Route A1: Make a New Comment 
commentRouter.post('/comment', function(req, res) {
    comments.postComment(req, res);
})

//Route A2: Get all Comments to a Post
commentRouter.get('/comments/:post_id', function(req, res) {
    comments.getComments(req, res);
})

//Route A3: Like a Comment
commentRouter.post('/comment/like', function(req, res) {
    comments.likeComment(req, res);
})

//Route A4: UnLike a Comment 
commentRouter.post('/comment/unlike', function(req, res) {
    comments.unlikeComment(req, res);
})

//Route A6: Get all Comments (with Pagination)
commentRouter.get('/comments', function(req, res) {
    comments.getAllComments(req, res);
})



module.exports = commentRouter;
