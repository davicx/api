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
    //let currentPost = new Post(1)
    //console.log(currentPost.postCaption + " " + currentPost.postID)

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


module.exports = { getSinglePost, getUserPosts, getGroupPosts, getAllPosts };


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


/*
  const user1 = {firstName: "David", lastName: "V"}
    const user2 = {firstName: "Frodo", lastName: "B"}
    const user3 = {firstName: "Bilbo", lastName: "B"}
    res.json([user1, user2, user3])

router.get("/post/:post_id", (req, res) => {
    const post_id = req.params.post_id;

    //Create Query 
    const connection = getConnection();
    //const queryString = "SELECT post_from, post_to, post_caption FROM posts WHERE LIMIT 10";
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
})
*/