const db = require('../functions/conn');
const Group = require('../functions/classes/Group');
const Post = require('../functions/classes/Post');
const Item = require('../functions/classes/Item');
const Notification = require('../functions/classes/Notification')
const Comment = require('../functions/classes/Comment')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const friendFunctions = require('../functions/friendFunctions');
const profileFunctions = require('../functions/profileFunctions');
const PostFunctions = require('../functions/postFunctions');
const userFunctions = require('../functions/userFunctions');
const groupFunctions = require('../functions/groupFunctions');
const itemFunctions = require('../functions/itemFunctions');
const timeFunctions = require('../functions/timeFunctions');
const fileFunctions = require('../functions/fileFunctions');
const likeFunctions = require('../functions/likeFunctions');
const cloudFunctions = require('../functions/cloudFunctions');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
const bucketName = process.env.AWS_BUCKET_NAME

const postsFolder = process.env.POSTS

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')

/*
FUNCTIONS A: All Functions Related to New Item
	1) Function A1: Post Item
	2) Function A2: Purchase Item
 
FUNCTIONS B: All Functions Related to getting Items
	1) Function B1: Get all Group Items
	2) Function B2: Get all Group Items (Pagination)


*/
//In items.js postItemLocal

//FUNCTIONS A: All Functions Related to Posts
//Function A1: Post Item
async function postItemLocal(req, res) {
	uploadFunctions.uploadPostPhotoLocal(req, res, async function (err) {
		var groupID = req.body.groupID;
		var currentUser = req.body.postFrom

		var headerMessage = "New Post Photo created by " + currentUser + " Local to Local"
		Functions.addHeader(headerMessage)

		var postOutcome = {
			data: {},
			message: "hi", 
			success: false,
			statusCode: 400,
			errors: [], 
			currentUser: currentUser
		}

		var uploadFile = {}

		//STEP 1: Check for Valid File
		const uploadResult = fileFunctions.handleOptionalFileUploadResult(req, err);
		console.log("STEP 1: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadResult.uploadSuccess)

		uploadSuccess = uploadResult.uploadSuccess;
		postOutcome.message = uploadResult.message;
		
		//Step 1A: Handle if there is a file but it has an issue uploading
		if (!uploadResult.uploadSuccess) {
			console.log("STEP 1 (ERROR): Invalid or missing file.");
			Functions.addFooter();
			return res.status(postOutcome.statusCode).json(postOutcome);
		}

		//STEP 2: Upload File to storage (Local) and get file information
		//Step 2A: Update with a image 
		if(uploadResult.containsFile == true) {
			console.log("FILE!!")

			let file = req.file
			console.log("STEP 2: Upload File to storage (Local) and get file information")

			//STEP 3: Create the Upload File with its information
			uploadFile.fileMimetype = file.mimetype; 
			uploadFile.originalname = file.originalname; //file_name
			uploadFile.fileNameServer = file.filename; //file_name_server
			
			//Settings: Local 
			uploadFile.fileURL = "http://localhost:3003/" + bucketName + "/" + postsFolder + "/" + file.filename; //file_url (image_url)	
		  //uploadFile.fileURL = "http://localhost:3003/" + bucketName + "/" + postsFolder + "/" + file.filename; 
		
			uploadFile.cloudKey = postsFolder + "/" + file.filename;  //cloud_key
			uploadFile.bucket = bucketName; //cloud_bucket	
			uploadFile.storageType = "local"; //storage_type

			//Settings: Cloud
			//uploadFile.fileURL = result.Location; // file_url
			//uploadFile.cloudKey = result.Key; //cloud_key 
			//uploadFile.bucket = result.Bucket; // cloud_bucket 	
			//uploadFile.storageType = "aws"; //storage_type		
		

		//Step 2A: Update without an image 
		} else {
			//Need a better upload default file 
			console.log("NO FILE!! We will use a default ")
			uploadFile = {
				fileMimetype: 'image/jpeg',
				originalname: 'background.jpg',
				fileNameServer: 'postImage-1759360291801-540655558-background.jpg',
				fileURL: 'http://localhost:3003/kite-us-west-two/postImage-1759360291801-540655558-background.jpg',
				cloudKey: 'posts/postImage-1759360291801-540655558-background.jpg',
				bucket: 'kite-us-west-two',
				storageType: 'local'
			  }; 

			  //console.log(uploadFile)
		}

		//STEP 4: Get Group Post Information
		console.log("STEP 4: Get Group Post Information")
		
		// Get user image
		let userImage = null;
		try {
			const userImageResult = await profileFunctions.getUserImage(currentUser);
			if (userImageResult.success) {
				userImage = userImageResult.userProfileImage;
			}
		} catch (error) {
			console.log("Error getting user image for " + currentUser + ": " + error);
		}

		// Get group information
		let groupInfo = {
			groupName: "needGroupName",
			groupImage: "needGroupImage"
		};
		if (groupID) {
			try {
				const groupInfoResult = await Group.getGroupInformation(groupID);
				if (groupInfoResult.status === 200) {
					groupInfo.groupName = groupInfoResult.groupName;
					groupInfo.groupImage = groupInfoResult.groupImage;
				}
			} catch (error) {
				console.log("Error getting group information for " + groupID + ": " + error);
			}
		}

		//STEP 5: Create Post with all information
		console.log("STEP 5: Create Post with all information")
		let newPostOutcome = await Post.createPostItem(req, uploadFile, userImage, groupInfo);

        console.log("newPostOutcome")
        console.log(newPostOutcome)
        console.log("newPostOutcome")

		postOutcome.data = newPostOutcome.newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true

		//STEP 3: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 4: Add notifications")

			var postID = 0
			if (newPostOutcome.newPost.postID) {
				postID = newPostOutcome.newPost.postID
			}

			if(newPostOutcome.outcome == 200) {
				notification = {
					masterSite: "kite",
					notificationFrom: req.body.postFrom,
					notificationMessage: req.body.notificationMessage,
					notificationTo: "",
					notificationLink: req.body.notificationLink,
					notificationType: req.body.notificationType,
					groupID: groupID,
					postID: postID
				}

				console.log(groupUsers)
				for (let i = 0; i < groupUsers.length; i++) {
					//let notificationTo = groupUsers[i];
					notification.notificationTo = groupUsers[i];
					console.log(groupUsers[i]);
					let notificationOutcome = await Notification.createSingleNotification(notification)
					console.log(notificationOutcome)
				} 
			}
		}

		Functions.addFooter()
		res.json(postOutcome)

    })
}

