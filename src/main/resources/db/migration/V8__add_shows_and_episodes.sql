CREATE TABLE tv_show (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    original_title    TEXT,
    overview          TEXT,
    release_date      DATE,
    genres            JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating            DOUBLE PRECISION NOT NULL DEFAULT 0,
    cover_path        TEXT,
    status            TEXT,
    number_of_seasons INTEGER NOT NULL DEFAULT 0,
    tmdb_id           INTEGER UNIQUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE episode (
    id             TEXT PRIMARY KEY,
    show_id        TEXT NOT NULL REFERENCES tv_show(id) ON DELETE CASCADE,
    season_number  INTEGER NOT NULL DEFAULT 1,
    episode_number INTEGER NOT NULL DEFAULT 1,
    title          TEXT,
    overview       TEXT,
    release_date   DATE,
    file_path      TEXT NOT NULL UNIQUE,
    file_hash      TEXT,
    cover_path     TEXT,
    metadata       JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_episode_show_season_episode ON episode (show_id, season_number, episode_number);
CREATE INDEX idx_episode_show_created ON episode (show_id, created_at DESC);