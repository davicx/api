USE shareshare;

#LOGIN
#DELETE FROM user_login WHERE user_id > 10;

#INSERT INTO `user_profile` (`user_profile_id`, `user_id`, `user_name`, `email`, `image_name`, `first_name`, `last_name`, `root_folder`, `biography`, `university`, `post_view`, `updated`, `created`) VALUES (185, 40, 'davey', 'davey@gmail.com', 'davey.png', 'davey', 'v', '', 'hiya!!', '', '', '2021-03-26 22:23:23', '2021-03-26 21:25:16');

#POSTS
#UPDATE posts SET post_to = 'davey', post_from = 'frodo', post_caption = 'Hi!! want to go on a hike!' WHERE post_id = 258;
#UPDATE posts SET group_id = 72 WHERE post_id = 260;

#DELETE FROM posts where post_id > 260;
#SELECT * FROM posts WHERE group_id = 70;

#DELETE FROM post_likes WHERE post_id > 0;
#SELECT * FROM post_likes;
#DELETE FROM posts WHERE post_id > 100;
#UPDATE posts SET post_id = 70 WHERE post_id = 255;
#SELECT * FROM posts;

#COMMENTS
#INSERT INTO comments (post_id, comment, comment_from, comment_deleted) VALUES (5, "hiya!", "sam", 0); 

#ALTER TABLE comments ADD comment_type varchar(256) NOT NULL DEFAULT "post" AFTER comment

#SELECT * FROM comments WHERE post_id = 70;

#SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name,  user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_id = 72
    
#UPDATE comment_likes SET liked_by_name = 'davey';
    
SELECT * FROM comments;


#DELETE FROM comment_likes;
SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comment_likes INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name WHERE comment_likes.comment_id = 2
#SELECT * FROM comment_likes;

#SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name 
#FROM comment_likes 
#INNER JOIN user_profile 
#ON comment_likes.liked_by_name = user_profile.user_name 
#WHERE comment_likes.comment_like_id = 27




#DELETE FROM refresh_tokens where token_id > 0;
#ALTER TABLE refresh_tokens
#ADD user_id int(11) NOT NULL DEFAULT 0


#SELECT comments.post_id, comments.comment, comments.comment_from, comments.created, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comments 
#INNER JOIN user_profile ON comments.comment_from = user_profile.user_name  WHERE comments.post_id = 70

#USERS

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













