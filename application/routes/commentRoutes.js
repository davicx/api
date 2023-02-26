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



module.exports = commentRouter;
