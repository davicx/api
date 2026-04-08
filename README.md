# API Project

## CloudPilot / Atlas split (planned shape)

| Layer | Role | Examples |
|--------|------|----------|
| **Atlas (Python)** | **Detection** — rules and scanners find problems (low CPU, old instances, unused resources, etc.). | Structured **findings** (IDs, metrics, rule metadata). |
| **This API (Node)** | **Interpret + guide** (when you use it) — AI and app logic that explain findings, suggest actions, and (later) use **org context** (RAG, history, user/group). | Chat, notifications, “what should I do?”, orchestration for web or **future iOS** clients. |

Atlas stays the **source of truth for what’s wrong**; Node focuses on **how users understand and act on it**. **Python AI in Atlas** may still run occasional calls but is expected to be **mostly idle** for now.

---

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
   - Use **`api/.env`** (same folder as `app.js`). It is gitignored — never commit it.
   - For **`POST /chat/`**, set **`OPENAI_API_KEY=`** to your key from [OpenAI API keys](https://platform.openai.com/api-keys) (no quotes needed unless your tooling requires them).

## Atlas-organized routes (same API, folder only)

Some routes live under **`application/atlas/routes/`** only for file organization; they are still part of this Express app.

- **`POST http://localhost:3003/chat/`** — optional JSON body `{ "body": "your greeting" }`. Calls **ChatGPT** (`gpt-4o-mini`); response **`message`** is at most **three words** (keeps **output** cost tiny). For **billing**, also set a **monthly spend limit** in your [OpenAI billing settings](https://platform.openai.com/settings/organization/limits).

Example:

```bash
curl -s -X POST http://localhost:3003/chat/ -H "Content-Type: application/json" -d '{"body":"Good morning"}'
```

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
Routes is the entry point for the application. I have a postman collection I can share upon request for every route. This should always be as simple as possible
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
Logic is where I have all the code related to a request we get from a route above. So every route will call a logic method. In here we may call multiple different functions or classes to handle a request. For instance after you make a post you may also want to make a notification. After adding a friend we would call Requests and Notifications.

### Functions:
Functions are basically helper functions specific to handling a request. These functions may get called in other parts of the code to handle a request. For instance timeFunctions.js is how I handle all the time related needs in a lot of requests.

#### Classes:
Classes are where I handle most of the database operations for a single thing like a Post or Friend. This is where we mostly interact with my MySQL (RDS) database and handle very specific logic to this thing like Friend -> Add Friend or Post -> Make a Photo Post. 

#### FLOW:
So the flow is 
route -> logic -> handle all things that we need calling different functions and classes to satisfy that request.

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

