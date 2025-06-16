# API Project

This project is a Node.js Express application. A good place to start would be looking at **posts** or **profile**.This project is very much in development (sorry!). My work at Amazon and Nike have been in Java and this is just a small backend for my iOS app I am making. I plan to add a lot more including things like.  
* Test coverage 
* Regression testing 
* Retry mechanism (probably a python lambda with SQS) 
* A new Java Spring Boot micro service I just started to interact with SNS for messaging
* A new CloudFormation for my AWS Services

**Good Exammples**
The post, profile, login and groups routes are pretty good. I would suggest looking at posts first. 

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a new `.env` and update the values as needed.

## Running the Application

To run the application in development mode with nodemon (which automatically restarts the server on file changes), use:

```
nodemon app.js
```

For production, use:

```bash
npm start
```

## Project Structure
### Routes:
Routes is the entry point for the application. I have a postman collection I can share upon request for every route. 
For example the login route is 

POST: http://localhost:3003/user/login

BODY: 
`
{
    "userName": "Sam",
    "password": "password",
    "device_id": "davey_postman"
}
`

### Logic:
Logic is where I have all the code related to a request. So every route will call a logic method. In here we may call multiple different functions to handle a request. For instance after you make a post you may also want to make a notification.

### Functions:
Functions are basically helper functions specific to handling a request. These functions may get called in other parts of the code to handle a request. For instance timeFunctions.js is how I handle all the time related needs in a lot of requests.

#### Classes:
Classes are where I handle most of the database operations and interaction with my MySQL (RDS) database. 


### Project Structure
#### Backend 
    .
    ├── ...
    ├── application                   
    │   ├── backup   
    │   ├── functions  
    │   ├──── AWS
    │   ├──── classes
    │   ├── logic  
    │   ├── routes         
    │   ├── upload_temp                                      
    │   ├────                                                
    ├── __test__                   
    │   ├── *not started yet 
    │   ├──── 
    ├── app.js (Entry Point into the Application) 
    └── ...

### Tables
#### Posts 
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