USE shareshare;

#UPDATE friends SET friend_user_name = "matt" WHERE sent_by = "matt"

#DELETE FROM friends WHERE request_pending = 1
#SELECT * FROM pending_requests 
#DELETE FROM notifications 
SELECT * FROM notifications 
#SELECT * FROM friends 
#SELECT * FROM friends WHERE user_name = "davey"
#DELETE FROM friends WHERE user_name = "davey"
#DELETE FROM posts WHERE group_id = 70 AND post_id < 470

#SELECT * FROM posts WHERE post_id = 534;
#SELECT * FROM posts;
#SELECT * FROM comments;
#DELETE FROM posts

#GROUPS
#SELECT * FROM shareshare.groups;
#DELETE FROM shareshare.groups WHERE group_id > 100
#UPDATE shareshare.groups SET group_id = 72 WHERE group_id = 531

#SELECT * FROM group_users;
#UPDATE group_users SET active_member = 1
#UPDATE group_users SET group_id = 72 WHERE primary_id = 1511 
#DELETE FROM group_users WHERE primary_id > 1513

#USERS
#SELECT * FROM user_profile WHERE user_name = "davey";


#SELECT * FROM user_profile WHERE user_name LIKE "f%";

#FRIENDS
#SELECT friends.user_name, friends.friend_user_name,  friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name 
#FROM user_profile 
#INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
#WHERE friends.user_name = "davey" AND friends.request_pending = 0 AND friends.friend_user_name LIKE "s%" ;


#SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = "davey" AND friends.request_pending = 0



#SELECT * FROM friends WHERE user_name = "davey" AND friend_user_name LIKE "fro%";
#SELECT * FROM friends WHERE user_name = "davey" AND friend_user_name LIKE "fro%";
#UPDATE friends SET request_pending = 0 

#SELECT * FROM shareshare.groups 
#DELETE FROM shareshare.groups WHERE group_id > 100
#SELECT * FROM group_users
#DELETE FROM group_users WHERE group_id > 100


#POSTS
#SELECT * FROM posts WHERE group_id = 70;

#SELECT * FROM posts WHERE group_id = 70
#SELECT @@global.time_zone
#SELECT NOW()

#DELETE FROM posts WHERE post_id > 100

#UPDATE group_users SET active_member = 1
#UPDATE friends SET request_pending = 0 
#SELECT * FROM friends WHERE user_name = "davey"


#DELETE FROM friends WHERE user_name = "bilbo" AND friend_user_name = "bilbo" 

#SELECT * FROM friends 
#SELECT * FROM notifications 
#SELECT * FROM pending_requests
 
#DELETE FROM friends
#DELETE FROM pending_requests
#DELETE FROM notifications

#SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1

#SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users 
#INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1

/*
SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name AS friend_user_name, user_profile.image_name AS friend_image_name, user_profile.account_active, user_profile.first_name, user_profile.last_name, user_profile.biography 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to 
WHERE friends.request_pending = 1 AND (friends.sent_by = ?) AND (friends.user_name != ?) AND user_profile.account_active = 1

SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to 
WHERE friends.request_pending = 1 AND (friends.sent_to = ?) AND (friends.user_name != ?)AND user_profile.account_active = 1"
*/

#UPDATE user_profile SET image_name = "sarah.jpg" WHERE user_name = "sarah"

#SELECT * FROM user_profile


/*
SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography 
FROM user_profile 
INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE user_profile.account_active = 1 
*/
#SELECT * FROM notifications WHERE notification_type = "friend_request" AND notification_from = "sam" AND notification_to = "davey" AND notification_deleted = 0
#SELECT * FROM notifications 
#SELECT * FROM pending_requests 


#SELECT * FROM friends WHERE user_name = "davey"

#SELECT * FROM friends WHERE request_pending = 1 AND sent_by = "merry" AND sent_to = "davey"


#UPDATE friends SET request_pending = 0 WHERE user_name = "davey" AND sent_by = "merry"
#UPDATE friends SET request_pending = 0 WHERE user_name = "bilbo"

#DELETE FROM notifications WHERE notification_type = "friend_request" AND notification_from = "davey" AND notification_to = "bilbo";
#DELETE FROM pending_email


#Get Friend Invites
/*
SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to 
WHERE friends.request_pending = 1 AND (friends.sent_to = "davey") AND (friends.user_name != "davey")AND user_profile.account_active = 1
*/
/*
DELETE FROM friends WHERE friends_id > 415;

GET Friend Requests
SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name 
AS friend_user_name, user_profile.image_name 
AS friend_image_name, user_profile.account_active 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to  
WHERE friends.request_pending = 1 AND (friends.sent_by = "davey") AND (friends.user_name != "davey") AND user_profile.account_active = 1
*/
/*
SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE friends.user_name = "davey" AND user_profile.account_active = 1 
*/

