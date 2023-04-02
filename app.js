require('dotenv').config()
const express = require('express');
//const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
var cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3003;
app.use(express.json());
app.use(cookieParser())
app.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000"]
  })
);

//Application 
const login = require('./application/routes/loginRoutes.js'); 
const group = require('./application/routes/groupRoute.js'); 
const posts = require('./application/routes/postRoutes.js'); 
const comments = require('./application/routes/commentRoutes.js');
const notifications = require('./application/routes/notificationRoutes.js');

app.use(login);
app.use(group);
app.use(posts);
app.use(comments);
app.use(notifications);

//Server Login 
app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

/*
Data 
  - Post or Comment ID
Message: ""
Current User: ""
Status code: 200
Errors: [] 
Outcome Success: true or false
*/

 
//
//const posts = require('./application/routes/postRoutes.js');
//const user = require('./application/routes/userRoutes.js');
//const group = require('./application/routes/groupRoutes.js');
//const groups = require('./application/routes/groupRoute.js');
//const notification = require('./application/routes/notificationRoutes.js');

//const upload = require('./application/routes/uploadRoutes.js'); 
//const learning = require('./application/routes/learningRoutes.js'); 

//
//app.use(posts);
//app.use(groups);
//app.use(user);
//app.use(postGroup);
//app.use(notification); 
//app.use(upload); 
//app.use(learning); 
