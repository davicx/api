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


//Part 1: File Destination
var fileLimit = 1024 * 1024; 
const uploadFolder = "./application/upload_temp/uploads";

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

//Function: Upload an Image to Local
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  limits: { fileSize: fileLimit},

  fileFilter: function (req, file, cb) {
    let size = +req.rawHeaders.slice(-1)[0]

    console.log("_________________")
    console.log("uploadLocal")
    console.log("File Limit: " + fileLimit)
    console.log("File Size: " + size)
    //console.log("Remaining: " + parseInt(fileLimit) - parseInt(size))

    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' && fileSize <= fileLimit) {
      console.log("File type is good!")
      cb(null, true);
    } else {
      console.log("Please choose an image type file like jpeg or something ya know?")
      cb(new Error('Please choose an image'))
    } 
    console.log("_________________")
  }
  
}).single('image')

//WORKS
/*
//Function: Upload an Image to Local
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  
  limits: { fileSize: fileLimit},
  
  fileFilter: function (req, file, cb) {
    console.log("fileFilter")
    let size = +req.rawHeaders.slice(-1)[0]

    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' && fileSize <= fileLimit) {
      console.log("File type is good!")
      cb(null, true);
    } else {
      console.log("Please choose an image")
      cb(null, false);
    } 


  }
  
}).single('image')
*/
//WORKS
/*
//Function: Upload an Image to Local
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  
  limits: { fileSize: fileLimit},
  
  fileFilter: function (req, file, cb) {
    console.log("fileFilter")
    let size = +req.rawHeaders.slice(-1)[0]

    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      console.log("File type is good!")
      cb(null, true);
    } else {
        console.log("Please choose an image")
        cb(null, false);
    } 
  }
  
}).single('image')
*/
/*
const TYPE_IMAGE = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};
const TYPE_File = {
  'application/pdf': 'pdf',
};

const fileUpload = 
  multer({
    limits: 500000, 
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/images');
      },
      filename: (req, file, cb) => {
        const ext = (TYPE_IMAGE[file.mimetype]) ? TYPE_IMAGE[file.mimetype] : TYPE_File[file.mimetype];
        cb(null, uuid() + '.' + ext);
      }
    }),
    fileFilter: (req, file, cb) => {
      let size = +req.rawHeaders.slice(-1)[0]
      let isValid =false;
      if(!!TYPE_IMAGE[file.mimetype] && size < 4 * 1024 * 1024  ){
        isValid = true
      }
      if(!!TYPE_File[file.mimetype] && size < 1 * 1024 * 1024  ){
        isValid = true
      }
      let error = isValid ? null : new Error('Invalid mime type!');
      cb(error, isValid);
    }
  }).any();


*/

module.exports = { uploadLocal }


//Part 2: Photo Filter
var photoFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      console.log("File is good!")
      cb(null, true);
    } else {
        console.log("Please choose an image")
        cb(null, false);
    } 
  }
  
   
/*
const fileFilterMiddleware = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"])

    if ((file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "application/octet-stream") && fileSize <= 1282810) {
        cb(null, true)
    } else if (file.mimetype === "video/mp4" && fileSize <= 22282810) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}
*/