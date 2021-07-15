/*const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const mysql = require('mysql');
app.use(express.json());

app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})
*/
const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()

//const morgan = require('morgan')
const posts = require('./application/routes/posts.js');
//const login = require('./application/routes/login.js');
//app.use(morgan('short'));
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



/*

//ROUTE 1: Simple GET Request 
app.get('/user/:username', (req, res) => {
    console.log("Fetching user with id: " + req.params.username);  
    res.send("User " + req.params.username);
    res.end();
})

//ROUTE 2: Simple Users Response
app.get("/users", (req, res) => {
    const user1 = {firstName: "David", lastName: "V"}
    const user2 = {firstName: "Frodo", lastName: "B"}
    const user3 = {firstName: "Bilbo", lastName: "B"}
    const user4 = {firstName: "Sam", lastName: "G"}
    res.json([user1, user2, user3])
})

//ROUTE 2: Simple Users Response
app.get("/database", (req, res) => {
    const connection = mysql.createConnection({
        host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
        user: 'admin',
        password: 'gCtLRbXMWWS2SwNg',
        database: 'shareshare'
      })

      const queryString = "SELECT * FROM posts LIMIT 5;";
  
      connection.query(queryString, (err, rows, fields) => {
          if (err) {
            console.log("Failed to query for users: " + err)
            res.sendStatus(500)
            return
            // throw err
          }
      
          console.log("I think we fetched users successfully");
          res.json(rows);
      })

})


//ROUTE 4: Simple Post Response from Database
app.get("/posts", (req, res) => {

  //Create Query 
  const connection = getConnection();
  const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts LIMIT 5";

  connection.query(queryString, (err, rows) => {
      if (err) {
          console.log("Failed to Select Posts" + err)
          res.sendStatus(500)
          return
      }
      //TEMP
      res.setHeader('Access-Control-Allow-Origin', '*');
      //TEMP
      res.json(rows);

  })

})


app.post('/post', function(req, response) {
	console.log("________________Hiya_______________");
	console.log(req.body);
	let body = req.body
	//let output = {hello: 'hello'}
	let output = {hello: body}
    //response.send(req.body);
    response.send(output);
	console.log("________________Hiya_______________");
})

//Functions: Get Connection
function getConnection() {
  return mysql.createConnection({
    host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gCtLRbXMWWS2SwNg',
    database: 'shareshare'
    //host: 'localhost',
    //user: 'root',
    //password: '',
    //database: 'shareshare'
  })
}

*/