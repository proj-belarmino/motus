CREATE TABLE movie (
    id             TEXT PRIMARY KEY,
    title          TEXT NOT NULL,
    original_title TEXT,
    file_path      TEXT NOT NULL UNIQUE,
    release_date   DATE,
    director       TEXT,
    genres         JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating         DOUBLE PRECISION NOT NULL DEFAULT 0,
    cover_path     TEXT,
    file_hash      TEXT,
    metadata       JSONB
);
