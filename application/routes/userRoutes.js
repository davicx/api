const express = require('express')
const userRouter = express.Router();
const db = require('../../functions/conn');
const userFunctions = require('../../functions/user')
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

module.exports = userRouter;




