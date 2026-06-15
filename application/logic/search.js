const db = require('../functions/conn');
const Functions = require('../functions/functions');
const searchFunctions = require('../functions/searchFunctions');
/*
const Group = require('../functions/classes/Group');
const Notification = require('../functions/classes/Notification')
const Requests = require('../functions/classes/Requests');
const Functions = require('../functions/functions');
const userFunctions = require('../functions/userFunctions')
const friendFunctions = require('../functions/friendFunctions');
const requestFunctions = require('../functions/requestFunctions');
const notifications = require('./notifications');
const Friend = require('../functions/classes/Friend');
*/
/*
FUNCTIONS A: All Functions Related to Searching for Friends 
	1) Function A1: Search for your Active Friends 
	2) Function A2: Search for a Group

FUNCTIONS B: All Functions Related to Searching for Information 
	1) Function B1: Search for item information 
	2) Function B2: Get product information from URL

*/

//FUNCTIONS A: All Functions Related to Searching for Friends 
//Function A1: Search for your Active Friends 
async function searchActiveFriends(req, res) {
    const currentUser = req.params.user_name;
    const searchString = req.params.search_string;
     
    var headerMessage = "Search Friends for " + searchString;
    Functions.addHeader(headerMessage);
    

	if(searchString == "") {
		console.log("no search")
	} else {
		console.log("ok search")
	}
    
	console.log(searchString)

    var activeFriendListOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		currentUser: currentUser
	}

    var activeFriendList = await searchFunctions.searchActiveFriendList(currentUser, searchString);
  
    if(activeFriendList.success == true) {
        activeFriendListOutcome.data = activeFriendList.friendsArray
        activeFriendListOutcome.message = activeFriendList.friendsArray.length
        activeFriendListOutcome.success = true;
        activeFriendListOutcome.statusCode = 200;
    }
    
    Functions.addFooter()

    res.json(activeFriendListOutcome)

}

//Function A2: Search for a Group
async function searchGroups(req, res) {
    const searchString = req.body.searchString || "";
   
    var headerMessage = "Search Groups for " + searchString;
    Functions.addHeader(headerMessage);
    
    var searchGroupsOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
	}

	if(searchString == "") {
		console.log("no search")
		searchGroupsOutcome.message = "Search string is required";
		searchGroupsOutcome.statusCode = 400;
		searchGroupsOutcome.errors.push("Missing search_string in request body");
		return res.json(searchGroupsOutcome);
	} else {
		console.log("ok search")
	}
    
	console.log("Searching for: " + searchString)

    try {
        var groupsList = await searchFunctions.searchGroups(searchString);
      
        if(groupsList.success == true) {
            searchGroupsOutcome.data = groupsList.groupsArray
            searchGroupsOutcome.message = groupsList.groupsArray.length + " groups found"
            searchGroupsOutcome.success = true;
            searchGroupsOutcome.statusCode = 200;
        } else {
            searchGroupsOutcome.errors = groupsList.errors || [];
            searchGroupsOutcome.message = "Error searching for groups";
        }
    } catch (error) {
        console.error("Error in searchGroups:", error);
        searchGroupsOutcome.message = "Internal server error while searching for groups";
        searchGroupsOutcome.errors.push(error.message || error.toString());
        searchGroupsOutcome.statusCode = 500;
    }

    Functions.addFooter()
    res.json(searchGroupsOutcome)

}

//FUNCTIONS B: All Functions Related to Searching for Information 
//Function B1: Search for item information 
//Function B2: Get product information from URL
async function getProductInfo(req, res) {
    const itemURL = req.body.itemURL;

    var headerMessage = "Get Product Info"
    Functions.addHeader(headerMessage)
    
    var productInfoOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
		itemURL: itemURL
	}

    if (!itemURL) {
        productInfoOutcome.message = "Item URL is required";
        productInfoOutcome.statusCode = 400;
        productInfoOutcome.errors.push("Missing itemURL in request body");
        return res.json(productInfoOutcome);
    }

    try {
        var productInfo = await searchFunctions.getProductInfoFromURL(itemURL);
        
        if(productInfo.success == true) {
            productInfoOutcome.data = productInfo.productData
            productInfoOutcome.message = "Product information retrieved successfully"
            productInfoOutcome.success = true;
            productInfoOutcome.statusCode = 200;
        } else {
            productInfoOutcome.message = productInfo.message || "Failed to retrieve product information"
            productInfoOutcome.errors = productInfo.errors || []
        }
    } catch (error) {
        console.error("Error getting product info:", error);
        productInfoOutcome.message = "Internal server error while processing request"
        productInfoOutcome.errors.push(error.message)
    }

    Functions.addFooter()

    res.json(productInfoOutcome)
}

