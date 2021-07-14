const mysql = require('mysql')
//const Notification = require('./../models/Notification.js')

function getSinglePost(req, res) {
    const post_id = req.params.post_id;

    //Create Query 
    const connection = getConnection();
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_id = ?";

    connection.query(queryString, [post_id], (err, rows, fields) => {
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
}

function getUserPosts(req, res) {
    const post_to = req.params.post_to;

    //Create Query 
    const connection = getConnection();
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE post_to = ?";

    connection.query(queryString, [post_to], (err, rows, fields) => {
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
}

function getGroupPosts(req, res) {
    const group_id = req.params.group_id;

    //Create Query 
    const connection = getConnection();
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts WHERE group_id = ?";

    connection.query(queryString, [group_id], (err, rows) => {
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
}

function getAllPosts(req, res) {

    //Create Query 
    const connection = getConnection();
    const queryString = "SELECT post_id, post_from, post_to, post_caption FROM posts LIMIT 20";

    connection.query(queryString, (err, rows, fields) => {
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
}

//POST: 
function newPost(req, response) {
    console.log(req.body);
    console.log("Trying to create a new post")
  
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
}

module.exports = { getSinglePost, getUserPosts, getGroupPosts, getAllPosts, newPost };

//Create Connection Pool 
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'shareshare'
})

//Functions: Get Connection
function getConnection() {
    return pool;
}