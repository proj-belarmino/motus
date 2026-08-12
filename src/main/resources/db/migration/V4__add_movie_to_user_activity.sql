ALTER TABLE user_activity ADD COLUMN movie_id TEXT REFERENCES movie(id) ON DELETE SET NULL;
CREATE INDEX idx_user_activity_recent_movies ON user_activity (user_id, movie_id, created_at DESC);
