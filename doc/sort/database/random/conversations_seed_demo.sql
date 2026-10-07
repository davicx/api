-- Demo thread for Kite ChatPage (group 70, conversation id 1 = "Sailing").
-- Run only if group 70 exists. Adjust ids if they collide with your data.

INSERT INTO `conversations` (
  `conversation_id`,
  `master_site`,
  `group_id`,
  `conversation_title`,
  `created_by`
) VALUES (
  1,
  'kite',
  70,
  'Sailing',
  'demo'
)
ON DUPLICATE KEY UPDATE
  `conversation_title` = VALUES(`conversation_title`),
  `group_id` = VALUES(`group_id`);
