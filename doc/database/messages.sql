-- Messages table for chat (separate from posts)
-- Fixes from draft: PRIMARY KEY, unclosed string, read_at semantics

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `message_id` int unsigned NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) DEFAULT 'kite',
  `message_type` varchar(255) DEFAULT 'text',
  `group_id` int NOT NULL DEFAULT 0,
  `conversation_id` int NOT NULL DEFAULT 0,
  `message_seen` int NOT NULL DEFAULT 0,
  `message_from` varchar(255) NOT NULL DEFAULT 'empty',
  `message_to` varchar(255) NOT NULL DEFAULT 'empty',
  `message_caption` text,
  `cloud_key` varchar(255) DEFAULT 'no_cloud_key',
  `cloud_bucket` varchar(255) DEFAULT 'no_cloud_bucket',
  `storage_type` varchar(255) DEFAULT 'local',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_conversation` (`conversation_id`),
  KEY `idx_group` (`group_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
