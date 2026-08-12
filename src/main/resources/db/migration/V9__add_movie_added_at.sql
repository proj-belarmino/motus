ALTER TABLE movie ADD COLUMN added_at TIMESTAMPTZ;

CREATE INDEX idx_movie_added_at ON movie (added_at DESC);