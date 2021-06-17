const express = require('express')
const PORT = process.env.PORT || 3003;
const app = express()
const mysql = require('mysql');

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
    res.json([user1, user2, user3, user4])
})

//ROUTE 2: Simple Users Response
app.get("/database", (req, res) => {
    const connection = mysql.createConnection({
        host: 'oniddb.cws.oregonstate.edu',
        user: 'vasquezd-db',
        password: 'gCtLRbXMWWS2SwNg',
        database: 'vasquezd-db'
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



    /*

        host: 'oniddb.cws.oregonstate.edu',
        user: 'vasquezd-db',
        password: 'gCtLRbXMWWS2SwNg',
        database: 'vasquezd-db'
        
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'shareshare'
        
        host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
        user: 'admin',
        password: 'gCtLRbXMWWS2SwNg',
        database: 'shareshare'
        
	});

    const output = "";
	connection.connect(function(err) {
	  if (err) {
		console.error('Database connection failed: ' + err.stack);
        output =  "Failed";
		return;
	  } 

	  console.log('Connected to database.');
      output = "Connected to database";
	});

	connection.end();
    res.send({database: output})
    */