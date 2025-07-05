//NEED TO UPDATE PROFILE TO HANDLE AWS
//UPLOADS
//LEARNING

/*
file_name: The original file name the user uploaded the file with 
file_name_server: The original file name and time stamp and added characters to make unique 
file_url: The actual URL you can get the file (right now local or from AWS)
cloud_key: Any other folders inside bucket plus fileNameServer (bucket\folder\fileNameServer)
cloud_bucket: The bucket name on AWS but locally this is the folder it is stored in
storage_type: local or aws

AWS
"fileName": "background_1.jpg",
"fileNameServer": "postImage-1749944860810-321769559-background_1.jpg",
"fileURL": "https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/posts/postImage-1749944860810-321769559-background_1.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAXZAOI335HZSDKHVN%2F20250614%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250614T234741Z&X-Amz-Expires=259200&X-Amz-Signature=a3d18ccb151ba39e2bca0f5f557900aebbe0d39219e2e1e95dec248e59a55176&X-Amz-SignedHeaders=host&x-id=GetObject",
"cloudBucket": "insta-app-bucket-tutorial",
"cloudKey": "posts/postImage-1749944860810-321769559-background_1.jpg",

LOCAL
"fileName": "background_1.jpg",
"fileNameServer": "postImage-1749945022336-837259397-background_1.jpg",
"fileURL": "http://localhost:3003/kite-posts-us-west-two/postImage-1749945022336-837259397-background_1.jpg",
"cloudBucket": "kite-posts-us-west-two",
"cloudKey": "no_cloud_key",
*/
/*
postPhotoLocal
postPhotoLocalAWS

createGroup
createGroupLocalAWS

updateFullUserProfileLocal
updateFullUserProfileLocalAWS


*/