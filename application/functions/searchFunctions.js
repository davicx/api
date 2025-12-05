const db = require('./conn');
const cheerio = require('cheerio');
/*
const userFunctions = require('./userFunctions');
const Friend = require('./classes/Friend');
const Requests = require('./classes/Requests');
const Notifications = require('./classes/Notification');
*/

/*
FUNCTIONS A: All Functions Related to Search 
	1) Function A1: Search for active friends
	2) Function A2: Get product information from URL

*/

//FUNCTIONS A: All Functions Related to Search 
//Function A1: Search for active friends
async function searchActiveFriendList(currentUser, searchStringRaw) {
    const connection = db.getConnection(); 
    let searchString = searchStringRaw + "%";
    //console.log(currentUser)
    //console.log(searchString)

    var activeFriendsListOutcome = {
        success: false,
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.image_url, user_profile.first_name, user_profile.last_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0 AND friends.friend_user_name LIKE ?";
            //const queryString = "SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = ? AND friends.request_pending = 0";
            connection.query(queryString, [currentUser, searchString], (err, rows) => {
                //console.log(rows)
                var friendsArray = []
             
                for (let i = 0; i < rows.length; i++) {
                    let currentFriend = {}

                    currentFriend.friendName = rows[i].user_name;
                    currentFriend.friendImage = rows[i].image_url;
                    currentFriend.firstName = rows[i].first_name;
                    currentFriend.lastName = rows[i].last_name;

                    friendsArray.push(currentFriend)

                  } 

                if (!err) {
                    //console.log(err)
                    activeFriendsListOutcome.success = true;
                    activeFriendsListOutcome.friendsArray = friendsArray
                    resolve(activeFriendsListOutcome); 

                } else {
                    activeFriendsListOutcome.outcome = 500;
                    resolve(activeFriendsListOutcome);
                }
            })
        } catch(err) {
            //console.log(err)
            activeFriendsListOutcome.outcome = 500;
            reject(activeFriendsListOutcome);
        } 
    })

}

//Function A2: Get product information from URL
async function getProductInfoFromURL(itemURL) {
    var productInfoOutcome = {
        success: false,
        productData: {},
        message: "",
        errors: []
    }

    try {
        // Fetch the webpage content
        const response = await fetch(itemURL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        });

        if (!response.ok) {
            productInfoOutcome.message = `Failed to fetch URL: ${response.status} ${response.statusText}`;
            productInfoOutcome.errors.push(`HTTP ${response.status}: ${response.statusText}`);
            return productInfoOutcome;
        }

        const html = await response.text();
        
        // Load HTML into Cheerio for parsing
        const $ = cheerio.load(html);
        
        // Extract product information using Cheerio selectors
        let productData = {
            name: "Product name not found",
            price: "Price not found",
            image: "Image not found",
            description: "Description not found",
            sourceURL: itemURL
        };

        // Extract title/name - try multiple selectors
        const title = $('meta[property="og:title"]').attr('content') ||
                     $('meta[name="title"]').attr('content') ||
                     $('title').text() ||
                     $('h1').first().text() ||
                     $('[data-testid="product-title"]').text() ||
                     $('.product-title').text() ||
                     $('.product-name').text() ||
                     $('[class*="title"]').first().text();
        
        if (title && title.trim()) {
            productData.name = title.trim();
        }

        // Extract price - try multiple selectors
        const priceText = $('[data-testid="product-price"]').text() ||
                         $('.product-price').text() ||
                         $('.price').text() ||
                         $('[class*="price"]').text() ||
                         $('span:contains("$")').text();
        
        if (priceText) {
            const priceMatch = priceText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
            if (priceMatch) {
                productData.price = `$${priceMatch[1]}`;
            }
        }

        // Extract image - try multiple selectors
        const image = $('meta[property="og:image"]').attr('content') ||
                     $('meta[property="twitter:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('.product-image img').attr('src') ||
                     $('.product-img img').attr('src') ||
                     $('[data-testid="product-image"] img').attr('src') ||
                     $('img[src*="product"]').first().attr('src') ||
                     $('img').first().attr('src');
        
        if (image) {
            // Handle relative URLs
            if (image.startsWith('//')) {
                productData.image = 'https:' + image;
            } else if (image.startsWith('/')) {
                const url = new URL(itemURL);
                productData.image = url.origin + image;
            } else if (!image.startsWith('http')) {
                const url = new URL(itemURL);
                productData.image = url.origin + '/' + image;
            } else {
                productData.image = image;
            }
        }

        // Extract description - try multiple selectors
        const description = $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="description"]').attr('content') ||
                          $('meta[property="description"]').attr('content') ||
                          $('.product-description').text() ||
                          $('.product-desc').text() ||
                          $('[data-testid="product-description"]').text();
        
        if (description && description.trim()) {
            productData.description = description.trim();
        }

        // Clean up the data
        if (productData.name.length > 100) {
            productData.name = productData.name.substring(0, 100) + "...";
        }
        
        if (productData.description.length > 200) {
            productData.description = productData.description.substring(0, 200) + "...";
        }

        // Remove extra whitespace and newlines
        productData.name = productData.name.replace(/\s+/g, ' ').trim();
        productData.description = productData.description.replace(/\s+/g, ' ').trim();

        productInfoOutcome.success = true;
        productInfoOutcome.productData = productData;
        productInfoOutcome.message = "Product information extracted successfully";

    } catch (error) {
        console.error("Error extracting product info:", error);
        productInfoOutcome.message = "Failed to extract product information";
        productInfoOutcome.errors.push(error.message);
    }

    return productInfoOutcome;
}

