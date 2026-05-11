const express = require('express')
const learningRouter = express.Router(); 
const learningFunctions = require('../../functions/learningFunctions')


//USER ROUTES
//Route A1: Hello 
learningRouter.get('/learning/hello', function(req, res) {
    learningFunctions.learningHello(req, res);
})

//Route A2: Middleware 
learningRouter.get('/learning/middleware', middlewareHelper, function(req, res) {
    learningFunctions.learningMiddleware(req, res);
})

function middlewareHelper(req, res, next) {
    console.log("this is the actual middlewareHelper")
    return next();
}


module.exports = learningRouter;




