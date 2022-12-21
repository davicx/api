const express = require('express')
const db = require('../../functions/conn');
const groupRouter = express.Router();
const groupFunctions = require('./../../functions/groupFunctions')
var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');


groupRouter.get("/groups/:userName", (req, res) => {
    //groupFunctions.getUserGroups(req, res);

    let currentGroup = {
        groupID: 1,
        groupName: "music"
    }

    var groupList = [currentGroup];

    res.json({groups: groupList} );
})

module.exports = groupRouter;