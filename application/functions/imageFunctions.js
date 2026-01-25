const Functions = require('./functions');
const cloudFunctions = require('./cloudFunctions');

/*
FUNCTIONS A: All Functions Related to Images
	1) Function A1: Get Image URL (handles both local and AWS)
*/

//Function A1: Get Image URL - Generic function that handles both local and AWS storage
//INPUT: storageLocation ("local" or "aws"), imageURL (full URL for local), cloudKey (S3 key for AWS)
//OUTPUT: Full image URL (local URL or signed AWS URL)
async function getImage(storageLocation, imageURL, cloudKey) {
	if(Functions.compareStrings(storageLocation, "aws") == true) {
		console.log("imageFunctions: Get AWS Photo FOR " + cloudKey)
		let signedImageURL = await cloudFunctions.getSignedURL(cloudKey)
		
		return signedImageURL;
	} else {
		console.log("imageFunctions: Using local image URL")  
		return imageURL;   
	}
}

module.exports = { getImage }