#UPDATE friends SET request_pending = 1 WHERE (user_name = "pippin" AND friend_user_name = "davey") OR (user_name = "davey" AND friend_user_name = "pippin") 
#DELETE FROM friends WHERE friends_id > 415;
/*
SELECT friends.user_name, friends.sent_by, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, 
user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name , user_profile.biography   
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE friends.user_name = "davey" AND user_profile.account_active = 1
*/
/*
SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE friends.user_name = "davey" AND user_profile.account_active = 1


UPDATE friends SET request_pending = 0 WHERE sent_by = "davey" AND sent_to = "sam"
 
SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE friends.user_name = "davey" AND user_profile.account_active = 1


SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
WHERE friends.user_name = "davey" AND user_profile.account_active = 1
*/
#SELECT * FROM notifications WHERE notification_from = "" AND notification_to = "" AND notification_type = "friend_request" 

#UPDATE notifications SET notification_seen = 1 WHERE notification_from = "" AND notification_to = "" AND notification_type = "friend_request" 

###########################
#### CLEAN: Clean Data #### 
###########################
#DELETE FROM notifications WHERE notification_id > 0;
#DELETE FROM pending_requests WHERE request_id > 0;
#DELETE FROM group_users WHERE group_id > 100;
#DELETE FROM shareshare.groups WHERE group_id > 100;

###########################
#### UPDATE: a Table #### 
###########################
#ALTER TABLE friends ADD sent_to varchar(256) NOT NULL DEFAULT "empty" AFTER sent_by
#ALTER TABLE friends ADD sent_by varchar(256) NOT NULL DEFAULT "empty" AFTER friend_id
#ALTER TABLE friends ADD sent_to varchar(256) NOT NULL DEFAULT "empty" AFTER friend_id
#ALTER TABLE friends DROP COLUMN sent_by;

###########################
#INNER JOIN  
###########################
/*
SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.image_name AS friend_image_name, user_profile.account_active 
FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to 
WHERE friends.request_pending = 1 AND (friends.sent_to = "davey") AND (friends.user_name != "davey")AND user_profile.account_active = 1
*/


#########################
#SORT 
#SELECT * FROM friends WHERE request_pending = 1 AND sent_by = "pippin" AND sent_to = "davey"
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "pippin" AND sent_to = "davey" AND request_type = "friend_request"
#SELECT * FROM friends WHERE request_pending = 1 AND sent_by = "pippin" AND sent_to = "davey" 

#UPDATE friends SET request_pending = 1 WHERE (user_name = "pippin" AND friend_user_name = "davey") OR (user_name = "davey" AND friend_user_name = "pippin") 

#friendsSELECT * FROM friends WHERE request_pending = 1 
#friendsSELECT * FROM friends WHERE request_pending = 1 
#friendsSELECT * FROM friends WHERE request_pending = 1 
#SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = "davey") AND (user_name != "davey" ) 
#SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = "davey") AND (user_name != "davey" ) 

#SELECT friends.sent_by, friends.sent_to, friends.user_name AS request_to_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name 


#SELECT friends.sent_by, friends.sent_to, friends.request_pending, user_profile.user_name AS friend_user_name, user_profile.image_name AS friend_image_name, user_profile.account_active
#FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.sent_to 
#WHERE friends.request_pending = 1 AND (friends.sent_by = "davey") AND (friends.user_name != "davey" ) AND user_profile.account_active = 1

#friends.user_name = ? AND friends.request_pending = 1 AND user_profile.account_active = 1
#SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = "davey") AND (user_name != "davey" ) 


#SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name 
#FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
#user_profile WHERE friends.user_name = ? AND friends.request_pending = 1 AND user_profile.account_active = 1



#REQUESTS: Get your pending friend requests 
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey" AND request_type = "friend_request"



/*
SELECT * FROM pending_requests
SELECT * FROM friends 
SELECT * FROM friends WHERE request_pending = 1 AND (sent_by = "davey") AND (user_name != "davey" ) 
SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey" AND request_type = "friend_request"

SELECT * FROM friends WHERE request_pending = 1 AND (user_name = "davey" AND friend_user_name = "merry") 
OR (user_name = "merry" AND friend_user_name = "davey") 

*/

#INVITES: Get your pending friend invites 
/*
SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_to = "davey" AND request_type = "friend_request"

SELECT * FROM friends WHERE request_pending = 1 AND (user_name = "davey" AND friend_user_name = "merry") 
OR (user_name = "merry" AND friend_user_name = "davey") 

SELECT * FROM friends WHERE request_pending = 1 AND (user_name = "davey" AND friend_user_name = "pippin") 
OR (user_name = "merry" AND friend_user_name = "davey") 

*/





#SELECT * FROM friends WHERE request_pending = 1 AND (user_name = "davey" OR friend_user_name = "davey")


#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_to = "davey"
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey"


#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey" AND sent_to = "merry" AND request_type = "friend_request"

#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey" AND sent_to = "merry" AND request_type = "friend_request"
#SELECT friends.user_name, friends.user_id, friends.friend_user_name, friends.friend_id, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name WHERE friends.user_name = " AND friends.request_pending = 1 AND user_profile.account_active = 1
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_to = "merry" AND sent_by = "davey"
#SELECT * FROM pending_requests WHERE request_is_pending = 1 AND sent_by = "davey"
#SELECT * FROM friends WHERE request_pending = 1 AND user_name = "davey"
#SELECT * FROM friends WHERE request_pending = 1 AND user_name = "davey" OR user_name = "merry" 


