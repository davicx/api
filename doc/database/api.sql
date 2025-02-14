#USE shareshare;

#ALTER TABLE `posts` CHANGE `file_name` `file_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'empty'; 
#ALTER TABLE `posts` CHANGE `post_status` `post_status` INT(11) NOT NULL DEFAULT '1'; 

#ALTER TABLE `user_profile` CHANGE `storage_location` `storage_location` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'storage_location'; 
#ALTER TABLE user_profile CHANGE COLUMN storage_location storage_location VARCHAR(255) AFTER biography;
#ALTER TABLE user_profile CHANGE COLUMN cloud_bucket cloud_bucket VARCHAR(255) AFTER storage_location;
#ALTER TABLE user_profile CHANGE COLUMN cloud_key cloud_key VARCHAR(255) AFTER cloud_bucket;
#ALTER TABLE user_profile CHANGE COLUMN storage_location storage_location VARCHAR(255) AFTER biography;

#ALTER TABLE user_profile ADD COLUMN storage_location VARCHAR(255) AFTER biography;
#ALTER TABLE user_profile ADD COLUMN cloud_bucket VARCHAR(255) AFTER storage_location;  
#ALTER TABLE user_profile ADD COLUMN file_name_server VARCHAR(255) AFTER file_name;  
#ALTER TABLE user_profile MODIFY storage_location VARCHAR(255) DEFAULT 'storage_location';

#SELECT * FROM user_profile;
#DELETE FROM refresh_tokens WHERE token_id = 514;
SELECT * FROM posts;

#ADD COLUMN device_id VARCHAR(255) NOT NULL DEFAULT 'device_id' AFTER refresh_token;

#ALTER TABLE `user_profile` CHANGE `cloud_bucket` `cloud_bucket` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'cloud_bucket'; 
#ALTER TABLE `user_profile` CHANGE `cloud_key` `cloud_key` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'cloud_key'; 
#ALTER TABLE `user_profile` CHANGE `image_url` `image_url` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'image_url'; 
#ALTER TABLE `user_profile` CHANGE `file_name` `file_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'file_name'; 
#ALTER TABLE `user_profile` CHANGE `file_name_server` `file_name_server` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT 'file_name_server'; 








