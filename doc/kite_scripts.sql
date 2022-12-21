USE shareshare;
#DELETE FROM refresh_tokens where token_id > 0;
#ALTER TABLE refresh_tokens
#ADD user_id int(11) NOT NULL DEFAULT 0
#SELECT * FROM group_users;
#UPDATE posts SET post_to = 'davey', post_from = 'sam', post_caption = 'Hiya Davey!! The weather is perfect! wanna hike or we could garden!' WHERE post_id = 257;
#UPDATE posts SET post_to = 'davey', post_from = 'frodo', post_caption = 'Hi!! want to go on a hike!' WHERE post_id = 258;

#SELECT * FROM posts;
#SELECT * FROM shareshare.groups;           
#SELECT group_id, user_name, active_member FROM group_users WHERE user_name = 'davey' AND active_member = 1;

SELECT group_users.group_id, group_users.user_name, group_users.active_member, shareshare.groups.group_name
FROM group_users INNER JOIN shareshare.groups
	ON group_users.group_id = shareshare.groups.group_id
	WHERE group_users.user_name = 'davey'
	AND active_member = 1 
