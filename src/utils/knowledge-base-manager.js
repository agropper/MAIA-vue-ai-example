import { createCouchDBClient } from './couchdb-client.js';

class KnowledgeBaseManager {
  constructor() {
    // Use the same client configuration as the main server
    this.couchDBClient = createCouchDBClient({
      url: process.env.CLOUDANT_URL || process.env.COUCHDB_URL || 'http://localhost:5984',
      username: process.env.CLOUDANT_USERNAME || process.env.COUCHDB_USER || 'maia_admin',
      password: process.env.CLOUDANT_PASSWORD || process.env.COUCHDB_PASSWORD || 'MaiaSecure2024!',
      database: 'maia_chats' // This will be overridden for specific operations
    });
    this.kbDatabase = 'maia_knowledge_bases';
    this.userKbDatabase = 'maia_user_knowledge_bases';
    this.initialized = false;
  }

  // Initialize KB databases
  async initialize() {
    try {
      // Create KB database if it doesn't exist
      await this.couchDBClient.createDatabase(this.kbDatabase);
      await this.couchDBClient.createDatabase(this.userKbDatabase);
      this.initialized = true;
      console.log('✅ Knowledge base databases initialized');
    } catch (error) {
      console.error('❌ Failed to initialize KB databases:', error);
      // Don't set initialized to true if there's an error
    }
  }

  // Get all available knowledge bases (placeholder - will be populated from DigitalOcean API)
  async getAvailableKnowledgeBases() {
    try {
      // For now, return an empty array - this will be populated from DigitalOcean API
      // In a real implementation, this would fetch from DigitalOcean GenAI API
      return [];
    } catch (error) {
      console.error('❌ Error fetching knowledge bases:', error);
      return [];
    }
  }

  // Get KB protection status from Cloudant
  async getKBProtectionStatus(kbId) {
    try {
      const doc = await this.couchDBClient.getDocument(this.kbDatabase, kbId);
      return {
        isProtected: doc.isProtected || false,
        owner: doc.owner || null,
        description: doc.description || '',
        created: doc.created || new Date().toISOString()
      };
    } catch (error) {
      // KB not found or not protected
      return {
        isProtected: false,
        owner: null,
        description: '',
        created: new Date().toISOString()
      };
    }
  }

  // Set KB protection with passkey
  async setKBProtection(kbId, kbName, owner, description = '') {
    try {
      const protectionDoc = {
        _id: kbId,
        kbName: kbName,
        isProtected: true,
        owner: owner,
        description: description,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };

      await this.couchDBClient.saveDocument(this.kbDatabase, protectionDoc);
      console.log(`🔒 KB ${kbName} (${kbId}) protected for user ${owner}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to set KB protection:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove KB protection
  async removeKBProtection(kbId, owner) {
    try {
      const doc = await this.couchDBClient.getDocument(this.kbDatabase, kbId);
      
      if (doc.owner !== owner) {
        throw new Error('Unauthorized: Only the owner can remove protection');
      }

      await this.couchDBClient.deleteDocument(this.kbDatabase, kbId);
      console.log(`🔓 KB ${kbId} protection removed by ${owner}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to remove KB protection:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user can access KB
  async canUserAccessKB(kbId, username) {
    try {
      const protection = await this.getKBProtectionStatus(kbId);
      
      if (!protection.isProtected) {
        return { canAccess: true, reason: 'Public KB' };
      }
      
      if (protection.owner === username) {
        return { canAccess: true, reason: 'Owner access' };
      }
      
      return { canAccess: false, reason: 'Protected KB - authentication required' };
    } catch (error) {
      console.error('❌ Error checking KB access:', error);
      return { canAccess: false, reason: 'Error checking access' };
    }
  }

  // Get user's protected KBs
  async getUserProtectedKBs(username) {
    try {
      const allDocs = await this.couchDBClient.getAllDocuments(this.kbDatabase);
      return allDocs.filter(doc => doc.owner === username);
    } catch (error) {
      console.error('❌ Error fetching user KBs:', error);
      return [];
    }
  }

  // Get all KBs with protection status
  async getAllKBsWithProtectionStatus() {
    try {
      // Get all KBs from Cloudant directly
      const protectedKBs = await this.couchDBClient.getAllDocuments(this.kbDatabase);
      
      // Filter out the test KB and return only the real DigitalOcean KBs
      const realKBs = protectedKBs.filter(kb => kb.source === 'digitalocean');
      
      return realKBs.map(kb => ({
        id: kb._id,
        name: kb.kbName,
        description: kb.description,
        isProtected: kb.isProtected || false,
        owner: kb.owner || null,
        created: kb.created,
        updated: kb.updated,
        region: kb.region
      }));
    } catch (error) {
      console.error('❌ Error fetching KBs with protection status:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  // Save user's KB access permissions
  async saveUserKBAccess(username, kbId, hasAccess) {
    try {
      const accessDoc = {
        _id: `${username}_${kbId}`,
        username: username,
        kbId: kbId,
        hasAccess: hasAccess,
        grantedAt: new Date().toISOString()
      };

      await this.couchDBClient.saveDocument(this.userKbDatabase, accessDoc);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save user KB access:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's KB access permissions
  async getUserKBAccess(username) {
    try {
      const allDocs = await this.couchDBClient.getAllDocuments(this.userKbDatabase);
      return allDocs.filter(doc => doc.username === username);
    } catch (error) {
      console.error('❌ Error fetching user KB access:', error);
      return [];
    }
  }
}

export default KnowledgeBaseManager; 