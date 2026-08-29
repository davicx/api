const express = require('express')
const itemRouter = express.Router();
const items = require('../logic/items')
const middlewares = require('../functions/middlewareFunctions')
const functions = require('../functions/functions')

var jwt = require('jsonwebtoken');
var jwt_decode = require('jwt-decode');
const db = require('../functions/conn');


/*
FUNCTIONS A: All Routes Related to Items
	1) Function A1: Post Item

FUNCTIONS B: All Routes Related to getting Items
	1) Function B1: Get all Group Items
	2) Function B2: Get All Items (Home feed)
*/


//Route A1: Post Item 
itemRouter.post('/post/item', async function(req, res) {
	//posts.postPhoto(req, res)
	const appLocation = process.env.APP_LOCATION
	const fileLocation = process.env.FILE_LOCATION

	console.log("appLocation " + appLocation + " fileLocation " +fileLocation );

	//Type 1: Local to Local 
	if(functions.compareStrings(appLocation, "local") && functions.compareStrings(fileLocation, "local")) {
		console.log("Item Router: Type 1: Local to Local")
		items.postItemLocal(req, res)
		//posts.postPhotoLocalAWS(req, res)
	//Type 2: Local to AWS 	
	} else if (functions.compareStrings(appLocation, "local") && functions.compareStrings(fileLocation, "aws")) {
		console.log("Item Router: Type 2: Local to AWS")
		//posts.postPhotoLocalAWS(req, res)
		items.postItemLocalAWS(req, res)
	//Type 3: AWS to AWS	
	} else if(functions.compareStrings(appLocation, "aws") && functions.compareStrings(fileLocation, "aws")) {
		console.log("Item Router: Type 3: AWS to AWS")
		res.json({need:"Set this up"})
	} else {
		res.json({outcome:"uhh whats up dude", appLocation: appLocation, fileLocation:fileLocation})
	}
})

//Function B1: Get all Group Items
itemRouter.get("/items/group/:group_id", middlewares.verifyUser, (req, res) => {
	items.getAllGroupItems(req, res);
})

//Function B2: Get All Items (global Home feed — newest 12)
itemRouter.get("/items", middlewares.verifyUser, (req, res) => {
	items.getAllItems(req, res);
})

//FUNCTIONS C: All Routes Related to Item Actions
//Function C1: Purchase an Item
itemRouter.post('/items/purchase/add', function(req, res) {
    items.purchaseItem(req, res);
})

//Function C2: Remove Purchase from an Item 
itemRouter.post('/items/purchase/remove', function(req, res) {
	items.removePurchase(req, res);
})

module.exports = itemRouter; 