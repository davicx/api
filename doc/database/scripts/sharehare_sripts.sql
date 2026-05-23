USE shareshare;


#POSTS
#SELECT * FROM posts WHERE group_id = 72

#UPDATE posts SET created = "2021-12-18 T00:14:03.000Z" WHERE group_id = 72;
#UPDATE posts SET created = "2021-12-18 T00:14:03.000Z" WHERE post_id = 350;

#SELECT * FROM user_profile
#SELECT * FROM shareshare.groups
#DELETE FROM shareshare.posts WHERE post_id > 100

#SELECT friends.user_name, friends.friend_user_name, friends.request_pending, user_profile.user_name, user_profile.account_active, user_profile.image_name, user_profile.first_name, user_profile.last_name 
#FROM user_profile INNER JOIN friends ON user_profile.user_name = friends.friend_user_name 
#WHERE friends.user_name = "davey" AND friends.request_pending = 0 AND friends.friend_user_name LIKE "%fro"

#SELECT COUNT(*) AS likeCount FROM post_likes WHERE post_id = 72 AND liked_by_name = "davey"

#SELECT * from post_likes;
#SELECT * from posts;
#SELECT post_like_id from post_likes WHERE post_id = 72 AND liked_by_name = "merry"

SELECT * from posts;
#DELETE FROM posts WHERE post_id > 100

#SELECT * from user_profile;

#SELECT post_likes.post_like_id, post_likes.post_id, post_likes.liked_by_name, post_likes.time_stamp, user_profile.user_name, user_profile.image_name, user_profile.first_name, user_profile.last_name FROM post_likes INNER JOIN user_profile ON post_likes.liked_by_name = user_profile.user_name WHERE post_likes.post_like_id = 205



#UPDATE A TABLE
#ALTER TABLE posts ADD file_name varchar(255) DEFAULT "no_file_name";

#SELECT * FROM posts
#DELETE FROM posts WHERE post_id > 100
#UPDATE friends SET request_pending = 0 WHERE friends_id > 0

#SELECT * FROM group_users
#DELETE FROM group_users WHERE primary_id > 1400