async function postItemLocalAWS(req, res) {
	var headerMessage = "HEADER: New AWS Photo Post "
	Functions.addHeader(headerMessage)
	uploadFunctions.uploadPostPhotoLocal(req, res, async function (err) {

		var uploadSuccess = false
		var groupID = req.body.groupID;
	
		var postOutcome = {
			data: {},
			message: "hi", 
			success: true,
			statusCode: 200,
			errors: [], 
			currentUser: req.body.postFrom
		}

		//STEP 1: Check for a valid file
		const uploadResult = fileFunctions.handleUploadResult(req, err);
		console.log("STEP 1: Get new File and Check it is valid (an image and not to big) Outcome: " + uploadOutcome.uploadSuccess)
	
		uploadSuccess = uploadResult.uploadSuccess;
		postOutcome.message = uploadResult.message;
		
		if (!uploadResult.uploadSuccess) {
			console.log("STEP 1 (ERROR): Invalid or missing file.");
			Functions.addFooter();
		}

		//STEP 2: Upload File to storage (AWS) and get file information
		var uploadFile = {}
		let file = req.file
		console.log("STEP 2: Upload File to storage (AWS) and get file information")
			
		//const fileExtension = mime.extension(file.mimetype) 
		const result = await awsStorage.uploadPost(file)


		//STEP 3: Create the Upload File with its information
		//File Information
		uploadFile.fileMimetype = file.mimetype; 
		uploadFile.originalname = file.originalname; //file_name
		uploadFile.fileNameServer = file.filename; //file_name_server

		//Settings: Local 
		//uploadFile.fileURL = file.path; //file_url
		//uploadFile.cloudKey = file.path; //cloud_key
		//uploadFile.bucket = file.destination; //cloud_bucket	
		//uploadFile.storageType = "aws"; //storage_type
		
		//Settings: Cloud
		uploadFile.fileURL = result.Location; // file_url
		uploadFile.cloudKey = result.Key; //cloud_key 
		uploadFile.bucket = result.Bucket; // cloud_bucket 	
		uploadFile.storageType = "aws"; //storage_type		

		//STEP 3: Add Post to Database
		let newPostOutcome = await Post.createPostPhoto(req, uploadFile);

		//STEP 4: Get a Signed URL so we can display this new post
		var newPost = await PostFunctions.getSignedURL(newPostOutcome.newPost);
		
		postOutcome.data = newPost;
		postOutcome.message = "Your photo was posted!"
		postOutcome.statusCode = 200
		postOutcome.success = true
		console.log("STEP 3: Post was added to the Database")

		//STEP 4: Add the Notifications
		if(newPostOutcome.outcome == 200) {
			var notification = {}
			const groupUsersOutcome = await Group.getGroupUsers(groupID);
			const groupUsers = groupUsersOutcome.groupUsers;
			console.log("STEP 4: Add notifications")

			//Set the Post ID for the new post in notifications
			var postID = 0
			if (newPostOutcome.newPost.postID) {
				postID = newPostOutcome.newPost.postID
			}

			if(newPostOutcome.outcome == 200) {
				notification = {
					masterSite: "kite",
					notificationFrom: req.body.postFrom,
					notificationMessage: req.body.notificationMessage,
					notificationTo: groupUsers,
					notificationLink: req.body.notificationLink,
					notificationType: req.body.notificationType,
					groupID: groupID,
					postID: postID
				}

				//console.log(notification)

				if(groupUsers.length > 0) {
					Notification.createGroupNotification(notification);
				}
			}
		}
			
		
		
		console.log(" ")
		console.log("________________________________")
	
		res.json(postOutcome)

	  Functions.addFooter()

  })
}




