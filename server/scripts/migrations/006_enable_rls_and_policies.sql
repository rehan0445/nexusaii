-- Enable RLS and add least-privilege policies (Supabase)

-- Announcements
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS announcements_select_read ON announcements;
CREATE POLICY announcements_select_read ON announcements
FOR SELECT USING (true);

DROP POLICY IF EXISTS announcements_write_server ON announcements;
CREATE POLICY announcements_write_server ON announcements
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Lost & found
ALTER TABLE IF EXISTS lost_found_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lost_found_select_read ON lost_found_items;
CREATE POLICY lost_found_select_read ON lost_found_items
FOR SELECT USING (true);

DROP POLICY IF EXISTS lost_found_write_server ON lost_found_items;
CREATE POLICY lost_found_write_server ON lost_found_items
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Darkroom
ALTER TABLE IF EXISTS darkroom_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS darkroom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS darkroom_room_users ENABLE ROW LEVEL SECURITY;

-- Hangout Rooms
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS room_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS darkroom_rooms_read ON darkroom_rooms;
CREATE POLICY darkroom_rooms_read ON darkroom_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS darkroom_rooms_write_server ON darkroom_rooms;
CREATE POLICY darkroom_rooms_write_server ON darkroom_rooms FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS darkroom_messages_read ON darkroom_messages;
CREATE POLICY darkroom_messages_read ON darkroom_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS darkroom_messages_write_server ON darkroom_messages;
CREATE POLICY darkroom_messages_write_server ON darkroom_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS darkroom_room_users_read ON darkroom_room_users;
CREATE POLICY darkroom_room_users_read ON darkroom_room_users FOR SELECT USING (true);
DROP POLICY IF EXISTS darkroom_room_users_write_server ON darkroom_room_users;
CREATE POLICY darkroom_room_users_write_server ON darkroom_room_users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Hangout Rooms Policies
DROP POLICY IF EXISTS rooms_read ON rooms;
CREATE POLICY rooms_read ON rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS rooms_write_server ON rooms;
CREATE POLICY rooms_write_server ON rooms FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS room_messages_read ON room_messages;
CREATE POLICY room_messages_read ON room_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS room_messages_write_server ON room_messages;
CREATE POLICY room_messages_write_server ON room_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS room_participants_read ON room_participants;
CREATE POLICY room_participants_read ON room_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS room_participants_write_server ON room_participants;
CREATE POLICY room_participants_write_server ON room_participants FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


