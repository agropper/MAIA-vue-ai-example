import { createCouchDBClient } from './src/utils/couchdb-client.js';

async function initializeUsersDatabase() {
  try {
    const couchDBClient = createCouchDBClient();
    
    console.log('🔧 Initializing maia_users database...');
    
    // Test connection
    await couchDBClient.testConnection();
    console.log('✅ Connected to Cloudant');
    
    // Create maia_users database if it doesn't exist
    try {
      await couchDBClient.createDatabase('maia_users');
      console.log('✅ Created maia_users database');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  maia_users database already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Users database initialization complete');
    
  } catch (error) {
    console.error('❌ Failed to initialize users database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeUsersDatabase(); 