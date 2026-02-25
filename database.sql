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

-- Create user_settings table with font preferences
CREATE TABLE user_settings (
    uuid VARCHAR(36) PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    time_format VARCHAR(10) DEFAULT '12h',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    font_choice VARCHAR(100) DEFAULT 'Default',
    university_email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (uuid) REFERENCES users(uuid) ON DELETE CASCADE
);