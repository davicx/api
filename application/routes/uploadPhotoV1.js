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
      cb(null, Date.now() + file.originalname) 
    }
})


const fileFilter = (req, file, cb) => {
    //Reject File 
    //cb(null, false); //ignore file don't store and don't throw error 

    //Accept File 
    //cb(null, true);

    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    } 
}


const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 20},
    fileFilter: fileFilter
})


//UPLOAD PHOTO
uploadRouter.post('/upload/photo', upload.single('postImage'), (req, res) => {
    console.log("upload photo")
    const file = req.file
    const postType = req.body.postType

    console.log(file)
    if(file !== undefined) {
        res.json({postType:'upload'});
    } else {
        res.json({postType:'please choose an image file'});
    }

})

module.exports = uploadRouter;

/*
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