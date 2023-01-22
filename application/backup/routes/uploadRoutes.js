require('dotenv').config()
const express = require('express')
const uploadRouter = express.Router();
const postFunctions = require('../../functions/postFunctions')
const cors = require('cors');

const multer  = require('multer')
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const s3 = new S3({ region, accessKeyId, secretAccessKey })
uploadRouter.use(cors())

//Function A.1: Make sure file is a photo 
var localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'C:/wamp/www/api/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname) 
  }
})

var postPhotoStorage = multerS3({
      s3: s3,
      bucket: 'kite-post-photo-upload',
      key: function (req, file, cb) {
          console.log(file);
          cb(null, Date.now() + file.originalname);
      }
})

var uploadLocal = multer({
  storage: localStorage,
  limits: { fileSize: 1024 * 1024 * 20},
  photoFilter: photoFilter
})

var uploadPostPhoto = multer({
  storage: postPhotoStorage,
  limits: { fileSize: 1024 * 1024 * 20},
  photoFilter: photoFilter
});

//ROUTE A.1: Upload Post Photo (Local)
uploadRouter.post('/upload/photo/local', uploadLocal.single('postImage'), (req, res) => {
  const file = req.file
  if(file !== undefined) {
      postFunctions.postPhoto(req, res, file);
      console.log(file);
  } else {
      res.json({postType:'please choose an image file'});
  }  
})

//ROUTE A.2: Upload Post Photo (Local to S3)
uploadRouter.post('/upload/photo/local/aws', uploadLocal.single('postImage'), async (req, res) => {
  const file = req.file
  if(file !== undefined) {
      const result = await uploadFile(file);
      if(result) {
        console.log(file);
        postFunctions.postPhoto(req, res, file); 
      }
  } else {
      res.json({postType:'please choose an image file'});
  }
})

//ROUTE A.3: Upload Post Photo (AWS to S3) 
uploadRouter.post('/upload/photo', uploadPostPhoto.single('postImage'), (req, res) => {
  const file = req.file
  if(file !== undefined) {
      postFunctions.postPhoto(req, res, file);
      //res.json({file: file})
  } else {
      res.json({postType:'please choose an image file'});
  }  
})



//Temp
uploadRouter.get("/upload", (req, res) => {
    res.json({working: "working", region: region})
})


//FUNCTIONS
//Function C.1: Upload to AWS 
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path)

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename
  }

  return s3.upload(uploadParams).promise()
}

//Function C.2: Download from AWS 
function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
  }

  return s3.getObject(downloadParams).createReadStream()
}

//Function B.1: Make sure file is a photo 
var photoFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
  } else {
      cb(null, false);
  } 
}

module.exports = uploadRouter;