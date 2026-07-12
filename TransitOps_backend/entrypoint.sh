#!/bin/bash
set -e

# Ensure PostgreSQL socket directory exists with proper permissions
echo "Setting up PostgreSQL socket directory..."
mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql

# Ensure PostgreSQL data directory exists and has correct permissions
mkdir -p /var/lib/postgresql/data
chown -R postgres:postgres /var/lib/postgresql/data
chmod 700 /var/lib/postgresql/data

# Initialize PostgreSQL database if the directory is empty
if [ ! -s "/var/lib/postgresql/data/PG_VERSION" ]; then
    echo "Initializing PostgreSQL database..."
    su - postgres -c "initdb -D /var/lib/postgresql/data"
    
    # Start temporary PostgreSQL server to run configuration SQL
    echo "Starting temporary PostgreSQL server for setup..."
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data -o '-p 5432' -w start"
    
    # Configure database and users
    echo "Configuring PostgreSQL users and database..."
    # Create the database if it doesn't exist
    su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname = 'transitops'\" | grep -q 1 || psql -c \"CREATE DATABASE transitops;\""
    
    # Set postgres user password to 'postgres'
    su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\""
    
    # Stop temporary PostgreSQL server
    echo "Stopping temporary PostgreSQL server..."
    su - postgres -c "pg_ctl -D /var/lib/postgresql/data -m fast -w stop"
fi

# Start PostgreSQL server in the background
echo "Starting PostgreSQL server..."
su - postgres -c "pg_ctl -D /var/lib/postgresql/data -o '-p 5432' -l /var/lib/postgresql/postgres.log start"

# Wait for PostgreSQL to start and accept connections
echo "Waiting for PostgreSQL to be ready on port 5432..."
until su - postgres -c "pg_isready -p 5432" > /dev/null 2>&1; do
    echo "PostgreSQL is starting..."
    sleep 1
done
echo "PostgreSQL is ready!"

# Configure environment variables so Spring Boot connects to localhost:5432
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/transitops
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres

# Start the Spring Boot Application
echo "Starting Spring Boot application..."
exec java -jar app.jar
