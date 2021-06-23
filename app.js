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
  const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts";

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


//TYPE 5: Simple POST request 
app.post('/post', function(req, response) {

  //console.log(req.body.postFrom + " " + req.body.postTo + " " + req.body.postCaption);
  const postType = req.body.postType
  const postStatus = req.body.postStatus
  const groupID = req.body.groupID
  const postFrom = req.body.postFrom
  const postTo = req.body.postTo
  const postCaption = req.body.postCaption
  const notificationMessage = req.body.notificationMessage
  const notificationType = req.body.notificationType
  const notificationLink = req.body.notificationLink

  console.log(postType + " " + postFrom + " " + postTo + " " + postCaption + " " + notificationMessage + " " + notificationType + " " + notificationLink);

  const queryString = "INSERT INTO posts (post_type, post_status, group_id, post_from, post_to, post_caption) VALUES (?, ?, ?, ?, ?, ?)"
  getConnection().query(queryString, [postType, postStatus, groupID, postFrom, postTo, postCaption], (err, results, fields) => {
    if (err) {
      console.log("Could not insert the post " + err)
      response.sendStatus(500)
      return
    }
    var newPostID = results.insertId;
    console.log("Inserted a new post with id: ", newPostID);
    const post_outcome = "Inserted a new post with id: " + newPostID;
    response.setHeader('Content-Type', 'application/json');

    const outcome = {"post_outcome": post_outcome};
    response.write(JSON.stringify(outcome));
    response.end();
  })
 
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
