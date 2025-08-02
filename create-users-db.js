import { createCouchDBClient } from './src/utils/couchdb-client.js';

async function createUsersDatabase() {
  try {
    const couchDBClient = createCouchDBClient();
    
    console.log('🔧 Creating maia_users database...');
    
    // Test connection
    await couchDBClient.testConnection();
    console.log('✅ Connected to Cloudant');
    
    // Create maia_users database
    try {
      await couchDBClient.createDatabase('maia_users');
      console.log('✅ Created maia_users database successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  maia_users database already exists');
      } else {
        console.error('❌ Failed to create database:', error.message);
        throw error;
      }
    }
    
    console.log('✅ Users database setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup users database:', error);
    process.exit(1);
  }
}

// Run the setup
createUsersDatabase(); 