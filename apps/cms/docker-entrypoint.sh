#!/bin/sh
set -e

# Ensure the cms schema exists in Postgres before starting Payload
if [ -n "$DATABASE_URL" ]; then
  echo "Ensuring cms schema exists..."
  node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('CREATE SCHEMA IF NOT EXISTS cms')
      .then(() => { console.log('Schema cms ready'); pool.end(); })
      .catch(e => { console.log('Schema check failed (non-fatal):', e.message); pool.end(); });
  " 2>/dev/null || echo "Schema check skipped (pg not available as CJS)"
fi

echo "Starting Payload CMS..."
exec node apps/cms/server.js
