-- Idempotent Postgres provisioning for cbbi database
-- Run as superuser: psql -h localhost -U postgres -f scripts/setup-cbbi-db.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cbbi') THEN
    CREATE USER cbbi WITH PASSWORD 'cbbi';
  END IF;
END
$$;

SELECT 'CREATE DATABASE cbbi OWNER cbbi'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cbbi')\gexec

GRANT ALL PRIVILEGES ON DATABASE cbbi TO cbbi;
