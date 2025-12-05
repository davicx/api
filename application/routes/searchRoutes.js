const express = require('express')
const searchRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const friends = require('../logic/friends')
const search = require('../logic/search')

/*
FUNCTIONS A: All Functions Related to Searching for Friends 
	1) Function A1: Search for your Active Friends 

FUNCTIONS B: All Functions Related to Searching for Information 
	1) Function B1: Search for item information 
	2) Function B2: Get product information from URL

*/

//FUNCTIONS A: All Functions Related to Searching for Site Information 
//Function A1: Search for your Active Friends 
searchRouter.get('/search/user/:user_name/string/:search_string/', function(req, res) {
    search.searchActiveFriends(req, res);
})

searchRouter.get('/search/user/:user_name/string/:search_string/', function(req, res) {
    search.searchActiveFriends(req, res);
})

//Function A2: Search for Groups
searchRouter.post('/search/group/', function(req, res) {
    search.searchGroups(req, res);
})


//FUNCTIONS B: All Functions Related to Searching for Information 
//Function B1: Search for item information 
searchRouter.get('/search', function(req, res) {
	res.json({hi:"hi"});
})

//Function B2: Get product information from URL
searchRouter.post('/search/product', function(req, res) {
    search.getProductInfo(req, res);
})

module.exports = searchRouter;


