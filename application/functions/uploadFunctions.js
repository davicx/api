const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const s3 = new S3({ region, accessKeyId, secretAccessKey })
const fs = require('fs') 
const multer = require('multer')
//const upload = multer({ dest: './uploads' })
const upload = multer({ dest: './kite-posts-us-west-two' })

/*
FUNCTIONS A: All Functions Related to Local Uploads
	1) Function A1: Create local upload and filename for uploads folder
	2) Function A2: Function A2: Image Upload for Local Upload 
*/

//SETUP: Set File Destination and Size
//var fileLimit = 1024 * 1024 * 40; 
var fileLimit = 1024 * 1024 * 40; 
//var fileLimit = 1; 
//var uploadFolder = "./application/upload_temp/uploads";
var uploadFolder = "./public/kite-posts-us-west-two";
//var profileUploadFolder = "./public/profile";
var profileUploadFolder = "./public/kite-profile-us-west-two";

//Function A1: Create local upload and filename for Local Storage
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const newFilename = file.fieldname + '-' + uniqueSuffix + "-" + file.originalname

    cb(null, newFilename)
  }
})

//Function A2: Image Upload for Local Upload 
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  limits: { fileSize: fileLimit},


  fileFilter: function (req, file, cb) {
    let size = req.rawHeaders.slice(-1)[0]

    console.log("STEP 1: Upload file to local storage");
    console.log("Step 1A: File Limit: " + fileLimit + " File Size: " + size);

    //Create image and size filter
    //if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' && fileSize <= fileLimit) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      console.log("Step 1B: File type is good!")
      cb(null, true);
    } else {
      console.log("Step 1B: Please choose an image type file like jpeg or something ya know?")
      cb(new Error('This is not a valid image file'))
    } 
  }
  
}).single('postImage')


//Function A3: Image Upload for User Photo
const localProfileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileUploadFolder)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const newFilename = file.fieldname + '-' + uniqueSuffix + "-" + file.originalname

    cb(null, newFilename)
  }
})

const uploadProfilePhotoLocal = multer({ 
  //Part 1: File Destination
  storage: localProfileStorage,
  limits: { fileSize: fileLimit},


  fileFilter: function (req, file, cb) {
    let size = req.rawHeaders.slice(-1)[0]

    console.log("Davey lets upload!!");
    console.log("File Limit: " + fileLimit + " File Size: " + size);

    //Create image and size filter
    //if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' && fileSize <= fileLimit) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      console.log("File type is good!!!!!!!")
      cb(null, true);
    } else {
      console.log("Please choose an image type file like jpeg or something ya know?")
      cb(new Error('This is not a valid image file'))
    } 
  }
  
}).single('profileImage')







module.exports = { uploadLocal, uploadProfilePhotoLocal }

/*

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
*/

/*
require('dotenv').config()
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs');
const multer = require('multer')
const upload = multer({ dest: './' })

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
  })

//Upload to S3
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
    //const key = "images/" + file.filename;
    const key = "images/" + file.filename;
  
    const uploadParams = {
      Bucket: bucketName,                                                                                                                                                               
      Body: fileStream,
      Key: key
    }
  
    return s3.upload(uploadParams).promise()

}

exports.uploadFile = uploadFile

//Download from S3
function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
  }

  return s3.getObject(downloadParams).createReadStream()
}

exports.getFileStream = getFileStream
*/


/*
//Download from S3
function getFileStream(fileKey) {
const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
}

return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream
  */


//APPENDIX

/*
require('dotenv').config()
//console.log(process.env)
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs');

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
  })

/*  
const s3 = new S3({
    region: region,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
  })
*/

/*
//Upload to S3
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
    //const key = "images/" + file.filename;
    const key = "images/" + file.filename;
  
    const uploadParams = {
      Bucket: bucketName,                                                                                                                                                               
      Body: fileStream,
      Key: key
    }
  
    return s3.upload(uploadParams).promise()

}

exports.uploadFile = uploadFile

//Download from S3
function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
  }

  return s3.getObject(downloadParams).createReadStream()
}

exports.getFileStream = getFileStream

*/

/*
//Download from S3
function getFileStream(fileKey) {
const downloadParams = {
    Key: fileKey,
    Bucket: bucketName
}

return s3.getObject(downloadParams).createReadStream()
}
exports.getFileStream = getFileStream
  */


//APPENDIX