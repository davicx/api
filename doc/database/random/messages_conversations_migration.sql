-- Optional changes to `messages` after `conversations` exists (if you use that table).
--
-- Error 1072: you used `group_conversation_id` in an index but the column is still
-- named `conversation_id`. Either run STEP 1 first, or use STEP 2b only.
--
-- ---------------------------------------------------------------------------
-- STEP 1 — Optional: rename `conversation_id` → `group_conversation_id` (when app/DB align):
-- ---------------------------------------------------------------------------
-- ALTER TABLE `messages`
--   CHANGE `conversation_id` `group_conversation_id` int NOT NULL DEFAULT 0;
--
-- ---------------------------------------------------------------------------
-- STEP 2a — Use AFTER STEP 1 (second column is `group_conversation_id`):
-- ---------------------------------------------------------------------------
-- ALTER TABLE `messages`
--   ADD KEY `lookup_messages_by_group_and_conversation` (`group_id`, `group_conversation_id`);
--
-- ---------------------------------------------------------------------------
-- STEP 2b — Use if you still have `conversation_id` (matches default messages.sql):
-- ---------------------------------------------------------------------------
ALTER TABLE `messages`
  ADD KEY `lookup_messages_by_group_and_conversation` (`group_id`, `conversation_id`);

-- ---------------------------------------------------------------------------
-- STEP 3 — Foreign key (optional; only after backfill / valid ids). Match your PK column names.
-- ---------------------------------------------------------------------------
-- ALTER TABLE `messages`
--   ADD CONSTRAINT `fk_messages_group_conversation`
--   FOREIGN KEY (`group_conversation_id`) REFERENCES `conversations` (`group_conversation_id`)
--   ON DELETE CASCADE;
