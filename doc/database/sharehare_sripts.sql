USE shareshare;


#POSTS
#SELECT * FROM posts WHERE group_id = 72

#https://insta-app-bucket-tutorial.s3.us-west-2.amazonaws.com/images/postImage-1717890765111-678334753-stars.jpg?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEOj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCnvvaeI9VkWnMh36XLYetxFw0f7Ez%2FTzHjpTf7tKp4JwIhAP7cK%2BRHps1WOCMWB8zWJ%2BYvGLPuAeVLZBqAf4b%2BthveKu0CCLH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNTM0NzUzMzY5ODUwIgyj7HDjNZbgMbq1s%2FIqwQIn0fhtdbHWl730EvyVlCE91y09IJbWXQd0tkT1hV3cIsrKeUIUVMYQf0TuBUZE4dCaVNaUkPwr2ndsmOIlKGowdV892oflk4hXUc5fTGu%2F9yRu7cYPJ%2BSXyl96Bqda76yum6zUgPfGW9zCerCCA4Sj2EwTDbG8Ddmvef5g81TDdTNr6hTy5nxAho7t%2BQTGyw5efGe0xCUS08LFR0yduRRwNT9a8xn1ldAvAJM7wQzvp96eoV0FnNpjr4y%2FlT%2BYgwtx%2FN84WjqG7%2Far2mh38kt1FnaClVLB8GzvqJnuizlytfatm%2FJ3gJLz%2Fek3dAyllzivYr3O%2F0udoOwwRm9J9JFlHcQocmYXDc5ueLilbjRBAHW4Jrwd%2FG%2FG3rVFb2JgAGJhXsjuH7Cm98ArjQUiozXZ18H0Et9jx0M%2FA53qzxZhkhgw38nRtAY6sgLZwhUygafjns6cSe1FtxWRHnXK2PtVPK%2BTFR3GXYxJXAHAo1CCgInqjhYg%2BfvHlYhj1%2FlW1GAcSoiWl0p2Q1MSgnLWgjEqyTcZV8SedEj%2B5PC90Je4thhpvJ5%2FWFz%2FKhkoYhpTVuG4QPt97h6iNwp%2B6R3hno2d7UNfg6SVYQ8ptJoVHRdirNVXa2seaxdKHSy8dTmmmbRZWIkjqQZMIOUbquTs6qtR1kEwfGy2YZgIfjNvQ4stjomtYJAUi9KUUkNRKLtPBpi1gf%2FbcgD5jywuGRHQAe2JVf7A9vl0vlIMgKkAp4ISqQA0%2BGgrw7yqPkc6gNXc7BI5UfOIVinb%2F2OPFx6uV0pnboYxsioU6vlbx71w018b53Q3ahiqCvkS7pIJ6eGSk%2FH5GP%2Bcgp%2BtqNOVsT8%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240714T235431Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAXZAOI335CFFKXEFE%2F20240714%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Signature=d8ed14aafbff2252d6b545f28baa472173cbcc51715aa418808c61079b8b18da
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