#UPDATE shareshare.groups SET group_id = 77 WHERE group_id = 423;



#UPDATE user_profile SET image_name = "merry.jpg" WHERE user_name =  "merry";
#UPDATE friends SET request_pending = 0;
#DELETE FROM friends
#DELETE FROM notifications
#DELETE FROM pending_requests
#SELECT * FROM user_profile WHERE account_active = 1;
#SELECT * FROM friends;
#SELECT * FROM notifications;
#SELECT * FROM pending_requests;
#SELECT * FROM user_profile;


            


## ADD NEW FRIEND ##
#INSERT INTO friends (user_name, user_id, friend_user_name, friend_id, request_pending, friend_key)
#VALUES ("davey", "1", "sam", "2", 1, "daveysam");

#INSERT INTO friends (user_name, user_id, friend_user_name, friend_id, request_pending, friend_key)
#VALUES ("sam", "2", "davey", "1", 1, "samdavey");  

#SELECT * FROM friends WHERE friends_ID > 350;


#UPDATE posts SET post_to = "davey" WHERE post_id = 371;


#DELETE FROM notifications
#DELETE FROM pending_requests

#SELECT * FROM shareshare.groups
#SELECT * FROM shareshare.groups

#SELECT user_name, user_id, account_deleted FROM user_login WHERE user_name = "davey";

/*
$result_friends = mysqli_query($conn,"SELECT friends.user_name, friends.friend_user_name, friends.friend_id, friends.request_pending, user_login.user_name, 
			user_login.user_id, user_login.account_deleted
			FROM user_login INNER JOIN friends
			ON user_login.user_name = friends.friend_user_name
			WHERE friends.user_name = '$userName'
			AND friends.request_pending = 0
			AND user_login.account_deleted = 0");
*/

#SELECT * FROM user_profile
#UPDATE user_login SET user_name = "Frodo" WHERE user_id = 40;

#SELECT * FROM notifications 
#SELECT * FROM pending_requests 

#SELECT * FROM notifications WHERE notification_to = "davey" AND notification_deleted = 0

#SELECT * FROM posts WHERE post_to = "davey" AND post_status = 1;

#DELETE FROM notifications WHERE notification_id > 0;
#DELETE FROM posts WHERE post_id > 350


#UPDATE posts SET post_caption = "update!" WHERE post_id = 450; 350 70
#UPDATE posts SET post_status = 0 WHERE post_id = 70;

#SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name FROM group_users INNER JOIN shareshare.groups ON group_users.group_id = shareshare.groups.group_id WHERE group_users.user_name = ? AND active_member = 1

#LOGIN
#DELETE FROM user_login WHERE user_id > 10;

#INSERT INTO `user_profile` (`user_profile_id`, `user_id`, `user_name`, `email`, `image_name`, `first_name`, `last_name`, `root_folder`, `biography`, `university`, `post_view`, `updated`, `created`) VALUES (185, 40, 'davey', 'davey@gmail.com', 'davey.png', 'davey', 'v', '', 'hiya!!', '', '', '2021-03-26 22:23:23', '2021-03-26 21:25:16');

#POSTS
#UPDATE posts SET post_to = 'davey', post_from = 'frodo', post_caption = 'Hi!! want to go on a hike!' WHERE post_id = 258;
#UPDATE posts SET group_id = 72 WHERE post_id = 260;

#SELECT * FROM posts WHERE group_id = 72 LIMIT 4 OFFSET 1 ORDER BY post_id DESC

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
#ALTER TABLE notifications ADD comment_id int(11) NOT NULL DEFAULT 0 AFTER post_id


#SELECT * FROM comments WHERE post_id = 70;

#SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name,  user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_id = 72
    
#UPDATE comment_likes SET liked_by_name = 'davey';
    
#SELECT * FROM comments;

#SELECT comment_from FROM comments WHERE comment_id = 1 AND comment_deleted = 0;

#DELETE FROM comment_likes;
#SELECT comment_likes.comment_like_id, comment_likes.comment_id, comment_likes.liked_by_name, comment_likes.updated, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM comment_likes INNER JOIN user_profile ON comment_likes.liked_by_name = user_profile.user_name WHERE comment_likes.comment_id = 2
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
#FRIENDS
###################################
/*
SELECT friends.user_name, friends.friend_user_name, friends.friend_id, friends.request_pending, user_login.user_name, 
		user_login.user_id, user_login.account_deleted
		FROM user_login INNER JOIN friends
		ON user_login.user_name = friends.friend_user_name
		WHERE friends.user_name = 'davey'
		AND friends.request_pending = 0
		AND user_login.account_deleted = 0
*/

###################################
#REQUESTS
###################################
#DELETE FROM pending_requests where request_id > 0;
#SELECT * FROM pending_requests;













