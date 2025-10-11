-- Seed a few info posts
INSERT INTO info_posts (id, title, content) VALUES
  ('post_1', 'Welcome to Nexus Campus', 'Getting started guide'),
  ('post_2', 'Maintenance Window', 'Wi-Fi maintenance tonight');

-- Seed activity feed
INSERT INTO activity_feed (id, type, ref_id, audience) VALUES
  ('act_1', 'info', 'post_1', 'all'),
  ('act_2', 'info', 'post_2', 'all');


