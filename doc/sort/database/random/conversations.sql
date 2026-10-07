-- Conversations: one row per chat thread inside a group (a group can have many).
-- Apply after `groups` exists. Create this before adding a FK from `messages.conversation_id`.

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (
  `conversation_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) DEFAULT 'kite',
  `group_id` int NOT NULL,
  `conversation_title` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) NOT NULL DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  KEY `idx_conversations_group` (`group_id`),
  KEY `idx_conversations_created` (`created_at`),
  CONSTRAINT `fk_conversations_group`
    FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
