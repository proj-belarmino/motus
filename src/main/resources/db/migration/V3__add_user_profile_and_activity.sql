ALTER TABLE app_user ADD COLUMN avatar_path TEXT;

CREATE TABLE user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_activity_user_date ON user_activity (user_id, activity_date);
