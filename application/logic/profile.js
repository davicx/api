const db = require('../functions/conn');
const profileFunctions = require('../functions/profileFunctions');
const userFunctions = require('../functions/userFunctions');
const functions = require('../functions/functions');
const Profile = require('../functions/classes/Profile');
const uploadFunctions = require('../functions/uploadFunctions');
const awsStorage = require('../functions/aws/awsStorage');
//const bucketName = process.env.AWS_BUCKET_NAME
const bucketName = process.env.AWS_PROFILE_BUCKET_NAME
const appLocation = process.env.APP_LOCATION
const fileLocation = process.env.FILE_LOCATION

//Upload imports
const multerS3 = require('multer-s3');
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs') 
const multer = require('multer')
var mime = require('mime-types')

/*
FUNCTIONS A: All Functions Related to User Profile
	1) Function A1: Get User Profile
	2) Function A2: Get Simple User Profile
	3) Function A3: Update User Profile
*/

//Function A1: Get User Profile
async function getUserProfile(req, res) {
    const connection = db.getConnection(); 
    let currentUser = req.params.user_name;

    var userProfileOutcome = {
	    data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

    //STEP 1: Get User Profile Information
    let getUserProfileOutcome = await Profile.getUserProfile(currentUser);

    const userProfile = {
        userName: getUserProfileOutcome.userProfile.userName,
        userID: getUserProfileOutcome.userProfile.userID,
        userImage: getUserProfileOutcome.userProfile.userImage,
        biography: getUserProfileOutcome.userProfile.biography,
        firstName: getUserProfileOutcome.userProfile.firstName,
        lastName: getUserProfileOutcome.userProfile.lastName
    };

    console.log("getUserProfile")
    console.log(getUserProfileOutcome)
    console.log("getUserProfile")

    if(getUserProfileOutcome.success == true) {
        userProfileOutcome.message = "We got the user profile for " + currentUser;
        userProfileOutcome.success = true;
        userProfileOutcome.statusCode = 200;

        //Get Correct User Image local or aws
        if(functions.compareStrings(getUserProfileOutcome.storageLocation, "aws") == true) {
            console.log("Get AWS Photo")
        } else {
            console.log("Good to go!")     
        }

        userProfileOutcome.data = userProfile;
    }

    res.json(userProfileOutcome)

}

//Function A2: Get Simple User Profile
async function getSimpleUserProfile(req, res) {
    const connection = db.getConnection(); 
    let currentUser = req.params.user_name;

    var userProfileOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.params.user_name
	}

    //STEP 1: Get User Profile Information
    let getUserProfileOutcome = await Profile.getUserProfile(currentUser);
    console.log("STEP 1: Getting User Profile Information ")


    const userProfile = {
        userName: getUserProfileOutcome.user_name,
        userID: getUserProfileOutcome.user_id,
        userImage: getUserProfileOutcome.image_url,
        biography: getUserProfileOutcome.biography,
        firstName: getUserProfileOutcome.first_name,
        lastName: getUserProfileOutcome.last_name
    };

    console.log(getUserProfileOutcome)

    if(getUserProfileOutcome.success == true) {
        userProfileOutcome.data = userProfile;
        userProfileOutcome.message = "We got the user profile for " + currentUser;
        userProfileOutcome.success = true;
        userProfileOutcome.statusCode = 200;
        userProfileOutcome.data = getUserProfileOutcome.userProfile;
    }

    res.json(userProfileOutcome)

}

//Function A3: Update User Profile
async function updateUserProfile(req, res) {
    const connection = db.getConnection(); 
    //const currentUser = req.currentUser

    console.log(req.body)

    var updateUserProfileOutcome = {
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: req.body.currentUser
	}

    //STEP 1: Create updated user Information
    let currentUser = req.body.currentUser //Need from Token
    let imageName = req.body.imageName
    let firstName = req.body.firstName
    let lastName = req.body.lastName
    let biography = req.body.biography

    let updatedUser = {
        currentUser: currentUser,
        imageName: imageName,
        firstName: firstName,
        lastName: lastName,     
        biography: biography     
    }
    console.log("STEP 1: Created Updated User Profile Information ")
    console.log(updatedUser)

    //STEP 2: Update User Profile
    let updateUserProfile = await Profile.updateUserProfile(updatedUser);

    if(updateUserProfile.success == true) {
        console.log("STEP 2: Successfully Updated User Profile Information ")
        updateUserProfileOutcome.message = "We updated the user profile for " + currentUser;
        updateUserProfileOutcome.success = true;
        updateUserProfileOutcome.statusCode = 200;
        updateUserProfileOutcome.data = updatedUser;
    } else {
        console.log("STEP 2: There was an error Updating User Profile Information ")
    }
    
    res.json(updateUserProfileOutcome)

}

