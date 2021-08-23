const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const mysql = require('mysql');
const posts = require('./application/routes/postRoutes.js');
const user = require('./application/routes/userRoutes.js');
app.use(express.json());
app.use(posts);
app.use(user);

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