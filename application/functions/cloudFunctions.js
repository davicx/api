const S3 = require('aws-sdk/clients/s3')
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
//const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION

/*
FUNCTIONS A: All Functions Related to Cloud
	1) Function A1: Get Signed URL from AWS
*/
const s3Client = new S3Client({
    region: region
})

async function getSignedURL(fileKey) {
    //images/postImage-1716851490721-546172183-59045070_p0.jpg
    const getObjectParams = {
      Bucket: bucketName,
      Key: fileKey,
    }
  
    const command = new GetObjectCommand(getObjectParams);
    const awsSignedURL = await getSignedUrl(s3Client, command, { expiresIn: 259200 });

    return awsSignedURL;

}

module.exports = { getSignedURL }
