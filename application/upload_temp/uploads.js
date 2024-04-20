require('dotenv').config()
const express = require('express')
const app = express()
const uploadRouter = express.Router();

//const cookieParser = require('cookie-parser');
//const morgan = require('morgan')
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')
var cors = require('cors')
uploadRouter.use(cors())

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const upload = multer({ dest: './uploads' })
const uploadFunctions = require('./uploadFunctions')
/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Post Photo
*/ 
//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Photo
async function postPhoto(req, res) {
  uploadFunctions.uploadLocal(req, res, function (err) {
    var postOutcome = {
      data: {},
      message: "", 
      success: false,
      statusCode: 500,
      errors: [], 
      currentUser: ""
    }
  

    //Catch Errors
    if (err instanceof multer.MulterError) {
      console.log(err.code)
      /*
      {
        "errorMulterType": "MulterError",
        "err": {
            "name": "MulterError",
            "message": "File too large",
            "code": "LIMIT_FILE_SIZE",
            "field": "image",
            "storageErrors": []
        },
        "code": "LIMIT_FILE_SIZE"
      }
      */
      res.json({errorMulterType:'MulterError', err: err, code: err.code});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log(err.code)

      //res.json({error:'error', err: err.message});
      postOutcome.message = err.message
      res.json(postOutcome);
    } else {
      let file = req.file
      let caption = req.body.caption;
      let currentUser = req.body.currentUser

      if(file !== undefined) {
        let fileExtension = mime.extension(file.mimetype);
        //res.send({yay: "yay!", file: file, caption: caption, currentUser: currentUser, c})
        postOutcome.message = "Your file was uploaded!"
        postOutcome.statusCode = 200
        postOutcome.success = true
        postOutcome.currentUser = currentUser
        postOutcome.data = {
          file: file,
          caption: caption,
          file: file, caption: caption
        }
        res.json(postOutcome)

      } else {
        res.json({postType:'please choose an image file'});
      } 
    }

  })


}

module.exports = { postPhoto };




/*
async function postPhoto(req, res) {
  uploadFunctions.uploadLocal(req, res, function (err) {
    var postOutcome = {
      data: {},
      message: "", 
      success: false,
      statusCode: 500,
      errors: [], 
      currentUser: req.body.currentUser
    }
  
    //Catch Errors
    if (err instanceof multer.MulterError) {
      console.log(err.code)
      // A Multer error occurred when uploading.
      postOutcome.message = err
      postOutcome.errors.push(err)
      postOutcome.errors.push(err.code)
      res.json({errorMulterType:'MulterError', err: err, code: err.code});

      //res.json(postOutcome);

    } else if (err) {
      // An unknown error occurred when uploading.
      console.log(err)
      postOutcome.message = err
      res.json(postOutcome);

    } else {
      let file = req.file
      let caption = req.body.caption;
      let currentUser = req.body.currentUser

      if(file !== undefined) {
        //postFunctions.postPhoto(req, res, file);
        let fileExtension = mime.extension(file.mimetype);
        //res.send({yay: "yay!", file: file, caption: caption, currentUser: currentUser, c})
        postOutcome.message = "File uploaded!"
        postOutcome.data = {
          file: file,
          caption: caption,
          file: file, caption: caption
        }
        res.json(postOutcome)
      
      } else {
        postOutcome.message = "please choose an image file";
        res.json(postOutcome);
      } 
    }

  })

}
*/