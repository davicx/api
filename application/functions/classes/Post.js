const db = require('./../conn');
const timeFunctions = require('../timeFunctions');
const postFunctions = require('../postFunctions');
const dayjs = require('dayjs')
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
dayjs().format()

class Post {
    constructor(postID) {
        this.postID = postID;
        this.postFrom = "";
        this.postTo = "";
        this.postCaption = "";
    }
    
    //METHODS A: CREATE POST RELATED
    //Method A1: Make a Text Post
    static async createPostText(req)  {
        const connection = db.getConnection(); 
        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const groupID = Number(req.body.groupID)
        const listID = Number(req.body.listID)
        const postCaption = req.body.postCaption 
        const fileName = "no_file.jpg";
        const fileNameServer = "no_file.jpg";
        const fileURL = "no_file.jpg";
        const cloudKey = "no_cloud_key"

		if(req.body.fileNameServer != undefined) {
			fileNameServer = req.body.fileNameServer;
		} 

		if(req.body.fileName != undefined) {
			fileName = req.body.fileName;
		} 

		if(req.body.fileUrl != undefined) {
			fileUrl = req.body.fileUrl;
		} 

        console.log("CLASS Post: Step 1A: Create a new post from Post Class");  
     
        var createdPost = {
            postID: 0,
            postType: postType,
            groupID: Number(groupID),
            listID: Number(listID),
            postFrom: postFrom,
            postTo: postTo,
            postCaption: postCaption,
            fileName: fileName,
            fileNameServer: fileNameServer,
            fileURL: fileURL,
            cloudKey: "no_cloud_key",
            videoURL: "no_video_url",
            videoCode: "no_video_code",
			postDate: timeFunctions.getCurrentTime().postDate,
			postTime: timeFunctions.getCurrentTime().postTime,
			timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: "",
            commentsArray: [],
            postLikesArray: [],
            simpleLikesArray: []
        }    

        var postOutcome = {
            newPost: createdPost,
            outcome: 0,
            postID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption, file_name, cloud_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    
                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption, fileName, cloudKey], (err, results, fields) => {
                    if (!err) {
                        console.log("Step 1B: You created a new Post with ID " + results.insertId);    
                        postOutcome.outcome = 200;       
                        postOutcome.postID = results.insertId;   
                        postOutcome.newPost.postID = results.insertId;    
                    } else {    
                        postOutcome.outcome = "no worky"
                        postOutcome.errors.push(err);
                    } 
                    resolve(postOutcome);
                }) 
                
            } catch(err) {
                postOutcome.outcome = "rejected";
                console.log("Post Class: error in promise " + err);
                reject(postOutcome);
            } 
        });
    }

    //Method A2: Make a Photo Post
    static async createPostPhoto(req, uploadFile)  {
        const connection = db.getConnection(); 
        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const groupID = req.body.groupID 
        const listID = req.body.listID 
        const postCaption = req.body.postCaption 

        //This will come from the newFile object we need
        const fileName = uploadFile.originalname;
        const fileNameServer = uploadFile.fileNameServer;
        const fileURL = uploadFile.fileURL;
        const cloudKey = uploadFile.cloudKey;
        const fileStorageType = uploadFile.storageType; //local | aws | other
        const bucket = uploadFile.bucket;
 
        let tempTIME = timeFunctions.getCurrentTime().postTime 
        console.log(tempTIME)

        var createdPost = {
            postID: 0,
            postType: postType,
            groupID: Number(groupID),
            listID: Number(listID),
            postFrom: postFrom,
            postTo: postTo,
            postCaption: postCaption,
            fileName: fileName,
            fileNameServer: fileNameServer,
            fileURL: fileURL,
            cloudKey: cloudKey,
            videoURL: "empty",
            videoCode: "empty",
            postDate: timeFunctions.getCurrentTime().postDate,
			postTime: timeFunctions.getCurrentTime().postTime,
			timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: "",
            commentsArray: [],
            postLikesArray: [],
            simpleLikesArray: []
        }  

        console.log("Created Post")
        console.log(createdPost)

        var postOutcome = {
            newPost: createdPost,
            outcome: 0,
            postID: 0,
            errors: []
        }

        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption, file_name, file_name_server, file_url, cloud_key, cloud_bucket, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    
                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption, fileName, fileNameServer, fileURL, cloudKey, bucket, fileStorageType], (err, results, fields) => {
                    if (!err) {
                        console.log("DATABASE: You created a new Post with ID " + results.insertId);    
                        postOutcome.postID = results.insertId; 
                        postOutcome.outcome = 200; 
                        postOutcome.newPost.postID = results.insertId;
                    } else {    
                        postOutcome.outcome = "DATABASE: no worky"
                        postOutcome.errors.push(err);
                    } 
                    resolve(postOutcome);
                }) 
                
            } catch(err) {
                postOutcome.outcome = "rejected";
                console.log("REJECTED " + err);
                reject(postOutcome);
            } 
        });
    }

    //Method A3: Make a Video Post
    static async createPostVideo(req)  {
        const connection = db.getConnection(); 
        const masterSite = req.body.masterSite 
        const postType = req.body.postType 
        const postFrom = req.body.postFrom 
        const postTo = req.body.postTo 
        const groupID = req.body.groupID 
        const listID = req.body.listID 
        const postCaption = req.body.postCaption 
        const videoURL = req.body.videoURL 
        const videoCode = req.body.videoCode 

        var createdPost = {
            postID: 0,
            postType: postType,
            groupID: groupID,
            listID: listID,
            postFrom: postFrom,
            postTo: postTo,
            postCaption: postCaption,
            fileName: "fileName",
            fileNameServer: "fileNameServer",
            fileURL: "fileURL",
            videoURL: videoURL,
            videoCode: videoCode,
			postDate: timeFunctions.getCurrentTime().postDate,
			postTime: timeFunctions.getCurrentTime().postTime,
			timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: "",
            commentsArray: [],
            postLikesArray: [],
            simpleLikesArray: []
        }    

        var postOutcome = {
            newPost: createdPost,
            outcome: 0,
            postID: 0,
            errors: []
        }
        
        //INSERT POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption, video_url, video_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    
                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption, videoURL, videoCode], (err, results, fields) => {
                    if (!err) {
                        console.log("Post.js: You created a new Post with ID " + results.insertId);    
                        //console.log(results)
                        postOutcome.outcome = 200;       
                        postOutcome.postID = results.insertId;   
                        postOutcome.newPost.postID = results.insertId;       
                    } else {    
                        postOutcome.outcome = "no worky"
                        postOutcome.errors.push(err);
                    } 
                    resolve(postOutcome);
                }) 
                
            } catch(err) {
                postOutcome.outcome = "rejected";
                console.log("REJECTED " + err);
                reject(postOutcome);
            } 
        });
        
    }

    //METHODS B: Getting Posts
    //Method B1: Get Group Posts with pagination
    static async getGroupPosts(groupID, currentPage, totalGroupPosts) { 
        const connection = db.getConnection(); 
        const limit = 2;
        const currentOffset = limit * (currentPage - 1);

        const queryString = "SELECT * FROM posts WHERE group_id = ? AND post_status = 1 ORDER BY post_id DESC LIMIT ? OFFSET ?";
        
        var postsOutcome = {
            success: false,
            totalGroupPosts: totalGroupPosts,
            posts: []
        }
    
        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [groupID, limit, currentOffset], (err, rows) => {
                    if (!err) {
                        const posts = rows.map((row) => {
                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileURL: row.file_url,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                created: row.created
                            }
                        });
                        postsOutcome.posts = posts;
    
                        resolve(postsOutcome)
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(postsOutcome);
                    }
               })
                
            } catch(err) { 
                reject(postsOutcome);
            } 
        })
        
    }
    
    //Method B2: Get All Group Posts 
    static async getGroupPostsAll(groupID)  {
        const connection = db.getConnection(); 

        const queryString = "SELECT * FROM posts WHERE group_id = ? AND post_status = 1 ORDER BY post_id DESC";
        var postsOutcome = {
            success: false,
            posts: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [groupID], (err, rows) => {
                    if (!err) {
                        const posts = rows.map((row) => {
                            
                            //TIME 
                            //Step 1: Create a Post Time Holder 
                            let postTimeData = {}
                            let date = dayjs(row.created).format('MM/DD/YYYY')      
                            let minutes = dayjs(row.created).minute()
                            let hour = dayjs(row.created).hour()
                        
                            //Step 2: Get the time in hours and minutes
                            if(hour > 12) {
                                hour = hour - 12
                            }

                            let time = hour + ":0" + minutes + " pm";

                            //Step 3: Get the Message 
                            let timeMessage = dayjs(row.created).fromNow()
                        
                            postTimeData.date = date
                            postTimeData.time = time
                            postTimeData.timeMessage = timeMessage

                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileURL: row.file_url,
                                cloudKey: row.cloud_key,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                postDate: postTimeData.date,
                                postTime: postTimeData.time,
                                timeMessage: postTimeData.timeMessage,
                                created: row.created
                            }
                        });
                        postsOutcome.posts = posts;

                        resolve(postsOutcome)
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(postsOutcome);
                    }
            })
                
            } catch(err) { 
                reject(postsOutcome);
            } 
        })
    }
        
    //Method B3: Get Single Group Post
    static async getSingleGroupPost(postID)  {
        const connection = db.getConnection(); 

        const queryString = "SELECT * FROM posts WHERE post_id = ? AND post_status = 1 ORDER BY post_id DESC";
        var postsOutcome = {
            success: false,
            posts: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [postID], (err, rows) => {
                    if (!err) {
                        const posts = rows.map((row) => {
                            
                            //TIME 
                            //Step 1: Create a Post Time Holder 
                            let postTimeData = {}
                            let date = dayjs(row.created).format('MM/DD/YYYY')      
                            let minutes = dayjs(row.created).minute()
                            let hour = dayjs(row.created).hour()
                        
                            //Step 2: Get the time in hours and minutes
                            if(hour > 12) {
                                hour = hour - 12
                            }

                            let time = hour + ":0" + minutes + " pm";

                            //Step 3: Get the Message 
                            let timeMessage = dayjs(row.created).fromNow()
                        
                            postTimeData.date = date
                            postTimeData.time = time
                            postTimeData.timeMessage = timeMessage

                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileUrl: row.file_url,
                                cloudKey: row.cloud_key,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                postDate: postTimeData.date,
                                postTime: postTimeData.time,
                                timeMessage: postTimeData.timeMessage,
                                created: row.created
                            }
                        });
                        postsOutcome.posts = posts;

                        resolve(postsOutcome)
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(postsOutcome);
                    }
            })
                
            } catch(err) { 
                reject(postsOutcome);
            } 
        })
    }
    
    static async getUserPostsAll(postID)  {
        const connection = db.getConnection(); 

        const queryString = "SELECT * FROM posts WHERE post_id = ? AND post_status = 1 ORDER BY post_id DESC";
        var postsOutcome = {
            success: false,
            posts: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [postID], (err, rows) => {
                    if (!err) {
                        const posts = rows.map((row) => {
                            
                            //TIME 
                            //Step 1: Create a Post Time Holder 
                            let postTimeData = {}
                            let date = dayjs(row.created).format('MM/DD/YYYY')      
                            let minutes = dayjs(row.created).minute()
                            let hour = dayjs(row.created).hour()
                        
                            //Step 2: Get the time in hours and minutes
                            if(hour > 12) {
                                hour = hour - 12
                            }

                            let time = hour + ":0" + minutes + " pm";

                            //Step 3: Get the Message 
                            let timeMessage = dayjs(row.created).fromNow()
                        
                            postTimeData.date = date
                            postTimeData.time = time
                            postTimeData.timeMessage = timeMessage

                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileUrl: row.file_url,
                                cloudKey: row.cloud_key,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                postDate: postTimeData.date,
                                postTime: postTimeData.time,
                                timeMessage: postTimeData.timeMessage,
                                created: row.created
                            }
                        });
                        postsOutcome.posts = posts;

                        resolve(postsOutcome)
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(postsOutcome);
                    }
            })
                
            } catch(err) { 
                reject(postsOutcome);
            } 
        })
    }
     
    
    //METHODS C: UPDATING POST
    static async updatePostCaption(postID, newPostCaption, currentUser)  {
        const connection = db.getConnection(); 

        var updatePostOutcome = {
            postID: postID,
            success: false,
            message: "", 
            errors: []
        }

        //UPDATE POST
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "UPDATE posts SET post_caption = ? WHERE post_id = ? AND post_from = ?"

                connection.query(queryString, [newPostCaption, postID, currentUser], (err, rows) => {
                    if (!err) {  
                        console.log("ROWS " + rows.affectedRows)
                        if(rows.affectedRows > 0) {
                            updatePostOutcome.success = true     
                            updatePostOutcome.message = "You updated the post!"   
                        }
                    } else {    
                        updatePostOutcome.message = "no worky"
                        updatePostOutcome.errors.push(err);
                    } 
                    resolve(updatePostOutcome);
                }) 
                
            } catch(err) {
                updatePostOutcome.message = "rejected";
                updatePostOutcome.errors.push(err);
                console.log("REJECTED " + err);
                reject(updatePostOutcome);
            } 
        });
    }


  

}


module.exports = Post;

