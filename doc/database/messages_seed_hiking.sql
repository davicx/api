-- Sample messages for the "Hiking" conversation (group 70).
-- Resolves conversation_id from `conversations`; create that thread first if needed.
--
-- If you don't have Hiking yet:
--   INSERT INTO conversations (master_site, group_id, conversation_title, created_by)
--   VALUES ('kite', 70, 'Hiking', 'demo');

INSERT INTO `messages` (
  `master_site`,
  `message_type`,
  `group_id`,
  `conversation_id`,
  `message_seen`,
  `message_from`,
  `message_to`,
  `message_caption`
)
SELECT
  'kite',
  'text',
  70,
  c.conversation_id,
  0,
  'sam',
  'chat',
  'Anyone up for the Misty Mountains trail this weekend?'
FROM `conversations` c
WHERE c.group_id = 70 AND c.conversation_title = 'Hiking'
LIMIT 1;

INSERT INTO `messages` (
  `master_site`,
  `message_type`,
  `group_id`,
  `conversation_id`,
  `message_seen`,
  `message_from`,
  `message_to`,
  `message_caption`
)
SELECT
  'kite',
  'text',
  70,
  c.conversation_id,
  0,
  'bilbo',
  'chat',
  'Second breakfast first — then I''m in.'
FROM `conversations` c
WHERE c.group_id = 70 AND c.conversation_title = 'Hiking'
LIMIT 1;

INSERT INTO `messages` (
  `master_site`,
  `message_type`,
  `group_id`,
  `conversation_id`,
  `message_seen`,
  `message_from`,
  `message_to`,
  `message_caption`
)
SELECT
  'kite',
  'text',
  70,
  c.conversation_id,
  0,
  'sam',
  'chat',
  'Perfect. I''ll bring the crampons.'
FROM `conversations` c
WHERE c.group_id = 70 AND c.conversation_title = 'Hiking'
LIMIT 1;
