const express = require('express')
const simpleRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')


const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 


*/
//POST: Routes

//POSTS
//Single Post 
simpleRouter.get("/simple/post", (req, res) => {
    var post = {
      postID: 1, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    res.json(post)
  })
  
  
  //Simple Posts
  simpleRouter.get("/simple/posts", (req, res) => {
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
  
//USERS
//Get Friends for a user
simpleRouter.get("/simple/users/:current_name", (req, res) => {
  let currentUser = req.params.current_name
  console.log(currentUser)
  var user = {
    userID: 1, 
    userName: "david",
    biography: "hiya!"
  }

  var user2 = {
    userID: 2, 
    userName: "frodo",
    biography: "hiya!"
  }

  var user3 = {
    userID: 3, 
    userName: "sam",
    biography: "hiya!"
  }

  res.json([user, user2, user3])
}) 
//user/:user_name",
  simpleRouter.get("/simple/users", (req, res) => {
    var user = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    var user2 = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    var user3 = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    res.json([user, user2, user3])
  }) 


simpleRouter.get("/simple/hero", (req, res) => {
  var user = {
    localized_name: "wizard",
    primary_attr: "magic",
    attack_type: "magic and weapons",
    img: "wizard.png",
    legs: 2,
  }
    var user2 = {
    localized_name: "dwarf",
    primary_attr: "ax",
    attack_type: "ax and warrrior type",
    img: "dwarf.png",
    legs: 2,
  }
    var user3 = {
    localized_name: "elf",
    primary_attr: "bow",
    attack_type: "bow and shooting",
    img: "elf.png",
    legs: 4,
  }
    res.json([user, user2, user3])
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