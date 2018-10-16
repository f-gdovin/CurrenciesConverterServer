-- Deploy tables
\i '/docker-entrypoint-initdb.d/tables/usage.sql'
\i '/docker-entrypoint-initdb.d/tables/rank.sql'
\i '/docker-entrypoint-initdb.d/seed/seed.sql'