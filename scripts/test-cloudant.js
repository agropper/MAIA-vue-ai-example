#!/usr/bin/env node

import dotenv from 'dotenv'
import { CouchDBClient } from '../src/utils/couchdb-client.js'

// Load environment variables
dotenv.config()

async function testCloudantConnection() {
  console.log('🔍 Testing Cloudant Connection')
  console.log('==============================')

  // Check environment variables
  const cloudantUrl = process.env.CLOUDANT_URL
  const cloudantUsername = process.env.CLOUDANT_USERNAME
  const cloudantPassword = process.env.CLOUDANT_PASSWORD
  const cloudantDatabase = process.env.CLOUDANT_DATABASE || 'maia_chats'

  console.log('📋 Environment Variables:')
  console.log(`  CLOUDANT_URL: ${cloudantUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`  CLOUDANT_USERNAME: ${cloudantUsername ? '✅ Set' : '❌ Missing'}`)
  console.log(`  CLOUDANT_PASSWORD: ${cloudantPassword ? '✅ Set' : '❌ Missing'}`)
  console.log(`  CLOUDANT_DATABASE: ${cloudantDatabase}`)

  if (!cloudantUrl || !cloudantUsername || !cloudantPassword) {
    console.error('\n❌ Missing required environment variables')
    console.log('Please set CLOUDANT_URL, CLOUDANT_USERNAME, and CLOUDANT_PASSWORD')
    process.exit(1)
  }

  try {
    // Create Cloudant client
    console.log('\n🔌 Creating Cloudant client...')
    const cloudantClient = new CouchDBClient({
      url: cloudantUrl,
      username: cloudantUsername,
      password: cloudantPassword,
      database: cloudantDatabase
    })

    // Test connection
    console.log('🌐 Testing connection...')
    const isConnected = await cloudantClient.testConnection()
    
    if (!isConnected) {
      throw new Error('Failed to connect to Cloudant')
    }

    console.log('✅ Connection successful!')

    // Initialize database
    console.log('\n🗄️  Initializing database...')
    await cloudantClient.initializeDatabase()

    // Test basic operations
    console.log('\n🧪 Testing basic operations...')

    // Test document creation
    const testDoc = {
      _id: `test_${Date.now()}`,
      type: 'test',
      message: 'Hello from MAIA!',
      timestamp: new Date().toISOString()
    }

    console.log('  📝 Creating test document...')
    const createResult = await cloudantClient.saveChat(testDoc)
    console.log(`  ✅ Document created: ${createResult.id}`)

    // Test document retrieval
    console.log('  📖 Retrieving test document...')
    const retrievedDoc = await cloudantClient.getChat(createResult.id)
    if (retrievedDoc) {
      console.log(`  ✅ Document retrieved: ${retrievedDoc.message}`)
    } else {
      throw new Error('Failed to retrieve document')
    }

    // Test document deletion
    console.log('  🗑️  Deleting test document...')
    await cloudantClient.deleteChat(createResult.id)
    console.log('  ✅ Test document deleted')

    // Health check
    console.log('\n🏥 Running health check...')
    const health = await cloudantClient.healthCheck()
    console.log('  📊 Health Status:', health.status)
    console.log('  📊 Database:', health.databaseName)
    console.log('  📊 Document Count:', health.documentCount)
    console.log('  📊 Data Size:', health.dataSize, 'bytes')

    console.log('\n🎉 All tests passed! Cloudant is ready for MAIA.')
    console.log('\nNext steps:')
    console.log('1. Run: npm run migrate-to-cloud')
    console.log('2. Deploy to DigitalOcean App Platform')
    console.log('3. Test the full application')

  } catch (error) {
    console.error('\n❌ Cloudant test failed:', error.message)
    
    if (error.message.includes('401')) {
      console.log('\n💡 Authentication failed. Check your username and password.')
    } else if (error.message.includes('404')) {
      console.log('\n💡 URL not found. Check your CLOUDANT_URL.')
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Network error. Check your internet connection and CLOUDANT_URL.')
    } else {
      console.log('\n💡 Check your Cloudant instance and credentials.')
    }
    
    process.exit(1)
  }
}

// Handle command line arguments
const args = process.argv.slice(2)
const command = args[0]

if (command === 'help' || args.length === 0) {
  console.log('Cloudant Connection Test')
  console.log('=======================')
  console.log('')
  console.log('Usage: node scripts/test-cloudant.js')
  console.log('')
  console.log('This script tests your Cloudant connection and basic operations.')
  console.log('')
  console.log('Required environment variables:')
  console.log('  CLOUDANT_URL - Your Cloudant instance URL')
  console.log('  CLOUDANT_USERNAME - Your Cloudant username')
  console.log('  CLOUDANT_PASSWORD - Your Cloudant password')
  console.log('  CLOUDANT_DATABASE - Database name (default: maia_chats)')
  console.log('')
  console.log('Example:')
  console.log('  CLOUDANT_URL=https://your-instance.cloudant.com')
  console.log('  CLOUDANT_USERNAME=your-username')
  console.log('  CLOUDANT_PASSWORD=your-password')
  console.log('  CLOUDANT_DATABASE=maia_chats')
} else {
  console.error(`❌ Unknown command: ${command}`)
  console.log('Run "node scripts/test-cloudant.js help" for usage information')
  process.exit(1)
}

// Run the test if no command specified
if (args.length === 0) {
  testCloudantConnection()
} 