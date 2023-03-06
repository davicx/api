const express = require('express')
const commentRouter = express.Router(); 
const commentFunctions = require('../functions/commentFunctions')
const cors = require('cors');
commentRouter.use(cors())


//COMMENT ROUTES
//Route A1: Make a New Comment 
commentRouter.post('/comment', function(req, res) {
    commentFunctions.postComment(req, res);
})

//Route A2: Get all Comments to a Post
commentRouter.get('/comments/:post_id', function(req, res) {
    commentFunctions.getComments(req, res);
})

//Route A3: Like a Comment
commentRouter.post('/comment/like', function(req, res) {
    commentFunctions.likeComment(req, res);
})

//Route A4: UnLike a Comment 
commentRouter.post('/comment/unlike', function(req, res) {
    commentFunctions.unlikeComment(req, res);
})

//Route A6: Get all Comments 
commentRouter.get('/comments', function(req, res) {
    commentFunctions.getAllComments(req, res);
})



module.exports = commentRouter;
