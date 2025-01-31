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
