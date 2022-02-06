const express = require('express')
const userRouter = express.Router(); 
const loginFunctions = require('../../functions/loginFunctions')
const cors = require('cors');
userRouter.use(cors())


//USER ROUTES
//Route A1: Login 
userRouter.post('/login', function(req, res) {
    loginFunctions.userLogin(req, res);
})

//Route A1: Register 
userRouter.post('/register', function(req, res) {
    loginFunctions.userRegister(req, res);
})



 

module.exports = userRouter;




