//require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()


const mysql = require('mysql');
const user = require('./application/routes/userRoutes.js');
const group = require('./application/routes/groupRoutes.js');
const posts = require('./application/routes/postRoutes.js');

//const upload = require('./application/routes/uploadPhoto.js'); //temp

app.use(user);
app.use(group);
app.use(posts);
//app.use(upload); //temp
//app.use(uploadClass); //temp

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})