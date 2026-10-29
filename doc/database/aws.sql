USE shareshare;


SELECT * FROM posts;
#SELECT * FROM user_profile;

#SELECT * FROM shareshare.groups;


/*
#SELECT * FROM todo;
#SELECT * FROM cloudpilot_instructions;



SELECT * FROM cloudpilot_requests;

SELECT * FROM cloudpilot_instructions;
SELECT * FROM messages;

        

SELECT * FROM user_profile;
*/

#DELETE FROM messages WHERE message_id > 10;
#DELETE FROM messages WHERE message_id > 10;
#DELETE FROM cloudpilot_requests WHERE id > 70;
#SELECT * FROM messages;
#DELETE FROM posts WHERE post_id = 836;
#SELECT * FROM posts WHERE master_site = "wishlist";


#SELECT * FROM user_preference;
#SHOW CREATE TABLE user_preference;

#SELECT * FROM cloudpilot_actions;
#SELECT * FROM cloudpilot_history;
#SELECT * FROM cloudpilot_history;


#SELECT * FROM posts WHERE post_id = 832;
#SELECT * FROM comments WHERE post_id = 832;


#########
#GROUPS#
#########
#SELECT * FROM shareshare.groups;


-- Add post_id after group_id
#ALTER TABLE group_purchases
#ADD COLUMN post_id INT UNSIGNED NOT NULL DEFAULT 0 AFTER group_id;

-- Rename product_purchased to item_id
#ALTER TABLE group_purchases
#CHANGE COLUMN product_purchased item_id INT UNSIGNED NOT NULL;
#SELECT * FROM item_purchases;

#SELECT * FROM group_users  WHERE group_id = 723;
#SELECT * FROM user_profile




#SELECT * FROM shareshare.groups WHERE group_id = 723; 
/*
#SELECT * FROM item_purchases WHERE item_id = 39;
#SELECT * FROM items;
#DELETE FROM group_purchases WHERE group_purchases_id >0;
#UPDATE items SET purchased = 0 WHERE item_id > 0

#SELECT * FROM shareshare.groups;
#DELETE FROM shareshare.groups WHERE group_id >72;
#SELECT * FROM shareshare.groups WHERE group_id = 70;

SELECT * FROM group_users;
#DELETE FROM group_users WHERE primary_id > 1520;

#SELECT * FROM group_users WHERE user_name = "davey";
#SELECT * FROM group_users WHERE group_id = 70;


#########
#NOTIFICATIONS#
#########
#SELECT * FROM notifications;

#########
#FRIENDS#
#########
#SELECT * FROM friends;
#SELECT * FROM pending_requests;
#SELECT * FROM notifications;

#DELETE FROM FRIENDS WHERE friends_id > 0;
#DELETE FROM pending_requests WHERE request_id > 0;
#DELETE FROM notifications WHERE notification_id > 0;

#SELECT * FROM friends WHERE user_name = "davey"
#UPDATE friends SET request_pending = 0 WHERE friends_id > 0


#SELECT * FROM friends WHERE user_name = 'davey'
#SELECT * FROM friends
#SELECT * FROM friends WHERE request_pending = 1 AND sent_by = "davey" AND sent_to = "frodo"
#SELECT * FROM user_profile
#SELECT * FROM user_login

#DELETE FROM friends WHERE friends_id > 0
#DELETE FROM pending_requests WHERE request_id > 0
#SELECT * FROM pending_requests 
#SELECT * FROM friends
#SELECT * FROM user_profile
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey" AND sent_to = "merry" AND request_type = "friend_request";		
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "david" AND sent_to = "merry" AND request_type = "friend_request";           


#########
#FOLLOW#
#########
#SELECT * FROM user_profile
#SELECT * FROM following
#SELECT * FROM notifications

#DELETE FROM notifications WHERE notification_id > 0
#DELETE FROM following WHERE follow_id > 1;


#########
#POSTS#
#########
#SELECT * FROM posts;

#DELETE FROM posts WHERE post_id > 724;
#DELETE FROM notifications WHERE notification_id > 0


#ALTER TABLE `posts` CHANGE `file_name` `file_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'empty'; 
#ALTER TABLE `posts` CHANGE `post_status` `post_status` INT(11) NOT NULL DEFAULT '1'; 





#SELECT * FROM shareshare.groups;

#########
#USER PROFILE#
#########
#ALTER TABLE `user_profile` CHANGE `storage_location` `storage_location` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'storage_location'; 
#ALTER TABLE user_profile CHANGE COLUMN storage_location storage_location VARCHAR(255) AFTER biography;
#ALTER TABLE user_profile CHANGE COLUMN cloud_bucket cloud_bucket VARCHAR(255) AFTER storage_location;
#ALTER TABLE user_profile CHANGE COLUMN cloud_key cloud_key VARCHAR(255) AFTER cloud_bucket;
#ALTER TABLE user_profile CHANGE COLUMN storage_location storage_location VARCHAR(255) AFTER biography;

#ALTER TABLE user_profile ADD COLUMN storage_location VARCHAR(255) AFTER biography;
#ALTER TABLE user_profile ADD COLUMN cloud_bucket VARCHAR(255) AFTER storage_location;  
#ALTER TABLE user_profile ADD COLUMN file_name_server VARCHAR(255) AFTER file_name;  
#ALTER TABLE user_profile MODIFY storage_location VARCHAR(255) DEFAULT 'storage_location';

#UPDATE user_profile SET first_name = 'Merry' WHERE user_profile_id = 6;
#UPDATE user_profile SET last_name = 'Brandybuck' WHERE user_profile_id = 5;
#SELECT * FROM user_profile;

#DELETE FROM user_profile WHERE user_profile_id = 4;



#DELETE FROM refresh_tokens WHERE token_id = 514;

#SELECT * FROM posts WHERE group_id = 70 AND post_status = 1 ORDER BY post_id DESC LIMIT ? OFFSET ?
#ADD COLUMN device_id VARCHAR(255) NOT NULL DEFAULT 'device_id' AFTER refresh_token;

#ALTER TABLE `user_profile` CHANGE `cloud_bucket` `cloud_bucket` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'cloud_bucket'; 
#ALTER TABLE `user_profile` CHANGE `cloud_key` `cloud_key` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'cloud_key'; 
#ALTER TABLE `user_profile` CHANGE `image_url` `image_url` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'image_url'; 
#ALTER TABLE `user_profile` CHANGE `file_name` `file_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'file_name'; 
#ALTER TABLE `user_profile` CHANGE `file_name_server` `file_name_server` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'file_name_server'; 



#########
#COMMENTS#
#########
#SELECT * FROM comment_likes

#DELETE FROM comments WHERE comment_id > 215;
#DELETE FROM comments WHERE comment_id > 230;
#DELETE FROM comments WHERE comment_id = 230;
#SELECT * FROM comments

#SELECT * FROM comment_likes;
#SELECT * FROM posts;
#SET SQL_SAFE_UPDATES = 0; DELETE FROM comment_likes; SET SQL_SAFE_UPDATES = 1;
#SELECT * FROM posts WHERE group_id = 72;
#DELETE FROM posts WHERE post_id = 7;


/*
CREATE TABLE group_purchases (
    group_purchases_id INT NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    product_purchased INT NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (group_purchases_id),

    INDEX idx_group_id (group_id),

    CONSTRAINT fk_group_purchases_group
        FOREIGN KEY (group_id)
        REFERENCES shareshare.groups(group_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
*/