/*
ORIGINAL REGEX-BASED IMPLEMENTATION (COMMENTED OUT)
This was the original approach using regex patterns before upgrading to Cheerio.

async function getProductInfoFromURL_ORIGINAL(itemURL) {
    var productInfoOutcome = {
        success: false,
        productData: {},
        message: "",
        errors: []
    }

    try {
        // Fetch the webpage content
        const response = await fetch(itemURL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            productInfoOutcome.message = `Failed to fetch URL: ${response.status} ${response.statusText}`;
            productInfoOutcome.errors.push(`HTTP ${response.status}: ${response.statusText}`);
            return productInfoOutcome;
        }

        const html = await response.text();
        
        // Extract product information using regex patterns
        // This is a basic approach - for production, consider using a proper HTML parser like cheerio
        
        // Extract title/name
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || 
                          html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) ||
                          html.match(/<meta[^>]*name="title"[^>]*content="([^"]+)"/i);
        
        // Extract price
        const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/) ||
                          html.match(/price["\s:]*\$?(\d+(?:\.\d{2})?)/i) ||
                          html.match(/<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i);
        
        // Extract image
        const imageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/<meta[^>]*property="twitter:image"[^>]*content="([^"]+)"/i) ||
                          html.match(/<img[^>]*src="([^"]*product[^"]*\.(?:jpg|jpeg|png|gif|webp))"/i) ||
                          html.match(/<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|gif|webp))"/i);
        
        // Extract description
        const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
                         html.match(/<meta[^>]*property="description"[^>]*content="([^"]+)"/i);

        // Build product data object
        const productData = {
            name: titleMatch ? titleMatch[1].trim() : "Product name not found",
            price: priceMatch ? `$${priceMatch[1]}` : "Price not found",
            image: imageMatch ? imageMatch[1] : "Image not found",
            description: descMatch ? descMatch[1].trim() : "Description not found",
            sourceURL: itemURL
        };

        // Clean up the data
        if (productData.name.length > 100) {
            productData.name = productData.name.substring(0, 100) + "...";
        }
        
        if (productData.description.length > 200) {
            productData.description = productData.description.substring(0, 200) + "...";
        }

        productInfoOutcome.success = true;
        productInfoOutcome.productData = productData;
        productInfoOutcome.message = "Product information extracted successfully";

    } catch (error) {
        console.error("Error extracting product info:", error);
        productInfoOutcome.message = "Failed to extract product information";
        productInfoOutcome.errors.push(error.message);
    }

    return productInfoOutcome;
}
*/

//Function A2: Search for Groups
async function searchGroups(searchStringRaw) {
    const connection = db.getConnection(); 
    let searchString = "%" + searchStringRaw.trim() + "%";

    console.log("searchGroups - searchString: " + searchString);

    var searchGroupsOutcome = {
        success: false,
        groupsArray: [],
        errors: []
    }

	return new Promise(async function(resolve, reject) {
        try {
            const queryString = "SELECT group_id, group_type, created_by, group_name, group_image, group_private, group_deleted, updated, created FROM shareshare.groups WHERE LOWER(group_name) LIKE LOWER(?) AND group_deleted = 0";
            console.log("searchGroups - queryString: " + queryString);
            console.log("searchGroups - searchString param: " + searchString);
            
            connection.query(queryString, [searchString], (err, rows) => {
                console.log("searchGroups - query executed");
                console.log("searchGroups - err: " + (err ? err.toString() : "null"));
                console.log("searchGroups - rows length: " + (rows ? rows.length : "null"));
                
                var groupsArray = []
             
                if (rows && rows.length > 0) {
                    for (let i = 0; i < rows.length; i++) {
                        let currentGroup = {
                            group_id: rows[i].group_id,
                            group_type: rows[i].group_type,
                            created_by: rows[i].created_by,
                            group_name: rows[i].group_name,
                            group_image: rows[i].group_image,
                            group_private: rows[i].group_private,
                            group_deleted: rows[i].group_deleted,
                            updated: rows[i].updated,
                            created: rows[i].created
                        }

                        groupsArray.push(currentGroup)
                    }
                }

                if (!err) {
                    searchGroupsOutcome.success = true;
                    searchGroupsOutcome.groupsArray = groupsArray
                    console.log("searchGroups - success, found " + groupsArray.length + " groups");
                    resolve(searchGroupsOutcome); 

                } else {
                    console.log("searchGroups - error: " + err);
                    searchGroupsOutcome.errors.push(err);
                    resolve(searchGroupsOutcome);
                }
            })
        } catch(err) {
            console.log("searchGroups - catch error: " + err);
            searchGroupsOutcome.errors.push(err);
            reject(searchGroupsOutcome);
        } 
    })

}

module.exports = { searchActiveFriendList, getProductInfoFromURL, searchGroups };
