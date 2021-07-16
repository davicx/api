const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const mysql = require('mysql');
const posts = require('./application/routes/posts.js');
app.use(express.json());
app.use(posts);

app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})
