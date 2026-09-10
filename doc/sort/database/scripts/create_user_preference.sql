-- =============================================================================
-- CREATE shareshare.user_preference
-- Profile "Clothing & Sizes" / Preferences (feature_profile.md Step 3)
-- =============================================================================
-- Usage:
--   mysql -u root -ppassword shareshare < api/doc/database/scripts/create_user_preference.sql
--
-- user_name charset/collation MUST match user_profile.user_name (often latin1)
-- or FK Error 3780 (incompatible columns) occurs.
-- =============================================================================

DROP TABLE IF EXISTS user_preference;

CREATE TABLE user_preference (
    user_preference_id INT NOT NULL AUTO_INCREMENT,
    user_name VARCHAR(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,

    preference_category VARCHAR(100) NOT NULL,
    preference_title VARCHAR(150) NULL,
    preference_description VARCHAR(500) NULL,

    display_order INT NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,

    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_preference_id),

    KEY idx_user_preference_user_active (user_name, active, display_order),

    CONSTRAINT fk_user_preference_user_name
        FOREIGN KEY (user_name)
        REFERENCES user_profile(user_name)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
