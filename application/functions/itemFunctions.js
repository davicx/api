const db = require('./conn');

/*
FUNCTIONS A: All Functions Related to Item Purchase Records
	1) Function A1: Insert Group Purchase - Records who can see that a user purchased an item (for item_purchases table)
	2) Function A2: Delete Group Purchase Visibility - Removes visibility rows when a purchase is removed
	3) Function A3: Add Purchase Viewers to Items - Adds purchased_viewers array to each item in posts

*/

//FUNCTIONS A: All Functions Related to Item Purchase Records
//Function A1: Insert Group Purchase - Records who can see that a user purchased an item (visible_to per row)
async function insertGroupPurchase(postID, userName, itemID, showPurchased) {
	const connection = db.getConnection();

	var insertOutcome = {
		success: false,
		message: "",
		errors: []
	};

	// Normalize showPurchased to array, filter empty
	var visibleTo = Array.isArray(showPurchased) ? showPurchased.filter(function(u) { return u && String(u).trim(); }) : [];

	return new Promise(async function(resolve, reject) {
		try {
			//STEP 1: Get group_id and post_from (list owner) from the post
			const postQueryString = "SELECT group_id, post_from FROM posts WHERE post_id = ?";
			connection.query(postQueryString, [postID], async (err, rows) => {
				if (err) {
					insertOutcome.message = "Failed to get post";
					insertOutcome.errors.push(err.message);
					return resolve(insertOutcome);
				}

				if (!rows || rows.length === 0) {
					insertOutcome.message = "Post not found";
					return resolve(insertOutcome);
				}

				var groupID = rows[0].group_id;
				var listOwner = rows[0].post_from ? String(rows[0].post_from).toLowerCase() : "";

				//STEP 2: Skip if post is not in a group (e.g. group_id 0)
				if (!groupID || groupID === 0) {
					insertOutcome.message = "Post not in a group; skipping item_purchases insert";
					return resolve(insertOutcome);
				}

				//STEP 3: Remove list owner (item_for_user_name) from visibleTo - they must never see who purchased (gift surprise)
				visibleTo = visibleTo.filter(function(u) { return String(u).toLowerCase() !== listOwner; });

				var itemForUserName = rows[0].post_from || "";

				//STEP 4: Delete existing visibility rows for this item + purchaser (replace on re-purchase)
				const deleteQueryString = "DELETE FROM item_purchases WHERE item_id = ? AND purchased_by_username = ?";
				connection.query(deleteQueryString, [itemID, userName], function(deleteErr) {
					if (deleteErr) {
						insertOutcome.message = "Failed to clear existing visibility";
						insertOutcome.errors.push(deleteErr.message);
						return resolve(insertOutcome);
					}

					//STEP 6: Bulk insert - one row per user who can see the purchase
					if (visibleTo.length === 0) {
						insertOutcome.success = true;
						insertOutcome.message = "Group purchase recorded (no visibility)";
						return resolve(insertOutcome);
					}

					var placeholders = visibleTo.map(function() { return "(?, ?, ?, ?, ?, ?)"; }).join(", ");
					var insertQueryString = "INSERT INTO item_purchases (group_id, post_id, item_id, purchased_by_username, item_for_user_name, visible_to_user_name) VALUES " + placeholders;
					var insertParams = [];
					for (var i = 0; i < visibleTo.length; i++) {
						insertParams.push(groupID, postID, itemID, userName, itemForUserName, visibleTo[i]);
					}

					connection.query(insertQueryString, insertParams, function(insertErr, result) {
						if (!insertErr) {
							insertOutcome.success = true;
							insertOutcome.message = "Group purchase recorded; " + visibleTo.length + " user(s) can see";
						} else {
							insertOutcome.message = "Failed to insert into item_purchases";
							insertOutcome.errors.push(insertErr.message);
						}
						resolve(insertOutcome);
					});
				});
			});
		} catch (err) {
			insertOutcome.message = "Error in insertGroupPurchase";
			insertOutcome.errors.push(err.message);
			reject(insertOutcome);
		}
	});
}

//Function A2: Delete Group Purchase Visibility - Removes visibility rows when a purchase is removed
async function deleteGroupPurchaseVisibility(itemID, userName) {
	const connection = db.getConnection();

	var deleteOutcome = {
		success: false,
		message: "",
		errors: []
	};

	return new Promise(function(resolve, reject) {
		const queryString = "DELETE FROM item_purchases WHERE item_id = ? AND purchased_by_username = ?";
		connection.query(queryString, [itemID, userName], function(err, result) {
			if (!err) {
				deleteOutcome.success = true;
				deleteOutcome.message = "Group purchase visibility removed";
			} else {
				deleteOutcome.message = "Failed to delete item_purchases";
				deleteOutcome.errors.push(err.message);
			}
			resolve(deleteOutcome);
		});
	});
}

//Function A3: Add Purchase Viewers to Items - Adds purchased_viewers array to each item in posts
async function addPurchaseViewersToItems(posts) {
	const connection = db.getConnection();

	var itemIds = [];
	for (var i = 0; i < posts.length; i++) {
		if (posts[i].item && posts[i].item.item_id) {
			itemIds.push(posts[i].item.item_id);
		}
	}

	if (itemIds.length === 0) {
		// Ensure every item has purchased_viewers (empty array) even when no item_purchases rows
		for (var j = 0; j < posts.length; j++) {
			if (posts[j].item) {
				posts[j].item.purchased_viewers = posts[j].item.purchased_viewers || [];
			}
		}
		return posts;
	}

	var placeholders = itemIds.map(function() { return "?"; }).join(",");
	var queryString = "SELECT item_id, visible_to_user_name FROM item_purchases WHERE item_id IN (" + placeholders + ")";

	return new Promise(function(resolve, reject) {
		connection.query(queryString, itemIds, function(err, rows) {
			if (err) {
				for (var j = 0; j < posts.length; j++) {
					if (posts[j].item) {
						posts[j].item.purchased_viewers = [];
					}
				}
				return resolve(posts);
			}

			var viewerMap = {};
			for (var k = 0; k < rows.length; k++) {
				var itemId = parseInt(rows[k].item_id, 10);
				if (!viewerMap[itemId]) {
					viewerMap[itemId] = [];
				}
				viewerMap[itemId].push(rows[k].visible_to_user_name);
			}

			for (var m = 0; m < posts.length; m++) {
				if (posts[m].item) {
					var lookupId = parseInt(posts[m].item.item_id, 10);
					posts[m].item.purchased_viewers = viewerMap[lookupId] || [];
				}
			}

			resolve(posts);
		});
	});
}

module.exports = { insertGroupPurchase, deleteGroupPurchaseVisibility, addPurchaseViewersToItems };
