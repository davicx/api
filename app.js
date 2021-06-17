const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
var mysql = require('mysql');

app.listen(PORT, () => {
  console.log("Server is up and listening on " + PORT)
})

app.get("/", (req, res) => {
    console.log("hiya!");
    res.send("hiya!");
    res.end()
})

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

    /*
    var connection = mysql.createConnection({
      host     : process.env.RDS_HOSTNAME,
      user     : process.env.RDS_USERNAME,
      password : process.env.RDS_PASSWORD,
      port     : process.env.RDS_PORT
    });
      host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
      user: 'admin',
      password: 'gCtLRbXMWWS2SwNg',
      database: 'shareshare'       
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
*/

    var connection = mysql.createConnection({
        host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
        user: 'admin',
        password: 'gCtLRbXMWWS2SwNg',
        database: 'shareshare' 
    });

    const output = ""
    
    connection.connect(function(err) {
      if (err) {
        output = 'Database connection failed: ' + err.stack;
        console.error('Database connection failed: ' + err.stack);
        return;
      } else {
        output = 'worked!';
      }
    
      console.log('Connected to database.');
    });
    
    connection.end();
    res.send({connected: output})
})


