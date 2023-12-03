const express = require('express')
const searchRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const friends = require('../logic/friends')
const search = require('../logic/search')

/*
FUNCTIONS A: All Functions Related to Searching for Friends 
	1) Function A1: Search for your Active Friends 

*/

//FUNCTIONS A: All Functions Related to Searching for Friends 
//Function A1: Search for your Active Friends 
searchRouter.get('/search/user/:user_name/string/:search_string/', function(req, res) {
    search.searchActiveFriends(req, res);
})



module.exports = searchRouter;


