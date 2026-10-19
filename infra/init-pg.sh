#!/bin/sh
set -e

mkdir -p /var/lib/postgresql/data /run/postgresql
chown -R postgres:postgres /var/lib/postgresql /run/postgresql
chmod 777 /run/postgresql

if [ -z "$(ls -A "$PGDATA" 2>/dev/null)" ]; then
    echo "Initializing PostgreSQL database in $PGDATA..."
    su-exec postgres initdb -D "$PGDATA" --auth=trust
    echo "host all all all trust" >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses='*'" >> "$PGDATA/postgresql.conf"

    su-exec postgres pg_ctl -D "$PGDATA" -w start
    su-exec postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
    su-exec postgres createdb -O postgres bottlebazaar || true
    su-exec postgres pg_ctl -D "$PGDATA" -m fast -w stop
fi

echo "Starting PostgreSQL server..."
exec su-exec postgres postgres -D "$PGDATA"
