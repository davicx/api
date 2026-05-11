-- item_purchases: Gift list item purchase visibility
-- Tracks: who purchased, who the gift is for, and who can see the purchase status (per item)

-- Option A: Fresh table (drop if exists and recreate)
DROP TABLE IF EXISTS item_purchases;

CREATE TABLE item_purchases (
    item_purchase_id INT NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    purchased_by_username VARCHAR(255) NOT NULL,
    item_for_user_name VARCHAR(255) NOT NULL,
    visible_to_user_name VARCHAR(255) NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (item_purchase_id),
    INDEX idx_group_id (group_id),
    INDEX idx_item_id (item_id),
    INDEX idx_post_id (post_id),

    CONSTRAINT fk_item_purchases_group
        FOREIGN KEY (group_id)
        REFERENCES shareshare.groups(group_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- Option B: Migration from group_purchases
-- RENAME TABLE group_purchases TO item_purchases;
-- ALTER TABLE item_purchases CHANGE COLUMN group_purchases_id item_purchase_id INT NOT NULL AUTO_INCREMENT;
