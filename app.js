require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
app.use(express.json());

const login = require('./application/routes/loginRoutes.js');
const posts = require('./application/routes/postRoutes.js');
const user = require('./application/routes/userRoutes.js');
const group = require('./application/routes/groupRoutes.js');
const upload = require('./application/routes/uploadRoutes.js'); 
const notification = require('./application/routes/notificationRoutes.js'); 

app.use(login);
app.use(user);
app.use(group);
app.use(posts);
app.use(upload); 
app.use(notification); 

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

/*
require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const posts = require('./application/routes/postRoutes.js');
const user = require('./application/routes/userRoutes.js');
const group = require('./application/routes/groupRoutes.js');
const upload = require('./application/routes/uploadRoutes.js'); 

app.use(express.json());

app.use(user);
app.use(group);
app.use(posts);
app.use(upload); 

app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

*/