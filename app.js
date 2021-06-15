const express = require('express')
const morgan = require('morgan')
const mysql = require('mysql')
const port = process.env.port || 3003;
const app = express()

app.use(morgan('short'))
app.use(express.json());

app.listen(port, () => {
  console.log("Server is up and listening on 3003...")
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
    res.json([user1, user2, user3])
})

//ROUTE 3: Simple GET Request for Posts
app.get('/post/:postID', (req, res) => {
    console.log("Fetching post with id: " + req.params.postID);  
    res.send("Post " + req.params.postID);
    res.end();
})

/*
//ROUTE 4: Simple Post Response from Database
app.get("/posts", (req, res) => {

      //Create Query 
      const queryString = "SELECT * FROM posts LIMIT 5";

      getConnection().query(queryString, (err, rows) => {
          if (err) {
              console.log("Failed to Select New User: " + err)
              res.sendStatus(500)
              return
          }
  
          //Output Data
          const posts = rows.map((row) => {
              return {
                  postFrom: row.post_from,
                  postTo: row.post_to,
                  postCaption: row.post_caption
              }      
          }); 
          res.json(posts);
          //res.json(rows);  
          res.end()
      })
})
*/

//ROUTE 4: Simple POST request 
app.post('/hello', function(req, res) {
    let hello = req.body;

    res.send(hello);
}) 
    

//Functions: Get Connection
function getConnection() {
    return mysql.createConnection({
      host: 'shareshare.c3itguipg2wt.us-west-2.rds.amazonaws.com',
      user: 'admin',
      password: 'gCtLRbXMWWS2SwNg',
      database: 'shareshare'
    })
}
  
/*
host: 'localhost',
user: 'root',
password: '',
database: 'shareshare'

*/


 


/*

var port = process.env.PORT || 3000,
    http = require('http'),
    fs = require('fs'),
    html = fs.readFileSync('index.html');

var log = function(entry) {
    fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n');
};

var server = http.createServer(function (req, res) {
    if (req.method === 'POST') {
        var body = '';

        req.on('data', function(chunk) {
            body += chunk;
        });

        req.on('end', function() {
            if (req.url === '/') {
                log('Received message: ' + body);
            } else if (req.url = '/scheduled') {
                log('Received task ' + req.headers['x-aws-sqsd-taskname'] + ' scheduled at ' + req.headers['x-aws-sqsd-scheduled-at']);
            }

            res.writeHead(200, 'OK', {'Content-Type': 'text/plain'});
            res.end();
        });
    } else {
        res.writeHead(200);
        res.write(html);
        res.end();
    }
});

// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port + '/');

*/
