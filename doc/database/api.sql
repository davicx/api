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
