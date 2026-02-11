CREATE DATABASE IF NOT EXISTS mvp_database; 
USE mvp_database;

CREATE TABLE users (
    uuid VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(10),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    uuid CHAR(36) NOT NULL,
    title VARCHAR(30) NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (uuid, title),
    CONSTRAINT fk_notes_user
        FOREIGN KEY (uuid)
        REFERENCES users(uuid)
        ON DELETE CASCADE
);

CREATE TABLE calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    start DATETIME NOT NULL,
    end_time DATETIME,
    location TEXT,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_events_user
        FOREIGN KEY (uuid)
        REFERENCES users(uuid)
        ON DELETE CASCADE
);

-- Create fonts table
CREATE TABLE IF NOT EXISTS fonts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    font_family VARCHAR(255) NOT NULL,
    category ENUM('serif', 'sans-serif', 'monospace', 'cursive', 'display') DEFAULT 'sans-serif',
    google_fonts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_settings table with font preferences
CREATE TABLE user_settings (
    uuid VARCHAR(36) PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    calendar_default_view VARCHAR(20) DEFAULT 'week',
    time_format VARCHAR(10) DEFAULT '12h',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    font_id INT DEFAULT 1,
    font_size VARCHAR(10) DEFAULT 'medium', -- 'small', 'medium', 'large'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uuid) REFERENCES users(uuid) ON DELETE CASCADE,
    FOREIGN KEY (font_id) REFERENCES fonts(id) ON DELETE SET NULL
);

-- Populate fonts table with common web-safe fonts if empty
INSERT INTO fonts (name, font_family, category, google_fonts)
SELECT * FROM (
    SELECT 'Arial' as font_name, 'Arial, sans-serif' as font_family, 'system' as font_type, TRUE as is_active
    UNION ALL SELECT 'Helvetica', 'Helvetica, Arial, sans-serif', 'system', TRUE
    UNION ALL SELECT 'Times New Roman', '"Times New Roman", Times, serif', 'system', TRUE
    UNION ALL SELECT 'Georgia', 'Georgia, serif', 'system', TRUE
    UNION ALL SELECT 'Courier New', '"Courier New", Courier, monospace', 'system', TRUE
    UNION ALL SELECT 'Verdana', 'Verdana, sans-serif', 'system', TRUE
    UNION ALL SELECT 'Roboto', 'Roboto, sans-serif', 'google', TRUE
    UNION ALL SELECT 'Open Sans', '"Open Sans", sans-serif', 'google', TRUE
    UNION ALL SELECT 'Lato', 'Lato, sans-serif', 'google', TRUE
    UNION ALL SELECT 'Montserrat', 'Montserrat, sans-serif', 'google', TRUE
) AS font_data
WHERE NOT EXISTS (SELECT 1 FROM fonts LIMIT 1);

-- Populate user_settings for existing users
INSERT INTO user_settings (uuid, font_id, font_size)
SELECT uuid, 1, 'medium' FROM users
WHERE uuid NOT IN (SELECT uuid FROM user_settings);

-- Update existing user_settings to add font preferences if columns were just added
UPDATE user_settings 
SET font_id = 1, font_size = 'medium' 
WHERE font_id IS NULL OR font_size IS NULL;