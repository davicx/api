const express = require('express')
const simpleRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 
*/
//POSTS
//Single Post 
simpleRouter.get("/temp/profile/post", (req, res) => {
    var post = {
      postID: 1, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    res.json(post)
  })
  
  
  //Simple Posts
  simpleRouter.get("/temp/profile/posts", (req, res) => {
    var post = {
      postID: 5, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    var post2 = {
      postID: 6, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    var post3 = {
      postID: 7, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    res.json([post, post2, post3])
  })
  


module.exports = simpleRouter;


  

/*
//GROUP ROUTES
//Route A1: 
simpleRouter.post('/simple/', middlewares.verifyUser, (req, res) => { 
    res.json({hi: "hi"})
})

//Route A2: Get All Groups User is In 
simpleRouter.get("/simple/:user_name", middlewares.verifyUser, (req, res) => {
    res.json({hi: "hi"})
})
*/



/*
const express = require('express')
const profileRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const profile = require('../logic/profile')

//const postFunctions = require('../functions/postFunctions')
//const groupFunctions = require('../logic/groups')

//const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Get Simple User Profile
	3) Function A3: Update User Profile
*/

/*

//PROFILE ROUTES
//Route A1: Get User Profile
profileRouter.get('/profile/:user_name/', function(req, res) { 
    //profile.getUserProfile(req, res);
    res.json({profile: "profile"})
})

//Function A2: Get Simple User Profile
profileRouter.get('/profile/simple/:user_name', function(req, res) { 
    profile.getSimpleUserProfile(req, res);
})

//Route A2: Update User Profile
profileRouter.post('/profile', function(req, res) {
    profile.updateUserProfile(req, res);
})


module.exports = profileRouter;



*/