async function updateFullUserProfileLocal(req, res) {
    uploadFunctions.uploadProfilePhotoLocal(req, res, async function (err) {
		var uploadSuccess = false
        console.log("ENVIRONMENT: Local to Local")
	
        var updateUserProfileOutcome = {
            message: "", 
            success: false,
            statusCode: 500,
            errors: [], 
            currentUser: req.body.currentUser
        }

        var updatedUserResponse = {
            userName: "userName", 
            userID: 0,
            userImage: "userImage",
            biography: "biography",
            firstName: "firstName",
            lastName: "lastName"
            
        }
      
    let file = req.file
    console.log(file)

	//STEP 1: Check for Valid File
	console.log("STEP 1: Upload Post to API")

	//Error 1A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 1A: File too large")
		updateUserProfileOutcome.message = "Error 1A: File too large"
  
	//Error 1B: Not Valid Image File
	} else if (err) {
		console.log("Error 1B: Not Valid Image File")
		updateUserProfileOutcome.message = "Error 1B: Not Valid Image File"

	//Success 1A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 1A: No Multer Errors")

		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 1B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 1C: No File mah dude!")
		  updateUserProfileOutcome.message = "Error 1C: No File mah dude!"
 
		} 
	}

	//STEP 2: Update Profile 
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file
 
        let currentUser = req.body.currentUser
        let firstName = req.body.firstName
        let lastName = req.body.lastName
        let biography = req.body.biography
        let imageURL = "http://localhost:3003/" + bucketName + "/" + file.filename

        let updatedUser = {
            currentUser: currentUser,
            firstName: firstName,
            lastName: lastName,     
            biography: biography,
            storageLocation: "local",
            cloudBucket: bucketName,
            cloudKey: file.path,
            imageURL: imageURL,
            fileName: file.originalname,
            fileNameServer: file.filename
        }

        console.log("STEP 2: Created Updated User Profile Information ")
        console.log(" file.path " + file.path)
      
        //STEP 3: Update User Profile
        let updateUserProfile = await Profile.updateUserProfile(updatedUser);

        if(updateUserProfile.success == true) {
            console.log("STEP 2: Successfully Updated User Profile Information ")
            updateUserProfileOutcome.message = "We updated the user profile for " + currentUser;
            updateUserProfileOutcome.success = true;
            updateUserProfileOutcome.statusCode = 200;

            let userIDResponse = await userFunctions.getUserID(currentUser);
            
            updatedUserResponse.userName = currentUser;
            updatedUserResponse.userID = userIDResponse.userID;
            updatedUserResponse.userImage = imageURL;
            updatedUserResponse.biography = biography;
            updatedUserResponse.firstName = firstName;
            updatedUserResponse.lastName = lastName;

            updateUserProfileOutcome.data = updatedUserResponse;

        } else {
            updateUserProfileOutcome.errors = updateUserProfile.errors
            console.log("STEP 2: There was an error Updating User Profile Information ")
        }

	} else {
        //TO DO: Add updatedUser to this out come!!
        console.log("STEP 2: Update Profile did not work")
    }

    updateUserProfileOutcome.data = updatedUserResponse
    console.log(" ")
    console.log(" ______________________________________ ")
    console.log(" ")
    res.json(updateUserProfileOutcome)

  })


}

