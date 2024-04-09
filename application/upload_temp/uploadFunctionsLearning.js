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

function sayHi() {
    console.log("hi")
}


//Part 1: File Destination
const uploadFolder = "./application/upload_temp/uploads";

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    console.log(uniqueSuffix)
    console.log(file)
    const newFilename = file.fieldname + '-' + uniqueSuffix + "-" + file.originalname

    cb(null, newFilename)
  }
})

//MULTER
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  limits: { fileSize: 1024 * 1024 * 20},
  fileFilter: function (req, file, cb) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      console.log("File is good!")
      cb(null, true);
    } else {
        console.log("Please choose an image")
        cb(null, false);
    } 
  }
})


module.exports = { sayHi, uploadLocal }