const db = require('./../conn');
const timeFunctions = require('../timeFunctions');

class Item {
    constructor(itemID) {
        this.itemID = itemID;
        this.postID = 0;
        this.itemName = "";
        this.itemPrice = 0;
        this.itemDescription = "";
        this.itemCategory = "";
        this.itemLink = "";
        this.purchased = 0;
        this.purchasedBy = "";
        this.store = "";
        this.multipleStores = 0;
    }
    
    //METHODS A: ITEM PURCHASE RELATED
    //Method A1: Check Item Purchase Status
    static async checkItemPurchaseStatus(itemID) {
        const connection = db.getConnection();
        
        return new Promise((resolve, reject) => {
            const queryString = "SELECT purchased, purchased_by FROM items WHERE item_id = ?";
            
            connection.query(queryString, [itemID], (err, rows) => {
                if (!err) {
                    if (rows.length > 0) {
                        const item = rows[0];
                        resolve({
                            purchased: item.purchased,
                            purchasedBy: item.purchased_by,
                            itemExists: true
                        });
                    } else {
                        resolve({
                            purchased: 0,
                            purchasedBy: "",
                            itemExists: false
                        });
                    }
                } else {
                    console.log("Error checking item purchase status:", err);
                    reject(err);
                }
            });
        });
    }
    
    //Method A2: Purchase an Item
    static async purchaseItem(itemID, userName, postID) {
        const connection = db.getConnection();
        
        return new Promise((resolve, reject) => {
            const queryString = "UPDATE items SET purchased = 1, purchased_by = ? WHERE item_id = ? AND post_id = ?";
            
            connection.query(queryString, [userName, itemID, postID], (err, result) => {
                if (!err) {
                    if (result.affectedRows > 0) {
                        console.log("Item purchased successfully:", itemID, "by", userName);
                        resolve({
                            success: true,
                            message: "Item purchased successfully",
                            itemID: itemID,
                            purchasedBy: userName
                        });
                    } else {
                        console.log("No item found to purchase:", itemID);
                        resolve({
                            success: false,
                            message: "Item not found",
                            itemID: itemID
                        });
                    }
                } else {
                    console.log("Error purchasing item:", err);
                    reject(err);
                }
            });
        });
    }
    
    //Method A3: Remove Purchase from an Item
    static async removePurchase(itemID, userName) {
        const connection = db.getConnection();
        
        return new Promise((resolve, reject) => {
            const queryString = "UPDATE items SET purchased = 0, purchased_by = '' WHERE item_id = ? AND purchased_by = ?";
            
            connection.query(queryString, [itemID, userName], (err, result) => {
                if (!err) {
                    if (result.affectedRows > 0) {
                        console.log("Item purchase removed successfully:", itemID, "by", userName);
                        resolve({
                            success: true,
                            message: "Item purchase removed successfully",
                            itemID: itemID,
                            removedBy: userName
                        });
                    } else {
                        console.log("No purchase found to remove for item:", itemID, "by user:", userName);
                        resolve({
                            success: false,
                            message: "No purchase found to remove",
                            itemID: itemID
                        });
                    }
                } else {
                    console.log("Error removing item purchase:", err);
                    reject(err);
                }
            });
        });
    }
    
    //Method A4: Get Item Details
    static async getItemDetails(itemID) {
        const connection = db.getConnection();
        
        return new Promise((resolve, reject) => {
            const queryString = "SELECT * FROM items WHERE item_id = ?";
            
            connection.query(queryString, [itemID], (err, rows) => {
                if (!err) {
                    if (rows.length > 0) {
                        const item = rows[0];
                        resolve({
                            itemID: item.item_id,
                            postID: item.post_id,
                            itemName: item.item_name,
                            itemPrice: item.item_price,
                            itemDescription: item.item_description,
                            itemCategory: item.item_category,
                            itemLink: item.item_link,
                            purchased: item.purchased,
                            purchasedBy: item.purchased_by,
                            store: item.store,
                            multipleStores: item.multiple_stores,
                            itemExists: true
                        });
                    } else {
                        resolve({
                            itemExists: false
                        });
                    }
                } else {
                    console.log("Error getting item details:", err);
                    reject(err);
                }
            });
        });
    }
    
    //Method A5: Get Items by Post ID
    static async getItemsByPostID(postID) {
        const connection = db.getConnection();
        
        return new Promise((resolve, reject) => {
            const queryString = "SELECT * FROM items WHERE post_id = ? ORDER BY item_id ASC";
            
            connection.query(queryString, [postID], (err, rows) => {
                if (!err) {
                    const items = rows.map((row) => {
                        return {
                            itemID: row.item_id,
                            postID: row.post_id,
                            itemName: row.item_name,
                            itemPrice: row.item_price,
                            itemDescription: row.item_description,
                            itemCategory: row.item_category,
                            itemLink: row.item_link,
                            purchased: row.purchased,
                            purchasedBy: row.purchased_by,
                            store: row.store,
                            multipleStores: row.multiple_stores
                        };
                    });
                    
                    resolve({
                        items: items,
                        itemCount: items.length
                    });
                } else {
                    console.log("Error getting items by post ID:", err);
                    reject(err);
                }
            });
        });
    }
}

module.exports = Item;