async function updateFullUserProfileLocalAWS(req, res) {
    uploadFunctions.uploadProfilePhotoLocal(req, res, async function (err) {
        var uploadSuccess = false
        console.log("ENVIRONMENT: Local to AWS updateFullUserProfileLocalAWS")
   
        var updateUserProfileOutcome = {
            message: "", 
            success: false,
            statusCode: 500,
            errors: [], 
            currentUser: req.body.currentUser
        }

        var updatedUserResponse = {
            userName: "userName", 
            userID: 0,
            userImage: "userImage",
            biography: "biography",
            firstName: "firstName",
            lastName: "lastName"
            
        }
      
    let file = req.file
    console.log(file)

	//STEP 1: Check for Valid File
	console.log("STEP 1: Upload Post to API")

	//Error 1A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 1A: File too large")
		updateUserProfileOutcome.message = "Error 1A: File too large"
  
	//Error 1B: Not Valid Image File
	} else if (err) {
		console.log("Error 1B: Not Valid Image File")
		updateUserProfileOutcome.message = "Error 1B: Not Valid Image File"

	//Success 1A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 1A: No Multer Errors")

		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 1B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 1C: No File mah dude!")
		  updateUserProfileOutcome.message = "Error 1C: No File mah dude!"
 
		} 
	}

    //STEP 2: Update Profile 
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file

        let currentUser = req.body.currentUser
        let firstName = req.body.firstName
        let lastName = req.body.lastName
        let biography = req.body.biography
        let imageURL = "aws_request"

        
        //STEP 3: Upload to AWS
        const fileExtension = mime.extension(file.mimetype) 
        const result = await awsStorage.uploadProfile(file)


        console.log("result")
        console.log(result)
        console.log("result")
    
    }

    res.json(updateUserProfileOutcome)


  
  })


}

async function updateFullUserProfileLocalAWSORIGINAL(req, res) {
    uploadFunctions.uploadProfilePhotoLocal(req, res, async function (err) {
		var uploadSuccess = false
        console.log("ENVIRONMENT: Local to AWS updateFullUserProfileLocalAWS")

	
        var updateUserProfileOutcome = {
            message: "", 
            success: false,
            statusCode: 500,
            errors: [], 
            currentUser: req.body.currentUser
        }

        var updatedUserResponse = {
            userName: "userName", 
            userID: 0,
            userImage: "userImage",
            biography: "biography",
            firstName: "firstName",
            lastName: "lastName"
            
        }
      
    let file = req.file
    console.log(file)

	//STEP 1: Check for Valid File
	console.log("STEP 1: Upload Post to API")

	//Error 1A: File too large
	if (err instanceof multer.MulterError) {
		console.log("Error 1A: File too large")
		updateUserProfileOutcome.message = "Error 1A: File too large"
  
	//Error 1B: Not Valid Image File
	} else if (err) {
		console.log("Error 1B: Not Valid Image File")
		updateUserProfileOutcome.message = "Error 1B: Not Valid Image File"

	//Success 1A: No Multer Errors
	} else {
		let file = req.file
		console.log("Success 1A: No Multer Errors")

		//Success 1B: Success Upload File
		if(file !== undefined) {
			console.log("Success 1B: Success Upload File")
			uploadSuccess = true   

		//Error 1C: No File 	
		} else {
		  console.log("Error 1C: No File mah dude!")
		  updateUserProfileOutcome.message = "Error 1C: No File mah dude!"
 
		} 
	}

	//STEP 2: Update Profile 
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file
        
        //STEP 3: Upload to AWS
        const fileExtension = mime.extension(file.mimetype) 
        const result = await awsStorage.uploadProfile(file)

        console.log(result)

        /*

        //File Information
        var uploadFile = {}
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
        

        */

        /*
        {
  ETag: '"de01b2f7428535f685bb56e4c0fad10b"',
  ServerSideEncryption: 'AES256',
  Location: 'https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/profile/profileImage-1737419292140-381400166-background_2.png',
  key: 'profile/profileImage-1737419292140-381400166-background_2.png',
  Key: 'profile/profileImage-1737419292140-381400166-background_2.png',
  Bucket: 'insta-app-bucket-tutorial'
}       
    cloudBucket
    cloudKey
    imageURL
        */
        let currentUser = req.body.currentUser
        let firstName = req.body.firstName
        let lastName = req.body.lastName
        let biography = req.body.biography
        let cloudBucket = "profile"
        let fileURL = "http://localhost:3003/" + cloudBucket + "/" + file.filename

        let updatedUser = {
            currentUser: currentUser,
            firstName: firstName,
            lastName: lastName,     
            biography: biography,
            storageLocation: "aws",
            cloudBucket: result.Bucket,
            cloudPath: file.path,
            fileURL: fileURL,
            fileName: file.originalname,
            fileNameServer: file.filename
        }

        console.log("STEP 2: Created Updated User Profile Information ")
      
        //STEP 3: Update User Profile
        let updateUserProfile = await Profile.updateUserProfile(updatedUser);

        if(updateUserProfile.success == true) {
            console.log("STEP 2: Successfully Updated User Profile Information ")
            updateUserProfileOutcome.message = "We updated the user profile for " + currentUser;
            updateUserProfileOutcome.success = true;
            updateUserProfileOutcome.statusCode = 200;

            let userIDResponse = await userFunctions.getUserID(currentUser);
            
            updatedUserResponse.userName = currentUser;
            updatedUserResponse.userID = userIDResponse.userID;
            updatedUserResponse.userImage = fileURL;
            updatedUserResponse.biography = biography;
            updatedUserResponse.firstName = firstName;
            updatedUserResponse.lastName = lastName;

            updateUserProfileOutcome.data = updatedUserResponse;

        } else {
            console.log("STEP 2: There was an error Updating User Profile Information ")
        }

	} else {
        //TO DO: Add updatedUser to this out come!!
        console.log("STEP 2: Update Profile did not work")
    }

    updateUserProfileOutcome.data = updatedUserResponse
    res.json(updateUserProfileOutcome)

  })


}

