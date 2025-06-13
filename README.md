# API Project

This project is a Node.js Express application. A good place to start would be looking at **posts** or **profile**.This project is very much in development (sorry!). My work at Amazon and Nike have been in Java and this is just a small backend for my iOS app I am making. I plan to add a lot more including test coverage, regression testing, a retry mechanism (probably a python lambda with SQS) and a new Java Spring Boot micro service to interact with SNS for messaging. 

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
   - Copy `.env.example` to `.env` and update the values as needed.

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
