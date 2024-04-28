const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const s3 = new S3({ region, accessKeyId, secretAccessKey })
const fs = require('fs') 
const multer = require('multer')
const upload = multer({ dest: './uploads' })

/*
FUNCTIONS A: All Functions Related to Local Uploads
	1) Function A1: Create local upload and filename for uploads folder
	2) Function A2: Function A2: Image Upload for Local Upload 
*/

//SETUP: Set File Destination and Size
var fileLimit = 1024 * 1024 * 20; 
var uploadFolder = "./application/upload_temp/uploads";

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
    let size = +req.rawHeaders.slice(-1)[0]

    //Create image and size filter
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' && fileSize <= fileLimit) {
      console.log("File type is good!")
      cb(null, true);
    } else {
      console.log("Please choose an image type file like jpeg or something ya know?")
      cb(new Error('This is not a valid image file'))
    } 
  }
  
}).single('postImage')


module.exports = { uploadLocal }



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