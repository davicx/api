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