module.exports = { getUserProfile, getSimpleUserProfile, updateUserProfile, updateFullUserProfileLocal, updateFullUserProfileLocalAWS };


  /*
	//STEP 2: Update Profile 
	if(uploadSuccess == true) {
		console.log("STEP 2: Add Post to Database")
		let file = req.file
        
        //STEP 3: Upload to AWS
        const fileExtension = mime.extension(file.mimetype) 
        const result = await awsStorage.uploadProfile(file)

        console.log(result)

        

        //File Information
        var uploadFile = {}
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
        

       
        {
  ETag: '"de01b2f7428535f685bb56e4c0fad10b"',
  ServerSideEncryption: 'AES256',
  Location: 'https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/profile/profileImage-1737419292140-381400166-background_2.png',
  key: 'profile/profileImage-1737419292140-381400166-background_2.png',
  Key: 'profile/profileImage-1737419292140-381400166-background_2.png',
  Bucket: 'insta-app-bucket-tutorial'
}       
    cloudBucket
    cloudKey
    imageURL
        
        let currentUser = req.body.currentUser
        let firstName = req.body.firstName
        let lastName = req.body.lastName
        let biography = req.body.biography
        let cloudBucket = "profile"
        let fileURL = "http://localhost:3003/" + cloudBucket + "/" + file.filename

        let updatedUser = {
            currentUser: currentUser,
            firstName: firstName,
            lastName: lastName,     
            biography: biography,
            storageLocation: "aws",
            cloudBucket: result.Bucket,
            cloudPath: file.path,
            fileURL: fileURL,
            fileName: file.originalname,
            fileNameServer: file.filename
        }

        console.log("STEP 2: Created Updated User Profile Information ")
      
        //STEP 3: Update User Profile
        let updateUserProfile = await Profile.updateUserProfile(updatedUser);

        if(updateUserProfile.success == true) {
            console.log("STEP 2: Successfully Updated User Profile Information ")
            updateUserProfileOutcome.message = "We updated the user profile for " + currentUser;
            updateUserProfileOutcome.success = true;
            updateUserProfileOutcome.statusCode = 200;

            let userIDResponse = await userFunctions.getUserID(currentUser);
            
            updatedUserResponse.userName = currentUser;
            updatedUserResponse.userID = userIDResponse.userID;
            updatedUserResponse.userImage = fileURL;
            updatedUserResponse.biography = biography;
            updatedUserResponse.firstName = firstName;
            updatedUserResponse.lastName = lastName;

            updateUserProfileOutcome.data = updatedUserResponse;

        } else {
            console.log("STEP 2: There was an error Updating User Profile Information ")
        }

	} else {
        //TO DO: Add updatedUser to this out come!!
        console.log("STEP 2: Update Profile did not work")
    }

    updateUserProfileOutcome.data = updatedUserResponse
    */
