const express = require('express')
const mysql = require('mysql')
const loginRouter = express.Router();

loginRouter.get("/login", (req, res) => {
    const user = {userName: "davey", status: "Logged In!"}
    res.json(user)
})

module.exports = loginRouter;

