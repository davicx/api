-- group_purchases: Gift list purchase visibility
-- Tracks: who purchased, who the gift is for, and who can see the purchase status

-- Option A: Fresh table (drop if exists and recreate)
DROP TABLE IF EXISTS group_purchases;

CREATE TABLE group_purchases (
    group_purchases_id INT NOT NULL AUTO_INCREMENT,
    group_id INT NOT NULL,
    post_id INT UNSIGNED NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    purchased_by_username VARCHAR(255) NOT NULL,
    item_for_user_name VARCHAR(255) NOT NULL,
    visible_to_user_name VARCHAR(255) NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (group_purchases_id),
    INDEX idx_group_id (group_id),
    INDEX idx_item_id (item_id),
    INDEX idx_post_id (post_id),

    CONSTRAINT fk_group_purchases_group
        FOREIGN KEY (group_id)
        REFERENCES shareshare.groups(group_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- Option B: Migration from previous schema (product_purchased, no post_id)
-- ALTER TABLE group_purchases ADD COLUMN post_id INT UNSIGNED NOT NULL DEFAULT 0 AFTER group_id;
-- UPDATE group_purchases gp INNER JOIN items i ON gp.product_purchased = i.item_id SET gp.post_id = i.post_id;
-- ALTER TABLE group_purchases CHANGE COLUMN product_purchased item_id INT UNSIGNED NOT NULL;
