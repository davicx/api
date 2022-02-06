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

userRouter.get("/users/all", (req, res) => {
    userFunctions.getAllUsers(req, res);
})


module.exports = userRouter;




