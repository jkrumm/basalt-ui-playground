-- Idempotent Postgres provisioning for cbbi database
-- Run as superuser: psql -h localhost -U postgres -f scripts/setup-cbbi-db.sql
--
-- The Drizzle schema "basalt_ui_playground" is created by drizzle-kit migrate
-- (not here). The cbbi user needs CREATE on the database to create schemas.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cbbi') THEN
    CREATE USER cbbi WITH PASSWORD 'cbbi';
  END IF;
END
$$;

SELECT 'CREATE DATABASE cbbi OWNER cbbi'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cbbi')\gexec

-- ALL PRIVILEGES includes CONNECT, CREATE (needed for schema creation), and TEMPORARY
GRANT ALL PRIVILEGES ON DATABASE cbbi TO cbbi;
