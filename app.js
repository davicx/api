require('dotenv').config()
const express = require('express');
//const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
var cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3003;
//const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser())
app.use(express.static('public'));
app.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:3003"]
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
const profile = require('./application/routes/profileRoutes.js');
const upload = require('./application/routes/uploadRoutes.js');
const items = require('./application/routes/itemRoutes.js');
const messages = require('./application/routes/messageRoutes.js');
const conversations = require('./application/routes/conversationRoutes.js');
const chat = require('./application/atlas/routes/chatRoutes.js');

app.use(login);
app.use(group);
app.use(posts);
app.use(comments);
app.use(notifications);
app.use(requests);
app.use(friends);
app.use(search);
app.use(upload);
app.use(profile);
app.use(simple);
app.use(items);
app.use(messages);
app.use(conversations);
app.use('/chat', chat);

//Moved to doc backup
//const uploadLearning = require('./application/upload_temp/uploadRoutes.js');
//app.use(uploadLearning);


//Server Login 
app.listen(PORT, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})


app.get("/hiya", (req, res) => {
  console.log("hiya!");
  res.json({hiya: "hiya!"});
  res.end()
})

app.post("/api/kuali", (req, res) => {
  const vendorHeaderIds = req.body;
  // 3 IDs treated as unknown for testing: 59998, 65764, 78271
  const knownIds = [80194, 83655, 80945, 83595, 77354, 83847, 79272, 43929, 41707, 83859, 83968, 83759, 83748, 83739, 83736, 83995, 19315, 83994, 79328, 79326, 79356, 79591, 79337, 83855, 79669, 83993, 83991, 79921, 79372, 84075, 84041, 84068, 79976, 84069, 84089, 82862, 82213, 77949, 78564, 78350, 78288, 83244];

  const knownVendors = {};
  const unknownVendors = [];

  for (const id of vendorHeaderIds) {
    const numId = typeof id === "string" ? parseInt(id, 10) : id;
    if (knownIds.includes(numId)) {
      knownVendors[numId] = `*****${String(numId).slice(-4)}`;
    } else {
      unknownVendors.push(numId);
    }
  }

  res.json({ knownVendors, unknownVendors });
});


//SIMPLE
/*
require('dotenv').config()
const express = require('express');
//const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
var cors = require('cors')
const app = express()
//const PORT = process.env.PORT || 3003;
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser())
app.use(express.static('public'));
app.use(
  cors({
      credentials: true,
      origin: ["http://localhost:3003", "http://localhost:3000"]
  })
);

app.listen(PORT, () => {
  console.log("Server is up and listening on 5000...")
})

/*
app.listen(3003, () => {
  console.log("Server is up and listening on 3003...")
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})


app.get("/hello", (req, res) => {
  console.log("hiya!");
  res.send({hello: "Hiya davey!"});
  res.end()
})
*/

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
