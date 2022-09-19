const express = require('express')
const userRouter = express.Router(); 
const loginFunctions = require('../../functions/loginFunctions')
//const cors = require('cors');
//userRouter.use(cors())


//USER ROUTES
//Route A1: Login 
//userRouter.post('/login', async function(req, res) {
userRouter.post('/login', function(req, res) {
    loginFunctions.userLogin(req, res);
})

//Route A2: Register 
userRouter.post('/register', function(req, res) {
    loginFunctions.userRegister(req, res);
})

//Route A3: Login Status 
userRouter.post('/login/status', function(req, res) {
    loginFunctions.loginStatus(req, res);
})

//Route A3: Logout User 
userRouter.post('/logout', function(req, res) {
    console.log("Logout!")
    loginFunctions.userLogout(req, res);
})

//Route A4: Get New Access Token
userRouter.post('/tokens/refresh', function(req, res) {
    console.log("Get New Access Token!")

    loginFunctions.getRefreshToken(req, res);
})

//Route A5: Get Token List 
userRouter.get('/tokens/all', function(req, res) {
    console.log("Get Token List!")

    loginFunctions.getTokenList(req, res);
})

//Route A4: Delete a User 
userRouter.post('/delete', function(req, res) {
    loginFunctions.userDelete(req, res);
})

module.exports = userRouter;