//Function A3: Search All Site Users
async function searchUsers(req, res) {
    const searchString = req.body.searchString || "";
    
    var headerMessage = "Search Users for " + searchString;
    Functions.addHeader(headerMessage);
    
    var searchUsersOutcome = {
		data: {},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
	}

	if(searchString == "") {
		console.log("no search")
		searchUsersOutcome.message = "Search string is required";
		searchUsersOutcome.statusCode = 400;
		searchUsersOutcome.errors.push("Missing searchString in request body");
		Functions.addFooter()
		return res.json(searchUsersOutcome);
	} else {
		console.log("ok search")
	}
    
	console.log("Searching for users: " + searchString)

    try {
        var usersList = await searchFunctions.searchAllUsers(searchString);
      
        if(usersList.success == true) {
            searchUsersOutcome.data = usersList.usersArray
            searchUsersOutcome.message = usersList.usersArray.length + " users found"
            searchUsersOutcome.success = true;
            searchUsersOutcome.statusCode = 200;
        } else {
            searchUsersOutcome.errors = usersList.errors || [];
            searchUsersOutcome.message = "Error searching for users";
        }
    } catch (error) {
        console.error("Error in searchUsers:", error);
        searchUsersOutcome.message = "Internal server error while searching for users";
        searchUsersOutcome.errors.push(error.message || error.toString());
        searchUsersOutcome.statusCode = 500;
    }
    
    Functions.addFooter()

    res.json(searchUsersOutcome)

}

//Function A4: Search All Site (Users and Groups)
async function searchAll(req, res) {
    const searchString = req.body.searchString || "";
    
    var headerMessage = "Searching for " + searchString;
    Functions.addHeader(headerMessage)
    

    var searchAllOutcome = {
		data: {
			users: [],
			groups: []
		},
		message: "", 
		success: false,
		statusCode: 500,
		errors: [], 
	}

	if(searchString == "") {
		console.log("no search")
		searchAllOutcome.message = "Search string is required";
		searchAllOutcome.statusCode = 400;
		searchAllOutcome.errors.push("Missing search_string in request body");
		return res.json(searchAllOutcome);
	} else {
		console.log("ok search all")
	}
    
	console.log("Searching all for: " + searchString)

    try {
        // Search both users and groups in parallel
        const [usersList, groupsList] = await Promise.all([
            searchFunctions.searchAllUsers(searchString),
            searchFunctions.searchGroups(searchString)
        ]);
      
        // Combine results
        if(usersList.success == true) {
            searchAllOutcome.data.users = usersList.usersArray || [];
        } else {
            searchAllOutcome.errors.push(...(usersList.errors || []));
        }

        if(groupsList.success == true) {
            searchAllOutcome.data.groups = groupsList.groupsArray || [];
        } else {
            searchAllOutcome.errors.push(...(groupsList.errors || []));
        }

        // Set success if at least one search succeeded
        if(usersList.success == true || groupsList.success == true) {
            const totalUsers = searchAllOutcome.data.users.length;
            const totalGroups = searchAllOutcome.data.groups.length;
            searchAllOutcome.message = `Found ${totalUsers} users and ${totalGroups} groups`;
            searchAllOutcome.success = true;
            searchAllOutcome.statusCode = 200;
        } else {
            searchAllOutcome.message = "Error searching for users and groups";
        }
    } catch (error) {
        console.error("Error in searchAll:", error);
        searchAllOutcome.message = "Internal server error while searching";
        searchAllOutcome.errors.push(error.message || error.toString());
        searchAllOutcome.statusCode = 500;
    }
    
    Functions.addFooter()

    res.json(searchAllOutcome)

}

module.exports = { searchActiveFriends, searchGroups, searchUsers, getProductInfo, searchAll }
