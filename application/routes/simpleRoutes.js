const express = require('express')
const simpleRouter = express.Router();
const middlewares = require('../functions/middlewareFunctions')
const cloudFunctions = require('../functions/cloudFunctions');
const uploadFunctions = require('../functions/uploadFunctions');

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')
var path = require('path')
const db = require('../functions/conn');

/*
FUNCTIONS A: All Functions Related to Groups
	1) Function A1: Create a New Group
	2) Function A2: Invite User to a Group 


*/

//POSTS
//Single Post 
simpleRouter.get("/simple/post", (req, res) => {
    var post = {
      postID: 1, 
      postFrom: "david",
      postTo: "sam",
      postCaption: "hiya wanna hike!"
    }
  
    res.json(post)
  })

simpleRouter.get("/simple/database", (req, res) => {
  const connection = db.getConnection(); 
  const queryString = "SELECT * FROM posts WHERE post_id = ?";
  var post_id = 677

  var post = {
    postID: 1, 
    postFrom: "david",
    postTo: "sam",
    postCaption: "hiya wanna hike!"
  }

  connection.query(queryString, [post_id], (err, rows) => {
                    
    if (!err) {
        rows.map((row) => {
            console.log(row)
        }); 


    } else {
        console.log("error getting user profile")   
        console.log(err) 

    } 
    
}) 
  

  res.json(post)
})

//Simple Posts
simpleRouter.get("/simple/posts", (req, res) => {
  var post = {
    postID: 5, 
    postFrom: "david",
    postTo: "sam",
    postCaption: "hiya wanna hike!"
  }

  var post2 = {
    postID: 6, 
    postFrom: "david",
    postTo: "sam",
    postCaption: "hiya wanna hike!"
  }

  var post3 = {
    postID: 7, 
    postFrom: "david",
    postTo: "sam",
    postCaption: "hiya wanna hike!"
  }

  res.json([post, post2, post3])
})

//Simple New Post
simpleRouter.post("/simple/post/photo", (req, res) => {
	uploadFunctions.uploadLocal(req, res, async function (err) {
		var postCaption = req.body.postCaption;
		var postFrom = req.body.postFrom;
		console.log("POST CAPTION AND FROM")
		console.log(postCaption)
		console.log(postFrom)
		console.log("POST CAPTION! " + req.body.postCaption)
	
    var postOutcome = {
        hi: "hi"
    }

		var postOutcomeSmall = {
			postCaption: postCaption, 
      postFrom: postFrom,
			success: true,
		}

		//STEP 1: Check for a valid file
		console.log("STEP 1: Upload Post to API")

		//Error 1A: File too large
		if (err instanceof multer.MulterError) {
			console.log("Error 1A: File too large")
			postOutcome.message = "Error 1A: File too large"
	  
		//Error 1B: Not Valid Image File
		} else if (err) {
			console.log("Error 1B: Not Valid Image File")
			postOutcome.message = "Error 1B: Not Valid Image File"
	
		//Success 1A: No Multer Errors
		} else {
			let file = req.file
			postOutcome.file = file;
			console.log("Success 1A: No Multer Errors")
	
			//Success 1B: Success Upload File
			if(file !== undefined) {
				console.log("Success 1B: Success Upload File")
				uploadSuccess = true   
	
			//Error 1C: No File 	
			} else {
			  console.log("Error 1C: No File mah dude!")
			  postOutcome.message = "Error 1C: No File mah dude!"
	 
			} 
		}

		
		//res.json(postOutcome)
    console.log("Success 1C: Finished Upload")
		res.json(postOutcomeSmall)
	
	  })

})

var globalCount = 0;
//Simple Pagination
simpleRouter.get("/simple/pagination/:current_page", (req, res) => {
  const currentPage = req.params.current_page;
  
  var words = ['sam', 'bilbo', 'merry','sam', 'bilbo'];

  var posts = [];

  for (let i = 0; i < words.length; i++) {
    console.log(globalCount)
    var word = words[Math.floor(Math.random() * words.length)];
    var post = {
      postID: globalCount, 
      postCaption: word
  
    }
    
    posts.push(post)
    globalCount = globalCount + 1;
  } 



  res.json(posts)
})


//FILES
//Simple Get Photo 
simpleRouter.get("/simple/image/learning", (req, res) => {
  //'/Users/dvas22/Desktop/David/www/api/application/routes/public/images/background_2.png'

  const imagePath = path.join(__dirname, '../../public/images/background_2.png');

  res.sendFile(imagePath);

}) 

module.exports = simpleRouter;


/*
app.get('/image', (req, res) => {
  const imagePath = path.join(__dirname, 'public/images/sample.jpg');
  res.sendFile(imagePath);
});


//let fileURLTemp = "http://localhost:3003/images/background_2.png"
//Simple Upload Photo


//USERS
//Get Friends for a user
simpleRouter.get("/simple/users/:current_name", (req, res) => {
  let currentUser = req.params.current_name
  console.log(currentUser)
  var user = {
    userID: 1, 
    userName: "david",
    biography: "hiya!"
  }

  var user2 = {
    userID: 2, 
    userName: "frodo",
    biography: "hiya!"
  }

  var user3 = {
    userID: 3, 
    userName: "sam",
    biography: "hiya!"
  }

  res.json([user, user2, user3])
}) 
//user/:user_name",
  simpleRouter.get("/simple/users", (req, res) => {
    var user = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    var user2 = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    var user3 = {
      userID: 1, 
      userName: "david",
      biography: "hiya!"
    }
  
    res.json([user, user2, user3])
  }) 


simpleRouter.get("/simple/hero", (req, res) => {
  var user = {
    localized_name: "wizard",
    primary_attr: "magic",
    attack_type: "magic and weapons",
    img: "wizard.png",
    legs: 2,
  }
    var user2 = {
    localized_name: "dwarf",
    primary_attr: "ax",
    attack_type: "ax and warrrior type",
    img: "dwarf.png",
    legs: 2,
  }
    var user3 = {
    localized_name: "elf",
    primary_attr: "bow",
    attack_type: "bow and shooting",
    img: "elf.png",
    legs: 4,
  }
    res.json([user, user2, user3])
})

  
module.exports = simpleRouter;


  

/*
//GROUP ROUTES
//Route A1: 
simpleRouter.post('/simple/', middlewares.verifyUser, (req, res) => { 
    res.json({hi: "hi"})
})

//Route A2: Get All Groups User is In 
simpleRouter.get("/simple/:user_name", middlewares.verifyUser, (req, res) => {
    res.json({hi: "hi"})
})
*/