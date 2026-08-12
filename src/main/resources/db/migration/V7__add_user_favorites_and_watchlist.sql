CREATE TABLE user_favorite (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT        NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    movie_id   TEXT        NOT NULL REFERENCES movie(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_favorite UNIQUE (user_id, movie_id)
);

CREATE INDEX idx_user_favorite_user_created ON user_favorite (user_id, created_at DESC);

CREATE TABLE user_watchlist (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT        NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    movie_id   TEXT        NOT NULL REFERENCES movie(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_watchlist UNIQUE (user_id, movie_id)
);

CREATE INDEX idx_user_watchlist_user_created ON user_watchlist (user_id, created_at DESC);