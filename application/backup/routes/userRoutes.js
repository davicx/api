const express = require('express')
const userRouter = express.Router();
const userFunctions = require('../../functions/userFunctions')
const cors = require('cors');
userRouter.use(cors())


//USER ROUTES
//Route A1: Add a Friend
userRouter.post('/user/friend/add', function(req, res) {
    userFunctions.addFriend(req, res);
})

//GET ROUTES
//Route B1: Get User Information 
userRouter.get("/user/:userName", (req, res) => {
    userFunctions.getUserProfile(req, res);
})

//Route B2: Get User Friends 
userRouter.get("/user/friends/:userName", (req, res) => {
    userFunctions.getUserFriends(req, res);
})

//Route B3: Get all Site Users
userRouter.get("/users/all", (req, res) => {
    userFunctions.getAllUsers(req, res);
})


module.exports = userRouter;




