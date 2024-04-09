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
const requests = require('./application/routes/requestRoutes.js');
const friends = require('./application/routes/friendRoutes.js');
const search = require('./application/routes/searchRoutes.js');
const simple = require('./application/routes/simpleRoutes.js');
//const profile = require('./application/routes/profileRoutes.js');
const upload = require('./application/routes/uploadRoutes.js');
const uploadLearning = require('./application/upload_temp/uploadLearning.js');

app.use(login);
app.use(group);
app.use(posts);
app.use(comments);
app.use(notifications);
app.use(requests);
app.use(friends);
app.use(search);
app.use(upload);
app.use(uploadLearning);
//app.use(profile);

//Server Login 
app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})



//APPENDIX
//const posts = require('./application/routes/postRoutes.js');
//const group = require('./application/routes/groupRoutes.js');
//const groups = require('./application/routes/groupRoute.js');
//const notification = require('./application/routes/notificationRoutes.js');

//const upload = require('./application/routes/uploadRoutes.js'); 
//const learning = require('./application/routes/learningRoutes.js'); 

//app.use(posts);
//app.use(groups);
//app.use(postGroup);
//app.use(notification); 
//app.use(upload); 
//app.use(learning); 
