const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
const morgan = require('morgan')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile, getFileStream } = require('./s3')
var mime = require('mime-types')
var cors = require('cors')

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

