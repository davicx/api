require('dotenv').config()
const express = require('express')
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const uploadRouter = express.Router();
const postFunctions = require('../../functions/postFunctions')
const cors = require('cors');
const multer  = require('multer')
const s3 = new S3({ region, accessKeyId, secretAccessKey })
uploadRouter.use(cors())

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/wamp/www/sites/api/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname) 
    }
})

var upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 20},
    fileFilter: fileFilter
})

//ROUTE 1: Upload Post Photo
uploadRouter.post('/upload/photo/local', upload.single('postImage'), (req, res) => {
    const file = req.file
    if(file !== undefined) {
        postFunctions.postPhoto(req, res, file);
        //res.json(postOutcome)
        //console.log(postOutcome);
        console.log(file);
    } else {
        res.json({postType:'please choose an image file'});
    }  
})

uploadRouter.post('/upload/photo/aws/class', upload.single('postImage'), async (req, res) => {
    const file = req.file
    if(file !== undefined) {
        const postOutcome = await postFunctions.postPhoto(req, res, file); 
        const result = await uploadFile(file);
        console.log(postOutcome);
        console.log(file)        
        console.log(result)    
           
        //res.json({file: file, imagePath: `/post/image/${result.Key}`});
    } else {
        res.json({postType:'please choose an image file'});
    }
})

//ROUTE 2: Upload Post File
//ROUTE 3: Upload User Image 
//ROUTE 4: Upload Group Image

//ROUTE 1: Get a Post Photo
uploadRouter.get('/post/image/:key', (req, res) => {
    console.log(req.params)
    const key = req.params.key
    const readStream = getFileStream(key)
  
    readStream.pipe(res)
  })
  
//ROUTE 2: Get a Post File
//ROUTE 3: Get a User Image 
//ROUTE 4: Get a Group Image


//UPLOAD LIBRARY

//AWS UPLOAD

//FUNCTIONS
//Function A.1: Make sure file is a photo 
var photoFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    } 
}

var fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    } 
}

//Function B.1: Upload to AWS 
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
  
    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
}

//Function B.2: Download from AWS 
function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
}





//http://localhost:3003/post/image/1635895419660hiya.jpg


module.exports = uploadRouter;


/*
{
  fieldname: 'postImage',
  originalname: 'hiya.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  destination: 'C:/wamp/www/sites/api/uploads',
  filename: '1635896393797hiya.jpg',
  path: 'C:\\wamp\\www\\sites\\api\\uploads\\1635896393797hiya.jpg',
  size: 182337
}
{
  ETag: '"72653cbde20adeab37c6bcb570226a08"',
  Location: 'https://kite-post-photo-upload.s3.us-west-2.amazonaws.com/1635896393797hiya.jpg',
  key: '1635896393797hiya.jpg',
  Key: '1635896393797hiya.jpg',
  Bucket: 'kite-post-photo-upload'
}


*/
