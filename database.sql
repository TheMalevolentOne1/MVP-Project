-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    uuid VARCHAR(36) PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    calendar_view VARCHAR(20) DEFAULT 'week',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

-- Insert default settings for existing users
INSERT INTO user_settings (uuid)
SELECT uuid FROM users
WHERE uuid NOT IN (SELECT uuid FROM user_settings);
