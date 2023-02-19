#USE shareshare;
#DELETE FROM refresh_tokens where token_id > 0;
#ALTER TABLE refresh_tokens
#ADD user_id int(11) NOT NULL DEFAULT 0

#USERS
#SELECT * FROM user_login;

#REQUESTS
#SELECT * FROM pending_requests;

#GROUPS
/*
INSERT INTO `groups` (`group_id`, `group_type`, `created_by`, `group_name`, `group_image`, `group_key`, `group_private`, `group_deleted`, `updated`, `created`) VALUES
(70, 'kite', 'davey', 'music', 'the_shire.jpg', 'nokey', 1, 0, '2021-12-19 01:20:57', '2021-12-19 01:20:57'),
(72, 'kite', 'davey', 'music', 'the_shire.jpg', 'nokey', 1, 0, '2021-12-19 01:20:57', '2021-12-19 01:20:57'),
(74, 'kite', 'davey', 'music', 'the_shgroupsire.jpg', 'nokey', 1, 0, '2021-12-19 01:20:57', '2022-01-09 00:03:23');
*/
#SELECT * FROM shareshare.groups;

#SELECT * FROM shareshare.groups;

#DELETE FROM shareshare.groups where group_id > 100;
#SELECT * FROM shareshare.groups;


#INSERT INTO shareshare.groups (group_type, created_by, group_name, group_image, group_private)
#VALUES ("group_type", "created_by", "group_name", "group_image", 1); 


#TOKENS
#SELECT * FROM refresh_tokens;
#DELETE FROM refresh_tokens where token_id > 0;

#UPDATE posts SET post_to = 'davey', post_from = 'sam', post_caption = 'Hiya Davey!! The weather is perfect! wanna hike or we could garden!' WHERE post_id = 257;
#SELECT * FROM shareshare.groups;           
#SELECT group_id, user_name, active_member FROM group_users WHERE user_name = 'davey' AND active_member = 1;
#UPDATE group_users SET group_id = 72  WHERE primary_id = 1013;
#SELECT * FROM group_users;
#SELECT * FROM shareshare.groups;
#UPDATE shareshare.groups SET group_name = 'gardening' WHERE group_id = 72;

#POSTS
#UPDATE posts SET post_to = 'davey', post_from = 'frodo', post_caption = 'Hi!! want to go on a hike!' WHERE post_id = 258;
#UPDATE posts SET group_id = 72 WHERE post_id = 260;
#SELECT * FROM posts;

DELETE FROM posts where post_id > 260;
SELECT * FROM posts WHERE group_id = 70;


###################################
#GROUP USERS 
###################################
#SELECT * FROM group_users;


/*
SELECT group_users.user_name, group_users.active_member, user_login.user_name, user_login.account_deleted
FROM group_users INNER JOIN user_login
	ON group_users.user_name = user_login.user_name
	WHERE group_id = 70
	AND active_member = 1 
	AND account_deleted = 0;
    
SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name
FROM group_users INNER JOIN shareshare.groups
	ON group_users.group_id = shareshare.groups.group_id
	WHERE group_users.user_name = 'davey'
	AND active_member = 1 
*/

#SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = 'davey' AND active_member = 1 



###################################
#NOTIFICATIONS
###################################
#DELETE FROM notifications where notification_id > 0;
#SELECT * FROM notifications;

###################################
#REQUESTS
###################################
#DELETE FROM pending_requests where request_id > 0;
#SELECT * FROM pending_requests;













