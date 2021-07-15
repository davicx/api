const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const morgan = require('morgan')
const posts = require('./application/routes/posts.js');
//const login = require('./application/routes/login.js');
app.use(morgan('short'));
app.use(express.json());
app.use(posts);
//app.use(login);

//Home Route
app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT + "...")
})

app.get("/", (req, res) => {
  console.log("Responding to root route");
  res.send("hiya davey!")
  res.end()
})
