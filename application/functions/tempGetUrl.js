const express = require('express')
const app = express()
require('dotenv').config();
const crypto = require('crypto')

//AWS
const S3 = require('aws-sdk/clients/s3')
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");


const cookieParser = require('cookie-parser');
var cors = require('cors')
const morgan = require('morgan')
var bodyParser = require('body-parser');
const multer = require('multer')
//const upload = multer({ dest: 'uploads/' })
//const { uploadFile, getFileStream } = require('./s3')
var mime = require('mime-types')

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.json());
app.use(cors())
app.use(cookieParser())
//App
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Multer
const storage = multer.memoryStorage()
const upload = multer({storage: storage})

//const { uploadFile, getFileStream } = require('./s3')
//var mime = require('mime-types')



//APP
app.use(express.json());
app.use(cors())
app.use(cookieParser())

//ENV
const bucketName = process.env.AWS_BUCKET_NAME
const bucketRegion = process.env.AWS_BUCKET_REGION
const accessKey = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')


//S3
const s3 = new S3Client({ 
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey 
  },
  region: bucketRegion
})

app.get("/", (req, res) => {
  console.log("Hello!");
  res.json({hi: "hiya!"})
})


app.get("/api/posts", async (req, res) => {
  console.log("Hello!");
  const post1 = {userName: "davey", caption: "hiya!", imageKey: "59045070_p0.jpg"}
  //const post2 = {userName: "Frodo", caption: "B"}
  //const post3 = {userName: "David", caption: "B"}

  //const posts = [post1, post2, post3];
  const posts = [post1];

  const getObjectParams = {
    Bucket: bucketName,
    Key: post1.imageKey,
  }

  //const client = new S3Client(clientParams);
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  post1.imageURL = url

  res.json({posts})

})




app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})


