-- Announcements and Lost & Found Database Tables
-- This script creates the necessary tables for persistent announcements and lost & found functionality

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    target_audience JSON NOT NULL,
    campus VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    attachments JSON DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    requires_acknowledgment BOOLEAN DEFAULT false,
    tags JSON DEFAULT '[]',
    is_pinned BOOLEAN DEFAULT false,
    likes INTEGER DEFAULT 0,
    reactions JSON DEFAULT '{}',
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    has_threads BOOLEAN DEFAULT false,
    poll JSON,
    rsvp JSON,
    event_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create urgent_broadcasts table
CREATE TABLE IF NOT EXISTS urgent_broadcasts (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    urgency_level VARCHAR(50) NOT NULL,
    broadcast_type VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS lost_found_items (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    custom_tags JSON DEFAULT '[]',
    photos JSON DEFAULT '[]',
    item_type VARCHAR(20) NOT NULL, -- 'lost' or 'found'
    location TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'expired'
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create announcement_threads table
CREATE TABLE IF NOT EXISTS announcement_threads (
    id VARCHAR(255) PRIMARY KEY,
    announcement_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    parent_id VARCHAR(255),
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    likes INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

-- Create user_likes table for tracking user likes
CREATE TABLE IF NOT EXISTS user_likes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    announcement_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

-- Create user_rsvps table for tracking user RSVPs
CREATE TABLE IF NOT EXISTS user_rsvps (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    announcement_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'going', 'maybe', 'not_going'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

-- Create user_poll_votes table for tracking poll votes
CREATE TABLE IF NOT EXISTS user_poll_votes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    announcement_id VARCHAR(255) NOT NULL,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, announcement_id)
);

-- Create campus_digests table for storing generated digests
CREATE TABLE IF NOT EXISTS campus_digests (
    id VARCHAR(255) PRIMARY KEY,
    period VARCHAR(20) NOT NULL, -- '24hours', 'weekly', 'monthly'
    period_start TIMESTAMP NOT NULL,
    summary TEXT NOT NULL,
    highlights JSON NOT NULL,
    upcoming_deadlines JSON NOT NULL,
    total_announcements INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT false,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    campus VARCHAR(100) NOT NULL,
    analytics JSON NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_campus ON announcements(campus);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);

CREATE INDEX IF NOT EXISTS idx_urgent_broadcasts_is_active ON urgent_broadcasts(is_active);
CREATE INDEX IF NOT EXISTS idx_urgent_broadcasts_created_at ON urgent_broadcasts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lost_found_items_status ON lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_category ON lost_found_items(category);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_item_type ON lost_found_items(item_type);
CREATE INDEX IF NOT EXISTS idx_lost_found_items_created_at ON lost_found_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcement_threads_announcement_id ON announcement_threads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_threads_parent_id ON announcement_threads(parent_id);
CREATE INDEX IF NOT EXISTS idx_announcement_threads_created_at ON announcement_threads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_announcement_id ON user_likes(announcement_id);

CREATE INDEX IF NOT EXISTS idx_user_rsvps_user_id ON user_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rsvps_announcement_id ON user_rsvps(announcement_id);

CREATE INDEX IF NOT EXISTS idx_user_poll_votes_user_id ON user_poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_poll_votes_announcement_id ON user_poll_votes(announcement_id);

CREATE INDEX IF NOT EXISTS idx_campus_digests_period ON campus_digests(period);
CREATE INDEX IF NOT EXISTS idx_campus_digests_campus ON campus_digests(campus);
CREATE INDEX IF NOT EXISTS idx_campus_digests_period_start ON campus_digests(period_start);
CREATE INDEX IF NOT EXISTS idx_campus_digests_generated_at ON campus_digests(generated_at DESC);

-- Create a function to update announcement likes count
CREATE OR REPLACE FUNCTION update_announcement_likes_count(announcement_id_param VARCHAR(255))
RETURNS void AS $$
BEGIN
    UPDATE announcements 
    SET likes = (
        SELECT COUNT(*) 
        FROM user_likes 
        WHERE announcement_id = announcement_id_param
    )
    WHERE id = announcement_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up expired announcements
CREATE OR REPLACE FUNCTION cleanup_expired_announcements()
RETURNS void AS $$
BEGIN
    UPDATE announcements 
    SET is_active = false 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
    
    UPDATE lost_found_items 
    SET status = 'expired' 
    WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP 
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;
