CREATE TABLE todo (
    todo_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    organization_id VARCHAR(100) NOT NULL,
    project_id VARCHAR(100),

    group_id INT NULL,
    list_id INT NULL,

    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'open',
    stage VARCHAR(30) NOT NULL DEFAULT 'mvp',
    priority INT NOT NULL DEFAULT 2,

    display_order INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);
