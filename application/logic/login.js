/*
FUNCTIONS A: All Functions Related to Login
	1) Function A1: Post Text
	2) Function A2: 

*/

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
  

module.exports = { getUserCookies };
