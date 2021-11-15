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
    cb(null, 'C:/wamp/www/sites/api/uploads')
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





////
//This is there thing that said to do
/*
var aws = require('aws-sdk')
var express = require('express')
var multer = require('multer')
var multerS3 = require('multer-s3')

var app = express()
var s3 = new aws.S3({  })

var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'some-bucket',
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})

app.post('/upload', upload.single('photos', 3), function(req, res, next) {
  res.send('Successfully uploaded ' + req.files.length + ' files!')
})
*/

////

//ROUTE A.2: Upload Post Photo (AWS to S3)
/*
var upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 20},
  fileFilter: fileFilter
})
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 20},
    fileFilter: fileFilter
})
*/

//Storage
/*
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/wamp/www/sites/api/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname) 
    }
})

*/

//File Filter
/*
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    } 
}

function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if(mimetype && extname){
      return cb(null,true);
    } else {
      cb('Error: Images Only!');
    }
}
*/








//ORGANIZE BELOW 

//UPLOAD PHOTO: Local
/*
uploadRouter.post('/upload/photo', upload.single('postImage'), (req, res) => {
    const file = req.file
    if(file !== undefined) {
        console.log(file);
        postFunctions.postPhoto(req, res, file);
    } else {
        res.json({postType:'please choose an image file'});
    }
})
*/

//UPLOAD PHOTO: AWS
/*
uploadRouter.post('/upload/photo/aws/temp', upload.single('postImage'), async (req, res) => {
    const file = req.file
    if(file !== undefined) {
        //postFunctions.postPhoto(req, res, file);
        const result = await uploadFile(file);
        console.log(file)        
        console.log(result)        
        res.json({file: file, imagePath: `/post/image/${result.Key}`});
    } else {
        res.json({postType:'please choose an image file'});
    }
})
*/

/*
//http://localhost:3003/post/image/1635895419660hiya.jpg
uploadRouter.get('/post/image/:key', (req, res) => {
  console.log(req.params)
  const key = req.params.key
  const readStream = getFileStream(key)

  readStream.pipe(res)
})

*/





/*


const storage = multer.diskStorage({
    destination: './uploadedContent',
    filename: function(_req, file, cb){

      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    } 
  });

var upload = multer({
    storage: storage,
    limits: {
        fields: 5,
        fieldNameSize: 50, // TODO: Check if this size is enough
        fieldSize: 20000, //TODO: Check if this size is enough
        // TODO: Change this line after compression
        fileSize: 15000000, // 150 KB for a 1080x1080 JPG 90
    },
    fileFilter: function(_req, file, cb){
        checkFileType(file, cb);
    }
}).single('postPicture');

function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}
*/
/*
var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
    }
});
*/


/*
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});
*/

//WORKS: Simple 
/*
const upload = multer({dest: 'C:/wamp/www/sites/api/uploads'})
uploadRouter.use(cors())

//UPLOAD PHOTO
uploadRouter.post('/upload/photo', upload.single('postImage'), (req, res) => {
    console.log("upload photo")
    const file = req.file
    const postType = req.body.postType
	res.json({postType:'upload'});
})

*/
//WORKS
/*
const express = require('express')
const uploadRouter = express.Router();
const db = require('./../../functions/conn');
const cors = require('cors');
const multer  = require('multer')
const path = require('path')
uploadRouter.use(cors())
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/wamp/www/sites/api/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + file.originalname + path.extname(file.originalname)) 
      //cb(null, file.originalname)
    }
})
const upload = multer({storage: storage})


//UPLOAD PHOTO
uploadRouter.post('/upload/photo', upload.single('postImage'), (req, res) => {
    console.log("upload photo")
    const file = req.file
    const postType = req.body.postType
    console.log(file)
	res.json({postType:'upload'});
})
*/

/*

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/wamp/www/sites/api/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})

*/

/*
function localUpload(req, res) {
    console.log("upload photo")
	upload.single('postImage')
	res.json({postType:'upload'});
}
*/


/*

var path = require('path')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/Users/vasquez_d/Desktop/sites/sites/shareshare/user_uploads/post_images')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })

//const upload = multer({ dest: 'C:/Users/vasquez_d/Desktop/sites/sites/shareshare/user_uploads/post_images' })
var upload = multer({ storage: storage });

postRouter.post('/post/photo', upload.single('postImage'), (req, res) => {
    const postType = req.body.postType;
    const file = req.file;
    const fileNameServer = req.file.filename + req.file.originalname;
    console.log(fileNameServer);

    //This creates a Filename 
    console.log(file);
    console.log("Hiya! " + postType);
	res.json({postType:postType});
})

*/


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