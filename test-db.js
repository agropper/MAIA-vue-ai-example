import { CouchDBClient } from './src/utils/couchdb-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    const couchDBClient = new CouchDBClient();
    
    // Test connection
    await couchDBClient.testConnection();
    
    // Try to get all documents from maia_users
    try {
      const documents = await couchDBClient.getAllDocuments('maia_users');
      
      console.log('📋 Users in maia_users database:');
      if (documents.length === 0) {
        console.log('No users found in maia_users database');
      } else {
        documents.forEach((doc, index) => {
          console.log(`\n--- User ${index + 1} ---`);
          console.log('ID:', doc._id);
          console.log('Has credentialID:', !!doc.credentialID);
          console.log('Has credentialPublicKey:', !!doc.credentialPublicKey);
          console.log('Has counter:', !!doc.counter);
          console.log('Document:', JSON.stringify(doc, null, 2));
        });
      }
    } catch (error) {
      console.log('❌ Error accessing maia_users database:', error.message);
      console.log('This might mean the database doesn\'t exist yet');
    }
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  }
}

testDatabase(); 