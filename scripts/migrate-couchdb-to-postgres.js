#!/usr/bin/env node

import dotenv from 'dotenv'
import { Client } from 'pg'
import fetch from 'node-fetch'

// Load environment variables
dotenv.config()

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984'
const COUCHDB_USER = process.env.COUCHDB_USER || 'maia_admin'
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'MaiaSecure2024!'
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

// PostgreSQL client
let pgClient

// CouchDB authentication header
const couchAuthHeader = `Basic ${Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64')}`

async function initPostgreSQL() {
  try {
    pgClient = new Client({
      connectionString: DATABASE_URL
    })
    await pgClient.connect()
    console.log('✅ Connected to PostgreSQL')
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error)
    process.exit(1)
  }
}

async function createTables() {
  try {
    // Create chat_sessions table
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        patient_id VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create chat_messages table
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `)

    // Create file_uploads table
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        size BIGINT,
        content_hash VARCHAR(64),
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `)

    console.log('✅ Database tables created')
  } catch (error) {
    console.error('❌ Failed to create tables:', error)
    throw error
  }
}

async function migrateChatData() {
  try {
    console.log('📚 Migrating chat data from CouchDB...')

    // Get all documents from CouchDB
    const response = await fetch(`${COUCHDB_URL}/maia_chats/_all_docs?include_docs=true`, {
      headers: {
        'Authorization': couchAuthHeader
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch CouchDB documents: ${response.status}`)
    }

    const data = await response.json()
    const docs = data.rows.filter(row => !row.id.startsWith('_design/'))

    console.log(`📊 Found ${docs.length} chat documents to migrate`)

    let migratedCount = 0
    let errorCount = 0

    for (const row of docs) {
      try {
        const chatDoc = row.doc

        // Skip if no messages
        if (!chatDoc.messages || !Array.isArray(chatDoc.messages)) {
          console.log(`⚠️  Skipping document ${chatDoc._id} - no messages`)
          continue
        }

        // Create a default user for migrated data
        // In production, you'd want to map this to actual users
        const defaultUserResult = await pgClient.query(
          'SELECT id FROM users WHERE username = $1',
          ['migrated_user']
        )

        let userId
        if (defaultUserResult.rows.length === 0) {
          const userResult = await pgClient.query(
            'INSERT INTO users (username, display_name) VALUES ($1, $2) RETURNING id',
            ['migrated_user', 'Migrated User']
          )
          userId = userResult.rows[0].id
        } else {
          userId = defaultUserResult.rows[0].id
        }

        // Insert chat session
        const sessionResult = await pgClient.query(
          'INSERT INTO chat_sessions (id, user_id, patient_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [
            chatDoc._id,
            userId,
            chatDoc.patient_id || 'demo_patient_001',
            chatDoc.title || `Chat ${new Date(chatDoc.timestamp).toLocaleDateString()}`,
            new Date(chatDoc.timestamp),
            new Date(chatDoc.timestamp)
          ]
        )

        // Insert messages
        for (const message of chatDoc.messages) {
          await pgClient.query(
            'INSERT INTO chat_messages (session_id, role, content, timestamp) VALUES ($1, $2, $3, $4)',
            [
              sessionResult.rows[0].id,
              message.role,
              message.content,
              new Date(message.timestamp || chatDoc.timestamp)
            ]
          )
        }

        migratedCount++
        console.log(`✅ Migrated chat session: ${chatDoc._id}`)

      } catch (error) {
        errorCount++
        console.error(`❌ Failed to migrate document ${row.id}:`, error.message)
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`✅ Successfully migrated: ${migratedCount} chat sessions`)
    console.log(`❌ Failed migrations: ${errorCount}`)

  } catch (error) {
    console.error('❌ Failed to migrate chat data:', error)
    throw error
  }
}

async function migrateFileData() {
  try {
    console.log('📁 Migrating file data from CouchDB...')

    // Get all documents from CouchDB file database
    const response = await fetch(`${COUCHDB_URL}/maia_files/_all_docs?include_docs=true`, {
      headers: {
        'Authorization': couchAuthHeader
      }
    })

    if (!response.ok) {
      console.log('⚠️  No file database found, skipping file migration')
      return
    }

    const data = await response.json()
    const docs = data.rows.filter(row => !row.id.startsWith('_design/'))

    console.log(`📊 Found ${docs.length} file documents to migrate`)

    let migratedCount = 0
    let errorCount = 0

    for (const row of docs) {
      try {
        const fileDoc = row.doc

        // Create a default user for migrated data
        const defaultUserResult = await pgClient.query(
          'SELECT id FROM users WHERE username = $1',
          ['migrated_user']
        )

        let userId
        if (defaultUserResult.rows.length === 0) {
          const userResult = await pgClient.query(
            'INSERT INTO users (username, display_name) VALUES ($1, $2) RETURNING id',
            ['migrated_user', 'Migrated User']
          )
          userId = userResult.rows[0].id
        } else {
          userId = defaultUserResult.rows[0].id
        }

        // Insert file upload record
        await pgClient.query(
          'INSERT INTO file_uploads (user_id, filename, original_name, mime_type, size, content_hash, uploaded_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            userId,
            fileDoc.filename || fileDoc._id,
            fileDoc.original_name || fileDoc.filename || fileDoc._id,
            fileDoc.mime_type || 'application/octet-stream',
            fileDoc.size || 0,
            fileDoc.content_hash || null,
            new Date(fileDoc.uploaded_at || fileDoc.timestamp || Date.now())
          ]
        )

        migratedCount++
        console.log(`✅ Migrated file: ${fileDoc._id}`)

      } catch (error) {
        errorCount++
        console.error(`❌ Failed to migrate file ${row.id}:`, error.message)
      }
    }

    console.log(`\n📊 File Migration Summary:`)
    console.log(`✅ Successfully migrated: ${migratedCount} files`)
    console.log(`❌ Failed migrations: ${errorCount}`)

  } catch (error) {
    console.error('❌ Failed to migrate file data:', error)
    // Don't throw here as file migration is optional
  }
}

async function validateMigration() {
  try {
    console.log('🔍 Validating migration...')

    // Check chat sessions count
    const sessionCount = await pgClient.query('SELECT COUNT(*) FROM chat_sessions')
    console.log(`📊 Chat sessions in PostgreSQL: ${sessionCount.rows[0].count}`)

    // Check chat messages count
    const messageCount = await pgClient.query('SELECT COUNT(*) FROM chat_messages')
    console.log(`📊 Chat messages in PostgreSQL: ${messageCount.rows[0].count}`)

    // Check file uploads count
    const fileCount = await pgClient.query('SELECT COUNT(*) FROM file_uploads')
    console.log(`📊 File uploads in PostgreSQL: ${fileCount.rows[0].count}`)

    // Check users count
    const userCount = await pgClient.query('SELECT COUNT(*) FROM users')
    console.log(`📊 Users in PostgreSQL: ${userCount.rows[0].count}`)

    console.log('✅ Migration validation complete')

  } catch (error) {
    console.error('❌ Failed to validate migration:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 MAIA CouchDB to PostgreSQL Migration')
  console.log('========================================')

  try {
    // Initialize PostgreSQL connection
    await initPostgreSQL()

    // Create tables
    await createTables()

    // Migrate data
    await migrateChatData()
    await migrateFileData()

    // Validate migration
    await validateMigration()

    console.log('\n🎉 Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your application to use PostgreSQL')
    console.log('2. Test the application with migrated data')
    console.log('3. Remove CouchDB dependency when ready')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    if (pgClient) {
      await pgClient.end()
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
const command = args[0]

if (command === 'validate') {
  // Only run validation
  initPostgreSQL()
    .then(validateMigration)
    .then(() => {
      console.log('✅ Validation complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error)
      process.exit(1)
    })
} else if (command === 'help' || args.length === 0) {
  console.log('MAIA CouchDB to PostgreSQL Migration')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/migrate-couchdb-to-postgres.js          # Run full migration')
  console.log('  node scripts/migrate-couchdb-to-postgres.js validate # Validate existing migration')
  console.log('  node scripts/migrate-couchdb-to-postgres.js help     # Show this help')
  console.log('')
  console.log('Environment Variables:')
  console.log('  DATABASE_URL - PostgreSQL connection string')
  console.log('  COUCHDB_URL - CouchDB URL (default: http://localhost:5984)')
  console.log('  COUCHDB_USER - CouchDB username (default: maia_admin)')
  console.log('  COUCHDB_PASSWORD - CouchDB password (default: MaiaSecure2024!)')
} else {
  console.error(`❌ Unknown command: ${command}`)
  console.log('Run "node scripts/migrate-couchdb-to-postgres.js help" for usage information')
  process.exit(1)
}

// Run main migration if no command specified
if (args.length === 0) {
  main()
} 