//FUNCTIONS B: All Functions Related to getting Items
//Function B1: Get all Group Items
//http://localhost:3003/items/group/70
async function getAllGroupItems(req, res) {
	const connection = db.getConnection(); 
    const groupID = req.params.group_id;
	const currentUser = req.currentUser
	
	var headerMessage = "HEADER: Get all Group Items for Group: " + groupID
	Functions.addHeader(headerMessage)
	

	//STEP 1: Get All Posts
	var postsOutcome = await Post.getGroupItemsAll(groupID)
	var postsRaw = postsOutcome.posts;

	//STEP 2: Get All Comments for these Posts 
	var postsComments = await PostFunctions.addPostComments(currentUser, postsRaw, groupID)

	//STEP 3: Get all Likes for these Posts
	var postsLikes = await PostFunctions.addPostLikes(currentUser, postsComments)
	
	//STEP 4: Get Image URL
	var posts = await PostFunctions.addSignedURLPostsArray(postsLikes);

	//STEP 5: Add purchased_viewers to each item (always include, empty array if none)
	posts = await itemFunctions.addPurchaseViewersToItems(posts);

	var postsResponse = {
		data: posts,
		message: "Need to add error and stuff in this always works!", 
		success: true,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	Functions.addFooter()
	res.json(postsResponse)

}


//FUNCTIONS C: All Functions Related to Item Actions
//Function C1: Purchase an Item
async function purchaseItem(req, res) {
	const connection = db.getConnection(); 
	var currentUser = req.body.currentUser
	var postID = req.body.postID
	var showPurchased = req.body.showPurchased || []

	var purchaseItemResponse = {
		data: {},
		message: "", 
		success: false,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	var purchasedItem = {}

	var headerMessage = "HEADER: Item Purchase: post " + postID + " by " + currentUser
	Functions.addHeader(headerMessage)

	//STEP 1: Look up item_id from post (post has one item)
	var itemsOutcome = await Item.getItemsByPostID(postID);
	if (!itemsOutcome.items || itemsOutcome.items.length === 0) {
		purchaseItemResponse.message = "No item found for this post";
		Functions.addFooter();
		return res.json(purchaseItemResponse);
	}
	var itemID = itemsOutcome.items[0].itemID;

	//STEP 2: Check User Exists
	var userExists = await profileFunctions.getSimpleUserProfile(currentUser);

	if(userExists.userFound == true) {

		//STEP 3: Check if Item is already purchased
		var itemPurchaseStatus = await Item.checkItemPurchaseStatus(itemID);

		//STEP 4: If item is not already purchased then purchase the Item
		if(itemPurchaseStatus.purchased == 0) {
			var purchaseItemOutcome = await Item.purchaseItem(itemID, currentUser, postID) 
			
			//STEP 4: Get updated Item Information 
			if(purchaseItemOutcome.success == true) {
				purchasedItem = {
					itemID: itemID,
					postID: postID,
					purchased: 1,
					purchasedBy: currentUser,
					message: "Item purchased successfully"
				}
				
				purchaseItemResponse.message = "You purchased this item!";
				purchaseItemResponse.success = true;
				purchaseItemResponse.data = purchasedItem;

				//STEP 5: Record purchase in group_purchases (who can see that this item was purchased)
				var groupPurchaseOutcome = await itemFunctions.insertGroupPurchase(postID, currentUser, itemID, showPurchased);
				if (!groupPurchaseOutcome.success) {
					console.log("insertGroupPurchase: " + groupPurchaseOutcome.message);
				}

			} else {
				purchaseItemResponse.message = "Failed to purchase item";
				purchaseItemResponse.success = false;
			}

		//Item is already purchased
		} else {
			purchasedItem = {
				itemID: itemID,
				postID: postID,
				purchased: 1,
				purchasedBy: itemPurchaseStatus.purchasedBy,
				message: "Item already purchased"
			}
			purchaseItemResponse.data = purchasedItem;
			purchaseItemResponse.message = "This item is already purchased by " + itemPurchaseStatus.purchasedBy;
		}

	} else {
		purchasedItem = {
			itemID: 0,
			postID: 0,
			purchased: 0,
			purchasedBy: "",
			message: "User not found"
		}
		purchaseItemResponse.data = purchasedItem;
		purchaseItemResponse.message = "USER NOT FOUND: " + currentUser
		console.log("USER NOT FOUND: " + currentUser)
	}

	console.log("Item purchase attempt at " + timeFunctions.getCurrentTime().postTime);
	console.log(purchaseItemResponse)
	Functions.addFooter()

	res.json(purchaseItemResponse)
}

//Function C2: Remove Purchase from an Item 
async function removePurchase(req, res) {
	var currentUser = req.body.currentUser || req.body.userName;
	var postID = req.body.postID;
	var itemID = req.body.itemID;

	var removePurchaseResponse = {
		data: {},
		message: "", 
		success: false,
		statusCode: 200,
		errors: [], 
		currentUser: currentUser
	}

	var unpurchasedItem = {
		itemID: itemID,
		postID: postID,
		purchased: 0,
		purchasedBy: "",
		message: "Purchase removed"
	}

	var headerMessage = "HEADER: Remove Item Purchase: item " + itemID + " by " + currentUser
	Functions.addHeader(headerMessage)

	//STEP 1: Validate request body (currentUser, postID, itemID)
	console.log("STEP 1: Validate request body Outcome: currentUser=" + currentUser + " postID=" + postID + " itemID=" + itemID);
	if (!currentUser || !postID || !itemID) {
		removePurchaseResponse.message = "Missing required fields: currentUser (or userName), postID, itemID";
		removePurchaseResponse.data = unpurchasedItem;
		console.log("STEP 1 (ERROR): Missing required fields");
		Functions.addFooter();
		return res.json(removePurchaseResponse);
	}

	//STEP 2: Check if Item is currently purchased
	var currentPurchaseStatus = await Item.checkItemPurchaseStatus(itemID);
	console.log("STEP 2: Check item purchase status Outcome: purchased=" + currentPurchaseStatus.purchased + " purchasedBy=" + currentPurchaseStatus.purchasedBy);

	//STEP 3: Remove Purchase if it is currently purchased
	if(currentPurchaseStatus.purchased == 1) {

		var removePurchaseOutcome = await Item.removePurchase(itemID, currentUser);
		console.log("STEP 3: Remove from items table Outcome: success=" + removePurchaseOutcome.success + " message=" + (removePurchaseOutcome.message || ""));
		
		if(removePurchaseOutcome.success == true) {
			//STEP 4: Clear item_purchases visibility rows for this item
			await itemFunctions.deleteGroupPurchaseVisibility(itemID, currentUser);
			console.log("STEP 4: Clear item_purchases visibility Outcome: complete");
			removePurchaseResponse.message = "The item purchase was removed";
			removePurchaseResponse.success = true;
			removePurchaseResponse.data = unpurchasedItem;
		} else {
			removePurchaseResponse.message = "Failed to remove item purchase - " + (removePurchaseOutcome.message || "purchased_by does not match current user");
			removePurchaseResponse.success = false;
			removePurchaseResponse.data = unpurchasedItem;
			console.log("STEP 3 (ERROR): Item.removePurchase failed - user may not be the purchaser (purchased_by must match exactly)");
		}

	} else {
		removePurchaseResponse.data = unpurchasedItem;
		removePurchaseResponse.message = "The item is not currently purchased";
		console.log("STEP 3: Item not purchased Outcome: skip remove");
	}
	
	console.log("Remove purchase outcome at " + timeFunctions.getCurrentTime().postTime);
	console.log(removePurchaseResponse);
	Functions.addFooter();

	res.json(removePurchaseResponse);
}

module.exports = { postItemLocal, postItemLocalAWS, getAllGroupItems, purchaseItem, removePurchase };

