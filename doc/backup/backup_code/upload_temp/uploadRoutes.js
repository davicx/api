require('dotenv').config()
const express = require('express')
const app = express()
const uploadRouter = express.Router();
// CORS handled at app level (app.js) - cors() here overrides with * and breaks credentials

const uploads = require('./uploads')


/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Upload Local 
*/

//Route A1: Upload Local
uploadRouter.post('/upload/learning/local', async function(req, res) {
  uploads.postPhoto(req, res)
})


module.exports = uploadRouter;

