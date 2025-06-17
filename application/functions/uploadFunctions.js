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
const awsStorage = require('../functions/aws/awsStorage');

//Upload imports
var mime = require('mime-types')



/*
FUNCTIONS A: All Functions Related to Local Uploads
	1) Function A1: Create local upload and filename for uploads folder
	2) Function A2: Image Upload for Local Upload 
*/

//SETUP: Set File Destination and Size
//var fileLimit = 1024 * 1024 * 40; 
var fileLimit = 1024 * 1024 * 40; 
//var fileLimit = 1024; 
//var uploadFolder = "./application/upload_temp/uploads";
var uploadFolder = "./public/kite-posts-us-west-two";
//var profileUploadFolder = "./public/profile";
var profileUploadFolder = "./public/kite-profile-us-west-two";
var groupUploadFolder = "./public/kite-groups-us-west-two";

//Function A1: Post Image Upload for Local Upload 
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

const uploadPostPhotoLocal = multer({ 
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

//Function A2: New Group Image Upload for Local Upload
const localGroupStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, groupUploadFolder)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const newFilename = file.fieldname + '-' + uniqueSuffix + "-" + file.originalname

    cb(null, newFilename)
  }
})

const uploadGroupPhotoLocal = multer({ 
  storage: localGroupStorage,
  limits: { fileSize: fileLimit},


  fileFilter: function (req, file, cb) {
    let size = req.rawHeaders.slice(-1)[0]

    console.log("Davey lets upload a GROUP photo!!");
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
  
}).single('groupImage')

//Function A3: User Image Upload for Local Upload
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



module.exports = { uploadPostPhotoLocal, uploadGroupPhotoLocal, uploadProfilePhotoLocal }
