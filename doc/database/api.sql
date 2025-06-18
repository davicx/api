#USE shareshare;


#########
#GROUPS#
#########
#DELETE FROM shareshare.groups WHERE group_id >72;
SELECT * FROM shareshare.groups


#SELECT * FROM shareshare.groups WHERE group_id = 70;

#SELECT * FROM posts;

#SELECT * FROM shareshare.groups;
#SELECT * FROM group_users;
#DELETE FROM group_users WHERE primary_id > 1520;

#SELECT * FROM group_users WHERE user_name = "davey";
#SELECT * FROM group_users WHERE group_id = 70;


#DESCRIBE shareshare.groups;
#########
#FRIENDS#
#########
#SELECT * FROM friends WHERE user_name = "davey"
#UPDATE friends SET request_pending = 0 WHERE friends_id > 0
#DELETE FROM FRIENDS WHERE friends_id > 750

#SELECT * FROM friends WHERE user_name = 'davey'
#SELECT * FROM friends
#SELECT * FROM friends WHERE request_pending = 1 AND sent_by = "davey" AND sent_to = "frodo"
#SELECT * FROM user_profile
#SELECT * FROM user_login
#http://localhost:3003/kite-profile-us-west-two/profileImage-1748475444666-649191507-background_2.png
#http://localhost:3003/kite-profile-us-west-two/profileImage-1748475444666-649191507-background_2.png
#
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





