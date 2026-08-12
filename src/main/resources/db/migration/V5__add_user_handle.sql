ALTER TABLE app_user ADD COLUMN handle TEXT;
UPDATE app_user SET handle = 'user_' || substring(id from 1 for 8) WHERE handle IS NULL;
ALTER TABLE app_user ALTER COLUMN handle SET NOT NULL;
CREATE UNIQUE INDEX idx_app_user_handle_lower ON app_user (lower(handle));
