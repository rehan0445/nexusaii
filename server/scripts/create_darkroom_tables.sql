-- Dark Room Database Tables
-- This script creates the necessary tables for persistent Dark Room functionality

-- Create darkroom_rooms table
CREATE TABLE IF NOT EXISTS darkroom_rooms (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_count INTEGER DEFAULT 0,
    categories JSON,
    primary_category VARCHAR(100),
    icon_emoji VARCHAR(10) DEFAULT '💬',
    banner TEXT,
    tags JSON,
    is_active BOOLEAN DEFAULT true
);

-- Create darkroom_messages table
CREATE TABLE IF NOT EXISTS darkroom_messages (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES darkroom_rooms(id) ON DELETE CASCADE
);

-- Create darkroom_room_users table for tracking active users
CREATE TABLE IF NOT EXISTS darkroom_room_users (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    socket_id VARCHAR(255) NOT NULL,
    alias VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES darkroom_rooms(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_darkroom_messages_room_id ON darkroom_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_darkroom_messages_timestamp ON darkroom_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_darkroom_room_users_room_id ON darkroom_room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_darkroom_room_users_socket_id ON darkroom_room_users(socket_id);

-- Create a function to clean up old messages (keep only last 100 per room)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
    -- Delete old messages, keeping only the last 100 per room
    DELETE FROM darkroom_messages 
    WHERE id NOT IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY timestamp DESC) as rn
            FROM darkroom_messages
        ) ranked
        WHERE rn <= 100
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to update room user counts
CREATE OR REPLACE FUNCTION update_room_user_count(room_id_param VARCHAR(255))
RETURNS void AS $$
BEGIN
    UPDATE darkroom_rooms 
    SET user_count = (
        SELECT COUNT(*) 
        FROM darkroom_room_users 
        WHERE room_id = room_id_param
    )
    WHERE id = room_id_param;
END;
$$ LANGUAGE plpgsql;
