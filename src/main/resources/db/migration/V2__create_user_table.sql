CREATE TABLE app_user (
                          id            TEXT PRIMARY KEY,
                          email         TEXT NOT NULL UNIQUE,
                          name          TEXT NOT NULL,
                          password_hash TEXT NOT NULL,
                          role          TEXT NOT NULL
);