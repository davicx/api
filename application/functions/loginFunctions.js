const db = require('./conn');
/*
FUNCTIONS A: All Functions Related to Login
	1) Function A1: Post Text
	2) Function A2: Post Text


*/

//Function A1: Insert Refresh Tokens
async function insertRefreshToken(refreshToken, userName, userID) {
  const connection = db.getConnection();
  const queryString = "INSERT INTO refresh_tokens (refresh_token, user_name, user_id) VALUES (?, ?, ?)";

  var insertRefreshTokenOutcome = {
    status: false
  }

  return new Promise((resolve, reject) => {
      connection.query(queryString, [refreshToken, userName, userID], (err, results) => {
          if (!err) {
              console.log("STEP 5: Added a refresh token to the database with ID " + results.insertId);
              insertRefreshTokenOutcome.status = true

              resolve(insertRefreshTokenOutcome);  
          } else {
              console.log("STEP 5: Error Problem with the Database!");
              console.log(err);

              resolve(insertRefreshTokenOutcome); 
          }
      });
  });
}

//Function A2: Delete Old Refresh Tokens
async function deleteRefreshTokens(userName) {
  const connection = db.getConnection(); 
  const clearQueryString = "DELETE FROM refresh_tokens WHERE user_name = ?;";

  var deleteRefreshTokenOutcome = {
    status: false
  }

  return new Promise((resolve, reject) => {
      connection.query(clearQueryString, [userName], (err, result) => {
          if (!err) {
              console.log("Removed old refresh tokens for " + userName);
              deleteRefreshTokenOutcome.status = true

              resolve(deleteRefreshTokenOutcome);  
          } else {
              console.log("Error: Problem with the Database!");
              console.log(err);
              resolve(deleteRefreshTokenOutcome);  
          }
      });
  });
}


//Function A4: Get All User Cookies
async function getUserCookies(req, res) {
  const userName = req.body.userName;

  let loggedInUser = "empty";
  let accessToken = "empty";
  let refreshToken = "This is not the refresh Route";
  /*
  res.cookie('accessToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  //res.cookie('refreshToken', "notLoggedIn", {maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  res.cookie('refreshToken', "notLoggedIn", {maxAge: 60 * 1000 * 525600  , path: '/refresh', httpOnly: true})
  res.cookie('loggedInUser', "notLoggedIn",{maxAge: 100 * 60 * 60 * 1000, httpOnly: true})
  */
  console.log("Trying to get the cookies! ")
  if(req.cookies.accessToken) {
      accessToken = req.cookies.accessToken;
  }    
  if(req.cookies.loggedInUser) {
      loggedInUser = req.cookies.loggedInUser;
  }

  if(req.cookies.refreshToken) {
      console.log("IF")
      refreshToken = req.cookies.refreshToken;
  } else {
      console.log(req.cookies)
  }

  var response = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      userName: loggedInUser
  }
  console.log(response);

  res.json(response)

}


module.exports = { insertRefreshToken, deleteRefreshTokens, getUserCookies };

