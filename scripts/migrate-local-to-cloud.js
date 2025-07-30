#!/usr/bin/env node

import dotenv from 'dotenv'
import { CouchDBClient } from '../src/utils/couchdb-client.js'

// Load environment variables
dotenv.config()

const LOCAL_COUCHDB_CONFIG = {
  url: 'http://localhost:5984',
  username: 'maia_admin',
  password: 'MaiaSecure2024!',
  database: 'maia_chats'
}

const CLOUDANT_CONFIG = {
  url: process.env.CLOUDANT_URL,
  username: process.env.CLOUDANT_USERNAME,
  password: process.env.CLOUDANT_PASSWORD,
  database: process.env.CLOUDANT_DATABASE || 'maia_chats'
}

async function main() {
  console.log('🚀 MAIA Local to Cloud Migration')
  console.log('==================================')

  // Validate environment variables
  if (!CLOUDANT_CONFIG.url || !CLOUDANT_CONFIG.username || !CLOUDANT_CONFIG.password) {
    console.error('❌ Cloudant environment variables are required:')
    console.error('   CLOUDANT_URL')
    console.error('   CLOUDANT_USERNAME')
    console.error('   CLOUDANT_PASSWORD')
    process.exit(1)
  }

  try {
    // Initialize clients
    console.log('📡 Initializing database connections...')
    
    const localClient = new CouchDBClient(LOCAL_COUCHDB_CONFIG)
    const cloudClient = new CouchDBClient(CLOUDANT_CONFIG)

    // Test connections
    console.log('🔍 Testing local CouchDB connection...')
    const localConnected = await localClient.testConnection()
    if (!localConnected) {
      throw new Error('Failed to connect to local CouchDB')
    }

    console.log('🔍 Testing Cloudant connection...')
    const cloudConnected = await cloudClient.testConnection()
    if (!cloudConnected) {
      throw new Error('Failed to connect to Cloudant')
    }

    // Initialize cloud database
    console.log('📚 Initializing cloud database...')
    await cloudClient.initializeDatabase()

    // Get local data statistics
    console.log('📊 Analyzing local data...')
    const localChats = await localClient.getAllChats()
    const localFiles = await localClient.getAllFiles()
    
    console.log(`📊 Found ${localChats.length} chat documents`)
    console.log(`📊 Found ${localFiles.length} file documents`)

    // Migrate chat data
    if (localChats.length > 0) {
      console.log('\n📚 Migrating chat data...')
      const chatResult = await migrateData(localClient, cloudClient, localChats, 'chat')
      console.log(`✅ Chat migration: ${chatResult.successCount} successful, ${chatResult.errorCount} failed`)
    }

    // Migrate file data
    if (localFiles.length > 0) {
      console.log('\n📁 Migrating file data...')
      const fileResult = await migrateData(localClient, cloudClient, localFiles, 'file')
      console.log(`✅ File migration: ${fileResult.successCount} successful, ${fileResult.errorCount} failed`)
    }

    // Validate migration
    console.log('\n🔍 Validating migration...')
    await validateMigration(cloudClient)

    console.log('\n🎉 Migration completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Update your application to use Cloudant')
    console.log('2. Test the application with migrated data')
    console.log('3. Deploy to DigitalOcean App Platform')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

async function migrateData(sourceClient, targetClient, documents, type) {
  let successCount = 0
  let errorCount = 0

  for (const doc of documents) {
    try {
      // Clean document for cloud storage
      const cleanDoc = { ...doc }
      delete cleanDoc._rev // Remove revision to create new document

      // Save to cloud
      if (type === 'chat') {
        await targetClient.saveChat(cleanDoc)
      } else if (type === 'file') {
        await targetClient.saveFile(cleanDoc)
      }

      successCount++
      console.log(`✅ Migrated ${type}: ${doc._id}`)

    } catch (error) {
      errorCount++
      console.error(`❌ Failed to migrate ${type} ${doc._id}:`, error.message)
    }
  }

  return { successCount, errorCount }
}

async function validateMigration(cloudClient) {
  try {
    // Get cloud data statistics
    const cloudChats = await cloudClient.getAllChats()
    const cloudFiles = await cloudClient.getAllFiles()
    
    console.log(`📊 Cloud chat documents: ${cloudChats.length}`)
    console.log(`📊 Cloud file documents: ${cloudFiles.length}`)

    // Health check
    const health = await cloudClient.healthCheck()
    console.log(`📊 Cloud database health: ${health.status}`)
    
    if (health.status === 'healthy') {
      console.log(`📊 Document count: ${health.documentCount}`)
      console.log(`📊 Data size: ${(health.dataSize / 1024 / 1024).toFixed(2)} MB`)
      console.log(`📊 Disk size: ${(health.diskSize / 1024 / 1024).toFixed(2)} MB`)
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    throw error
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
const command = args[0]

if (command === 'validate') {
  // Only run validation
  const cloudClient = new CouchDBClient(CLOUDANT_CONFIG)
  validateMigration(cloudClient)
    .then(() => {
      console.log('✅ Validation complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error)
      process.exit(1)
    })
} else if (command === 'backup') {
  // Create backup of local data
  const localClient = new CouchDBClient(LOCAL_COUCHDB_CONFIG)
  localClient.createBackup()
    .then((backup) => {
      const fs = require('fs')
      const backupFile = `backup-${new Date().toISOString().split('T')[0]}.json`
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))
      console.log(`✅ Backup created: ${backupFile}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error)
      process.exit(1)
    })
} else if (command === 'restore') {
  // Restore from backup file
  const backupFile = args[1]
  if (!backupFile) {
    console.error('❌ Backup file path required')
    process.exit(1)
  }
  
  const fs = require('fs')
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
  const cloudClient = new CouchDBClient(CLOUDANT_CONFIG)
  
  cloudClient.restoreBackup(backup)
    .then((results) => {
      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length
      console.log(`✅ Restore complete: ${successCount} successful, ${errorCount} failed`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Restore failed:', error)
      process.exit(1)
    })
} else if (command === 'help' || args.length === 0) {
  console.log('MAIA Local to Cloud Migration')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/migrate-local-to-cloud.js          # Run full migration')
  console.log('  node scripts/migrate-local-to-cloud.js validate # Validate cloud data')
  console.log('  node scripts/migrate-local-to-cloud.js backup   # Create local backup')
  console.log('  node scripts/migrate-local-to-cloud.js restore <file> # Restore from backup')
  console.log('  node scripts/migrate-local-to-cloud.js help     # Show this help')
  console.log('')
  console.log('Environment Variables:')
  console.log('  CLOUDANT_URL - Cloudant instance URL')
  console.log('  CLOUDANT_USERNAME - Cloudant username')
  console.log('  CLOUDANT_PASSWORD - Cloudant password')
  console.log('  CLOUDANT_DATABASE - Cloudant database name (default: maia_chats)')
} else {
  console.error(`❌ Unknown command: ${command}`)
  console.log('Run "node scripts/migrate-local-to-cloud.js help" for usage information')
  process.exit(1)
}

// Run main migration if no command specified
if (args.length === 0) {
  main()
} 