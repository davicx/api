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
   - **`OPENAI_API_KEY`** is optional until you add OpenAI-backed features again.

## Messages — Kite vs Atlas (duplicate, toggle in `app.js`)

`messageRoutes.js` and `logic/messages.js` exist in **two** places and should stay in sync:

- **`application/routes/messageRoutes.js`** + **`application/logic/messages.js`**
- **`application/atlas/routes/messageRoutes.js`** + **`application/atlas/logic/messages.js`**

**Only one** is mounted — switch the `require` in **`app.js`** (see comment there):

```js
//const messages = require('./application/routes/messageRoutes.js');
const messages = require('./application/atlas/routes/messageRoutes.js');
app.use(messages);
```

Same URLs either way: **`POST /message`**, **`GET /messages/group/:group_id`**, etc.

## CloudPilot EC2 mutations — chat message samples

Use **`POST /message`** (Kite chat or Postman). Each destructive action uses execution mode **`4`** (automatic) and confirmation **`yes`**.

Prerequisites: API running, Atlas running at `ATLAS_BASE_URL` (default `http://127.0.0.1:8000`), and AWS credentials configured for Atlas. Clean up test instances when finished.

### Create EC2

**Message 1** — start the flow:

```text
Create an ec2 instance
```

Also works: `Create an instance`, `create ec2 instance`

**Message 2** — region, name, and size (one line is fine):

```text
name: "my-test-instance" region: "us-west-2" instance_type: "t3.micro"
```

Or split across messages:

```text
region: "us-west-2"
```

```text
name: "my-test-instance" instance_type: "t3.micro"
```

**Message 3** — execution mode:

```text
4
```

**Message 4** — confirm:

```text
yes
```

Copy the **`instance_id`** from CloudPilot’s success message (e.g. `i-0abc…`) for delete or toggle.

### Delete EC2

**Message 1**:

```text
Delete an ec2 instance
```

Also works: `Delete an instance`, `delete ec2 instance`

**Message 2** — use the ID from create:

```text
region: "us-west-2" instance_id: "i-0123456789abcdef0"
```

Or if the ID and region are in one line:

```text
Delete instance i-0123456789abcdef0 in us-west-2
```

(`region` + `i-…` can be picked up from that message.)

**Message 3**:

```text
4
```

**Message 4**:

```text
yes
```

### Toggle EC2

Stops the **primary** instance and starts the **secondary** instance. Toggle can take several minutes (Atlas waiters).

**Message 1**:

```text
Toggle ec2 instances
```

Also works: `switch ec2`, `toggle ec2`

**Message 2** — region:

```text
region: "us-west-2"
```

**Message 3** — primary instance ID (the one to stop):

```text
primary_instance_id: "i-0123456789abcdef0"
```

Or just paste the ID when prompted:

```text
i-0123456789abcdef0
```

**Message 4** — secondary instance ID (the one to start):

```text
secondary_instance_id: "i-0fedcba9876543210"
```

Or just paste the ID when prompted:

```text
i-0fedcba9876543210
```

**Message 5**:

```text
4
```

**Message 6**:

```text
yes
```

Later (Stage 5): primary/secondary may be resolved from `cloudpilot-role` tags so you do not need to paste IDs manually.

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
    ├── app.js                         # Entry point; mounts one `messageRoutes` stack (legacy vs atlas — see above)
    ├── application/
    │   ├── atlas/                     # CloudPilot / Navigator — scans, `atlas` payload on POST /message, etc.
    │   │   ├── functions/             # e.g. cloudPilotMessageFunctions, ec2/*, chatFunctions, config
    │   │   ├── logic/
    │   │   ├── routes/                # Duplicate message routes (toggle in app.js)
    │   │   └── state/                 # Conversation + pending-action state
    │   ├── functions/                 # Route helpers; `classes/` + `aws/` live here
    │   ├── logic/
    │   └── routes/
    ├── doc/                           # Sample JSON, notes, backup snippets
    ├── images/
    ├── public/
    ├── uploads/
    └── ...

#### Atlas (`application/atlas/`)
    .
    ├── routes/                        # HTTP only — same URLs as legacy `application/routes/messageRoutes.js` (toggle in app.js)
    │   └── messageRoutes.js
    ├── logic/                         # Orchestration for POST /message (intents, guardrails, CloudPilot reply shape)
    │   └── messages.js
    ├── functions/                     # CloudPilot + OpenAI helpers; EC2 scan path; not the generic `application/functions/` tree
    │   ├── cloudPilotMessageFunctions.js
    │   ├── chatFunctions.js
    │   ├── config/
    │   │   └── chatGPTconfig.js
    │   └── ec2/
    │       ├── atlasEC2Functions.js
    │       ├── atlasEC2Formatter.js
    │       └── atlasEC2MessageBuilder.js
    └── state/                         # Conversation + pending-action state for CloudPilot
        ├── state.js
        ├── ActionState.js
        └── conversationStateFunctions.js

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
"fileURL": "https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/posts/postImage-1749944860810-321769559-background_1.jpg",
"cloudBucket": "insta-app-bucket-tutorial",
"cloudKey": "posts/postImage-1749944860810-321769559-background_1.jpg",

LOCAL
"fileName": "background_1.jpg",
"fileNameServer": "postImage-1749945022336-837259397-background_1.jpg",
"fileURL": "http://localhost:3003/kite-posts-us-west-two/postImage-1749945022336-837259397-background_1.jpg",
"cloudBucket": "kite-posts-us-west-two",
"cloudKey": "no_cloud_key",



meta = response-level context
stats = visible metrics
tables = visible tabular data
cards = visible summaries
alerts = visible notices/warnings
actions = visible user actions
raw = optional original Atlas payload