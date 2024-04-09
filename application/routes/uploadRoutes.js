require('dotenv').config()
const express = require('express')
const app = express()
const uploadRouter = express.Router();

//const cookieParser = require('cookie-parser');
//const morgan = require('morgan')
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
//const { uploadFile, getFileStream } = require('../functions/uploadFunctions')
var mime = require('mime-types')
var cors = require('cors')
uploadRouter.use(cors())

const postFunctions = require('../functions/postFunctions')
const posts = require('../logic/posts')


/*
FUNCTIONS A: All Functions Related to Posts
	1) Function A1: Post Text
*/


//Part 1: File Destination
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    console.log(uniqueSuffix)
    console.log(file)
    const newFilename = file.fieldname + '-' + uniqueSuffix + "-" + file.originalname

    cb(null, newFilename)
  }
})

//Upload Type
//WORKS
/*
const uploadLocal = multer({ 
  //Part 1: File Destination
  storage: localStorage,
  limits: { fileSize: 1024 * 1024 * 20},
})
*/

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
/*

*/


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


//Route A1: Post Photo (Move to postRoutes)
uploadRouter.post('/post/photo/local/old', uploadLocal.single('image'), async function(req, res) {
  let file = req.file
  let description = req.body.description

  if(file !== undefined) {
    //postFunctions.postPhoto(req, res, file);
    let fileExtension = mime.extension(file.mimetype);
    res.send({yay: "yay!", file: file, description: description, fileExtension: fileExtension})
  
  } else {
    res.json({postType:'please choose an image file'});
  }  


})

//Local
/*
var uploadLocal = multer({
  limits: { fileSize: 1024 * 1024 * 20},
  photoFilter: photoFilter
})

var localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    //cb(null, 'C:/wamp/www/api/images/user_uploads')
    cb(null, '/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname) 
  }
})

//AWS

//ALL
var photoFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    console.log("File is good!")
    cb(null, true);
  } else {
      console.log("Please choose an image")
      cb(null, false);
  } 
}

//FUNCTIONS
//Route A2: Post Photo (Move to postRoutes)
uploadRouter.post('/post/photo/local', upload.single('image'), async function(req, res) {
  let file = req.file
  let description = req.body.description


  if(file !== undefined) {
    //postFunctions.postPhoto(req, res, file);
    let fileExtension = mime.extension(file.mimetype);
    res.send({yay: "yay!", file: file, description: description, fileExtension: fileExtension})
  
  } else {
    res.json({postType:'please choose an image file'});
  }  


})

*/






//APPENDIX


//SORT BELOW
/*
var postPhotoStorage = multerS3({
      s3: s3,
      bucket: 'kite-post-photo-upload',
      key: function (req, file, cb) {
          console.log(file);
          cb(null, Date.now() + file.originalname);
      }
})



var uploadPostPhoto = multer({
  storage: postPhotoStorage,
  limits: { fileSize: 1024 * 1024 * 20},
  photoFilter: photoFilter
});
*/

//ROUTE A.1: Upload Post Photo (Local)
/*
uploadRouter.post('/upload/photo/local', uploadLocal.single('postImage'), (req, res) => {
  const file = req.file
  console.log(file)


  if(file !== undefined) {
      //postFunctions.postPhoto(req, res, file);
      posts.postPhoto(req, res);
  } else {
      res.json({postType:'please choose an image file'});
  }  
})
*/
//ROUTE A.2: Upload Post Photo (Local to S3)
/*
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
*/

//Function B: Make sure file is a photo 

//Temp
/*
uploadRouter.get("/upload", (req, res) => {
    res.json({working: "working", region: region})
})
*/


//FUNCTIONS
//Function C.1: Upload to AWS 
/*
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
*/

module.exports = uploadRouter;




//APPENDIX
/*
const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
var cors = require('cors')
const morgan = require('morgan')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile, getFileStream } = require('./s3')
var mime = require('mime-types')
//const { uploadFile, getFileStream } = require('./s3')

app.use(express.json());
app.use(cors())
app.use(cookieParser())
//app.use(morgan('short'));

//STOP: 23 second time 20
//https://www.youtube.com/watch?v=NZElg91l_ms
//Bucket: tutorial-upload-images-node
//arn:aws:s3:::tutorial-upload-images-node/*

//https://www.npmjs.com/package/mime-types
//Router
app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
  console.log("Hello!");
  res.json({hi: "hiya!"})
})

app.get("/hello", (req, res) => {
  console.log("API: Hello!");
  res.json({hello: "hello!"})
})


//UPLOAD Local
app.post('/local/images', upload.single('image'), async (req, res) => {
  const file = req.file
  const description = req.body.description

  let fileExtension = mime.extension(file.mimetype) 

  console.log(file)
  console.log("description")
  console.log(description)


  res.send({yay: "yay!", file: file, description: description, fileExtension: fileExtension})
})

//UPLOAD AWS
app.post('/images', upload.single('image'), async (req, res) => {
  const file = req.file
  const description = req.body.description


  //add error handling
  const result = await uploadFile(file)
  const fullKey = "/images/" + result.key;

  let fileExtension = mime.extension(file.mimetype) 

  console.log("result")
  console.log(result)
  console.log("file")
  console.log(file)

  res.send({yay: "yay!", result: result, imagePath: fullKey, file: file, description: description, fileExtension: fileExtension})

})


//GET IMAGE
app.get('/images/:key', (req, res) => {
  console.log(req.params)
  const key = req.params.key

  const fullKey = "images/" + key;
  console.log("You got the image with full key")
  console.log(fullKey)
  const readStream = getFileStream(fullKey)

  readStream.pipe(res)
  //res.json({hi:key})
})


*/