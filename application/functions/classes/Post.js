const db = require('./../conn');
const timeFunctions = require('../timeFunctions');
const validationFunctions = require('../validationFunctions');
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
        const postFromImage = "Need postFromImage"
        const postTo = req.body.postTo 
        const groupID = Number(req.body.groupID)
        const listID = Number(req.body.listID)
        const postCaption = req.body.postCaption 
        const fileName = "no_file.jpg";
        const fileNameServer = "no_file.jpg";
        const fileURL = "no_file.jpg";
        const cloudKey = "no_cloud_key"
        const cloudBucket = "no_cloud_bucket"

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
            postFromImage: postFromImage,
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
    static async createPostPhoto(req, uploadFile, userImage, groupInfo)  {
        console.log("POST: createPostPhoto")
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

        console.log("cloudKey")
        console.log("cloudKey")
        console.log(cloudKey)
        console.log("cloudKey")
        console.log("cloudKey")

        // Default values if not provided
        const groupName = groupInfo?.groupName || "needGroupName";
        const groupImage = groupInfo?.groupImage || "needGroupImage";

        var createdPost = {
            postID: 0,
            postType: postType,
            groupID: Number(groupID),
            groupName: groupName,
            groupImage: groupImage,
            listID: Number(listID),
            postFrom: postFrom,
            postFromImage: userImage,
            postTo: postTo,
            postCaption: postCaption,
            fileName: fileName,
            fileNameServer: fileNameServer,
            fileURL: fileURL,
            cloudBucket: bucket,
            cloudKey: cloudKey,
            storageType: fileStorageType,
            videoURL: "empty",
            videoCode: "empty",
            isLikedByCurrentUser: false,
            postDate: timeFunctions.getCurrentTime().postDate,
			postTime: timeFunctions.getCurrentTime().postTime,
			timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: "",
            commentsArray: [],
            postLikesArray: [],
            simpleLikesArray: []
        }

        //console.log("Created Post")
        //console.log(createdPost)

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
        const postFromImage = "Need postFromImage"
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
            postFromImage: postFromImage,
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


    // Method A4: Make a Post With Item
    static async createPostItem(req, uploadFile, userImage, groupInfo)  {
        console.log("POST: createPostItem")
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

        //These come from the postman request
        const itemName = req.body.itemName;
        const itemPriceRaw = req.body.itemPrice;
        const itemPrice = validationFunctions.convertAndValidateDecimal(itemPriceRaw);
        const itemDescription = req.body.itemDescription;
        const itemCategory = req.body.itemCategory;
        const itemLink = req.body.itemLink;

        console.log("POST " + bucket)

        // Default values if not provided
        const groupName = groupInfo?.groupName || "needGroupName";
        const groupImage = groupInfo?.groupImage || "needGroupImage";

        var createdPost = {
            postID: 0,
            postType: postType,
            groupID: Number(groupID),
            groupName: groupName,
            groupImage: groupImage,
            listID: Number(listID),
            postFrom: postFrom,
            postFromImage: userImage,
            postTo: postTo,
            postCaption: postCaption,
            fileName: fileName,
            fileNameServer: fileNameServer,
            fileURL: fileURL,
            cloudBucket: bucket,
            cloudKey: cloudKey,
            storageType: fileStorageType,
            videoURL: "empty",
            videoCode: "empty",
            postDate: timeFunctions.getCurrentTime().postDate,
            postTime: timeFunctions.getCurrentTime().postTime,
            timeMessage: timeFunctions.getCurrentTime().timeMessage,
            created: "",
            isLikedByCurrentUser: false,
            commentsArray: [],
            postLikesArray: [],
            simpleLikesArray: [],
            item: {
                item_id: 0,
                item_name: itemName,
                item_price: itemPrice,
                item_description: itemDescription,
                item_category: itemCategory,
                item_link: itemLink,
                purchased: 0,
                purchased_by: "",
                store: "",
                multiple_stores: 0
            }
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
                const queryString = "INSERT INTO posts (master_site, post_type, group_id, post_from, post_to, post_caption, file_name, file_name_server, file_url, cloud_key, cloud_bucket, storage_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"

                connection.query(queryString, [masterSite, postType, groupID, postFrom, postTo, postCaption, fileName, fileNameServer, fileURL, cloudKey, bucket, fileStorageType], (err, results, fields) => {
                    if (!err) {
                        console.log("DATABASE: You created a new Post with ID " + results.insertId);    
                        postOutcome.postID = results.insertId; 
                        postOutcome.outcome = 200; 
                        postOutcome.newPost.postID = results.insertId;

                        //INSERT ITEM
                        const itemQuery = "INSERT INTO items (post_id, item_name, item_price, item_description, item_category, item_link) VALUES (?, ?, ?, ?, ?, ?)"
                        console.log("createPostItem: Inserting item with post_id:", results.insertId, "item_name:", itemName);
                        connection.query(itemQuery, [results.insertId, itemName, itemPrice, itemDescription, itemCategory, itemLink], (itemErr, itemResults, itemFields) => {
                            if (itemErr) {
                                console.log("createPostItem: Item insert failed:", itemErr);
                                postOutcome.outcome = "DATABASE: item insert failed"
                                postOutcome.errors.push(itemErr);
                            } else {
                                console.log("createPostItem: Item inserted successfully with ID:", itemResults.insertId);
                                // Update the item_id in the createdPost object
                                postOutcome.newPost.item.item_id = itemResults.insertId;
                            }
                            resolve(postOutcome);
                        })

                    } else {    
                        postOutcome.outcome = "DATABASE: post insert failed"
                        postOutcome.errors.push(err);
                        resolve(postOutcome);
                    } 
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
                        console.log("posts")
                        console.log(postsOutcome)
                        console.log(posts)
                        console.log("posts")

    
                        resolve(postsOutcome)
            
                    } else {
                        console.log("Failed to Select Posts" + err)
                        reject(postsOutcome);
                    }
               })
                
            } catch(err) { 
                console.log(err)
                reject(postsOutcome);
            } 
        })
        
    }
    
    //Method B2: Get All Group Posts 
    static async getGroupPostsAll(groupID)  {
        const connection = db.getConnection(); 
        const fileFunctions = require('../fileFunctions');

        //const queryString = "SELECT * FROM posts WHERE group_id = ? AND post_status = 1 ORDER BY post_id DESC";

        const queryString = `SELECT 
                                posts.*, 
                                shareshare.groups.group_name,  
                                shareshare.groups.group_image,
                                user_profile.storage_location,
                                user_profile.image_url,
                                user_profile.cloud_key as user_cloud_key
                            FROM posts
                            JOIN shareshare.groups ON posts.group_id = shareshare.groups.group_id
                            LEFT JOIN user_profile ON posts.post_from = user_profile.user_name
                            WHERE posts.group_id = ? AND posts.post_status = 1
                            ORDER BY posts.post_id DESC`

        var postsOutcome = {
            success: false,
            posts: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [groupID], (err, rows) => {
                    if (!err) {
                        // Use Promise.all to handle async operations for each post
                        Promise.all(rows.map(async (row) => {
                            
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

                        // Get user image URL using fileFunctions.getImageURL
                        let userImage = null;
                        if (row.storage_location && row.image_url) {
                            try {
                                userImage = await fileFunctions.getImageURL(row.storage_location, row.image_url, row.user_cloud_key);
                            } catch (error) {
                                console.log("Error getting user image for " + row.post_from + ": " + error);
                                userImage = null;
                            }
                        }

                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                groupName: row.group_name,
                                groupImage: row.group_image,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postFromImage: userImage, // Add user image for post creator
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileURL: row.file_url,
                                cloudBucket: row.cloud_bucket,
                                cloudKey: row.cloud_key,
                                storageType: row.storage_type,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                postDate: postTimeData.date,
                                postTime: postTimeData.time,
                                timeMessage: postTimeData.timeMessage,
                                created: row.created
                            }
                        })).then(posts => {
                            postsOutcome.posts = posts;
                            postsOutcome.success = true;
                            resolve(postsOutcome)
                        }).catch(error => {
                            console.log("Error processing posts: " + error);
                            reject(postsOutcome);
                        });
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
    
    //Method B4: Get All Group Posts 
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
     
    //Method B6: Get All Group Items 
    static async getGroupItemsAll(groupID)  {
        const connection = db.getConnection(); 
        const fileFunctions = require('../fileFunctions');

        const queryString = `
            SELECT p.*, 
                   i.item_id, i.item_name, i.item_price, i.item_description, 
                   i.item_category, i.item_link, i.purchased, i.purchased_by, 
                   i.store, i.multiple_stores,
                   shareshare.groups.group_name,
                   shareshare.groups.group_image,
                   user_profile.storage_location,
                   user_profile.image_url,
                   user_profile.cloud_key as user_cloud_key
            FROM posts p
            LEFT JOIN items i ON p.post_id = i.post_id
            JOIN shareshare.groups ON p.group_id = shareshare.groups.group_id
            LEFT JOIN user_profile ON p.post_from = user_profile.user_name
            WHERE p.group_id = ? AND p.post_status = 1 
            ORDER BY p.post_id DESC
        `;
        var postsOutcome = {
            success: false,
            posts: []
        }

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [groupID], (err, rows) => {
                    if (!err) {
                        console.log("getGroupItemsAll: Found " + rows.length + " posts");
                        console.log("getGroupItemsAll: Sample row data:", rows.length > 0 ? {
                            post_id: rows[0].post_id,
                            item_id: rows[0].item_id,
                            item_name: rows[0].item_name
                        } : "No rows found");
                        
                        // Use Promise.all to handle async operations for each post
                        Promise.all(rows.map(async (row) => {
                            
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

                            // Get user image URL using fileFunctions.getImageURL
                            let userImage = null;
                            if (row.storage_location && row.image_url) {
                                try {
                                    userImage = await fileFunctions.getImageURL(row.storage_location, row.image_url, row.user_cloud_key);
                                } catch (error) {
                                    console.log("Error getting user image for " + row.post_from + ": " + error);
                                    userImage = null;
                                }
                            }

                            // Create item object if item data exists
                            let itemData = null;
                            if (row.item_id) {
                                itemData = {
                                    item_id: row.item_id,
                                    item_name: row.item_name,
                                    item_price: row.item_price,
                                    item_description: row.item_description,
                                    item_category: row.item_category,
                                    item_link: row.item_link,
                                    purchased: row.purchased,
                                    purchased_by: row.purchased_by,
                                    store: row.store,
                                    multiple_stores: row.multiple_stores
                                };
                            }

                            return {
                                postID: row.post_id,
                                postType: row.post_type,
                                groupID: row.group_id,
                                groupName: row.group_name,
                                groupImage: row.group_image,
                                listID: row.list_id,
                                postFrom: row.post_from,
                                postFromImage: userImage,
                                postTo: row.post_to,
                                postCaption: row.post_caption,
                                fileName: row.file_name,
                                fileNameServer: row.file_name_server,
                                fileURL: row.file_url,
                                cloudBucket: row.cloud_bucket,
                                cloudKey: row.cloud_key,
                                storageType: row.storage_type,
                                videoURL: row.video_url,
                                videoCode: row.video_code,
                                postDate: postTimeData.date,
                                postTime: postTimeData.time,
                                timeMessage: postTimeData.timeMessage,
                                created: row.created,
                                item: itemData
                            }
                        })).then(posts => {
                            postsOutcome.posts = posts;
                            postsOutcome.success = true;
                            resolve(postsOutcome)
                        }).catch(error => {
                            console.log("Error processing posts: " + error);
                            reject(postsOutcome);
                        });
            
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

