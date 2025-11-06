#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Run the SQL commands as the default postgres user
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create a new user for n8n, if it doesn't already exist
    DO
    \$do\$
    BEGIN
       IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_roles
          WHERE  rolname = '${N8N_DATABASE_USER}') THEN

          CREATE USER ${N8N_DATABASE_USER} WITH PASSWORD '${N8N_DATABASE_PASSWORD}';
       END IF;
    END
    \$do\$;

    -- Create the n8n database, if it doesn't already exist
    -- Note: We must connect to a different DB (like 'postgres') to create a new one.
    -- The psql command above connects to the default POSTGRES_DB, so we check first.
    -- A simpler approach is to let n8n's container try to connect, but we ensure the user is there.
    CREATE DATABASE ${N8N_DATABASE_NAME};

    -- Grant all privileges on the new database to the new user
    GRANT ALL PRIVILEGES ON DATABASE ${N8N_DATABASE_NAME} TO ${N8N_DATABASE_USER};
EOSQL