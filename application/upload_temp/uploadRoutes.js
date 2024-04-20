require('dotenv').config()
const express = require('express')
const app = express()
var cors = require('cors')
const uploadRouter = express.Router();
uploadRouter.use(cors())

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

