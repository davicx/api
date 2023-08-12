const express = require('express')
const simpleRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')


const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 


*/

//GROUP ROUTES
//Route A1: 
simpleRouter.post('/simple/', middlewares.verifyUser, (req, res) => { 
    res.json({hi: "hi"})
})

//Route A2: Get All Groups User is In 
simpleRouter.get("/simple/:user_name", middlewares.verifyUser, (req, res) => {
    res.json({hi: "hi"})
})


module.exports = groupRouter;
