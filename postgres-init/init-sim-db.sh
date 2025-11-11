#!/bin/bash
set -e

# This script creates a new database and populates it with simulated data.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create a new database for our simulation data
    CREATE DATABASE simulation_db;
EOSQL

# Now, connect to the new database to create tables and insert data
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="simulation_db" <<-EOSQL
    -- Create a table for simulated sensor logs
    CREATE TABLE sensor_logs (
        id SERIAL PRIMARY KEY,
        device_name VARCHAR(50) NOT NULL,
        sensor_type VARCHAR(50) NOT NULL,
        reading REAL NOT NULL,
        status VARCHAR(20) NOT NULL, -- e.g., 'NORMAL', 'ERROR', 'CRITICAL'
        timestamp TIMESTAMPTZ NOT NULL
    );

    -- Insert a large amount of fake data
    -- This loop will create 2000 data points
    INSERT INTO sensor_logs (device_name, sensor_type, reading, status, timestamp)
    SELECT
        'router-' || (1 + floor(random() * 5))::int, -- 5 different routers
        CASE (floor(random() * 3))::int
            WHEN 0 THEN 'cpu_load'
            WHEN 1 THEN 'memory_usage'
            ELSE 'temperature'
        END,
        random() * 100, -- Reading between 0 and 100
        CASE
            WHEN random() < 0.05 THEN 'CRITICAL' -- 5% chance of a critical error
            WHEN random() < 0.15 THEN 'ERROR'    -- 10% chance of a normal error
            ELSE 'NORMAL'
        END,
        NOW() - (random() * 30 || ' days')::interval -- Data from the last 30 days
    FROM generate_series(1, 2000);
EOSQL