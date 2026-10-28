import pg from 'pg'

// Keep connection errors and URLs out of startup logs. Ponder uses PRIVATE_URL
// first as well. Production always receives its connection URL via the process.
const connectionString =
  process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL
if (!connectionString && process.env.NODE_ENV === 'production') {
  console.error('Production requires a database connection URL')
  process.exitCode = 1
} else if (connectionString) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
  })
  try {
    await client.connect()
    const {
      rows: [role],
    } = await client.query(`
      SELECT rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls
        OR EXISTS (SELECT FROM pg_auth_members WHERE member = r.oid)
        OR EXISTS (SELECT FROM pg_database WHERE datname = current_database() AND datdba = r.oid)
        AS privileged,
        has_database_privilege(current_user, current_database(), 'CONNECT') AND
        has_database_privilege(current_user, current_database(), 'CREATE') AS can_index
      FROM pg_roles r WHERE rolname = current_user
    `)
    if (!role || role.privileged || !role.can_index) {
      throw new Error('Unexpected database privileges')
    }
    console.log('Database role check passed')
  } catch {
    console.error(
      'Database role check failed: require a reachable, non-superuser indexing login with CONNECT and CREATE, no role memberships, and separate database ownership',
    )
    process.exitCode = 1
  } finally {
    await client.end().catch(() => {})
  }
}
