# Revised MAIA Migration to DigitalOcean with Passkey Authentication

## Overview
This document outlines the migration of MAIA from local Docker containers to DigitalOcean App Platform with secure passkey authentication, while preserving NOSH3 compatibility.

## Database Strategy Options

### Option A: Managed CouchDB (Recommended for NOSH3 compatibility)
**Pros:**
- Full compatibility with NOSH3 and PouchDB
- Maintains offline synchronization capabilities
- No data migration required
- Future-proof for NOSH3 integration

**Cons:**
- More expensive than PostgreSQL
- Limited managed CouchDB providers
- More complex setup

**Implementation:**
- Use Cloudant (IBM) or DigitalOcean Managed Database with CouchDB
- Keep existing CouchDB schema
- Minimal code changes required

### Option B: PostgreSQL with CouchDB Sync Layer
**Pros:**
- PostgreSQL is cheaper and more widely supported
- Better performance for MAIA's needs
- Can sync to CouchDB for NOSH3 compatibility

**Cons:**
- More complex architecture
- Requires data synchronization service
- Potential data consistency issues

**Implementation:**
- Use PostgreSQL for MAIA
- Create sync service to replicate to CouchDB
- Maintain dual database approach

### Option C: Hybrid Approach
**Pros:**
- Best of both worlds
- Immediate cloud deployment
- Future NOSH3 compatibility

**Cons:**
- Most complex setup
- Higher operational overhead

**Implementation:**
- PostgreSQL for MAIA's immediate needs
- CouchDB for NOSH3 when integrated
- Data synchronization between systems

## Recommended Approach: Option A (Managed CouchDB)

Given the importance of NOSH3 compatibility, we recommend **Option A** with the following implementation:

### 1.1 Cloudant Setup (IBM's Managed CouchDB)

#### Environment Variables
```bash
# Cloudant Configuration
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats

# Alternative: DigitalOcean Managed Database (if CouchDB is available)
COUCHDB_URL=https://your-db-cluster.ondigitalocean.com:25000
COUCHDB_USER=your-username
COUCHDB_PASSWORD=your-password
COUCHDB_DATABASE=maia_chats
```

#### Updated CouchDB Client
```javascript
// src/utils/couchdb-client.js
import nano from 'nano'

export class CouchDBClient {
  constructor() {
    const cloudantUrl = process.env.CLOUDANT_URL || process.env.COUCHDB_URL
    const username = process.env.CLOUDANT_USERNAME || process.env.COUCHDB_USER
    const password = process.env.CLOUDANT_PASSWORD || process.env.COUCHDB_PASSWORD
    
    this.db = nano(`${cloudantUrl}:${password}@${username}`)
    this.database = this.db.use(process.env.CLOUDANT_DATABASE || 'maia_chats')
  }

  async initializeDatabase() {
    try {
      await this.db.db.create(process.env.CLOUDANT_DATABASE || 'maia_chats')
      console.log('✅ Cloudant database created/connected')
    } catch (error) {
      if (error.statusCode === 412) {
        console.log('✅ Cloudant database already exists')
      } else {
        throw error
      }
    }
  }

  // Existing methods remain the same
  async saveChat(chatData) {
    return await this.database.insert(chatData)
  }

  async getChat(chatId) {
    return await this.database.get(chatId)
  }

  async getAllChats() {
    const result = await this.database.list({ include_docs: true })
    return result.rows.map(row => row.doc)
  }
}
```

### 1.2 DigitalOcean App Platform Configuration

#### app.yaml (CouchDB Version)
```yaml
name: maia-app
services:
- name: maia-backend
  source_dir: /
  github:
    repo: your-username/maia-vue-ai-example
    branch: cloud-migration
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: CLOUDANT_URL
    value: ${CLOUDANT_URL}
  - key: CLOUDANT_USERNAME
    value: ${CLOUDANT_USERNAME}
  - key: CLOUDANT_PASSWORD
    value: ${CLOUDANT_PASSWORD}
  - key: CLOUDANT_DATABASE
    value: maia_chats
  - key: SESSION_SECRET
    value: ${SESSION_SECRET}
  - key: DIGITALOCEAN_GENAI_ENDPOINT
    value: ${DIGITALOCEAN_GENAI_ENDPOINT}
  - key: RP_ID
    value: your-domain.com
  - key: ORIGIN
    value: https://your-domain.com

# No managed database needed - using Cloudant
```

## Phase 2: Authentication Implementation (Unchanged)

The passkey authentication implementation remains the same as in the original plan, but we'll use a separate PostgreSQL database just for authentication:

### 2.1 Authentication Database Schema
```sql
-- Separate PostgreSQL database for authentication only
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Environment Variables for Hybrid Approach
```bash
# Authentication Database (PostgreSQL)
AUTH_DATABASE_URL=postgresql://user:pass@host:port/auth_db

# Chat Data (Cloudant/CouchDB)
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats

# Session Management
SESSION_SECRET=your-super-secret-session-key
```

## Phase 3: Migration Strategy

### 3.1 Local to Cloud Migration
```javascript
// scripts/migrate-local-to-cloud.js
import { CouchDBClient } from '../src/utils/couchdb-client.js'
import fetch from 'node-fetch'

async function migrateToCloud() {
  // Connect to local CouchDB
  const localCouch = new CouchDBClient({
    url: 'http://localhost:5984',
    username: 'maia_admin',
    password: 'MaiaSecure2024!',
    database: 'maia_chats'
  })

  // Connect to Cloudant
  const cloudant = new CouchDBClient({
    url: process.env.CLOUDANT_URL,
    username: process.env.CLOUDANT_USERNAME,
    password: process.env.CLOUDANT_PASSWORD,
    database: process.env.CLOUDANT_DATABASE
  })

  // Migrate all documents
  const docs = await localCouch.getAllChats()
  
  for (const doc of docs) {
    try {
      await cloudant.saveChat(doc)
      console.log(`✅ Migrated: ${doc._id}`)
    } catch (error) {
      console.error(`❌ Failed to migrate: ${doc._id}`, error.message)
    }
  }
}
```

## Phase 4: Deployment Steps

### 4.1 Preparation
1. ✅ Create GitHub branch: `cloud-migration`
2. Set up Cloudant account (IBM Cloud)
3. Create DigitalOcean App Platform project
4. Configure environment variables

### 4.2 Code Changes Required
1. Update CouchDB client to support Cloudant
2. Implement passkey authentication (PostgreSQL for auth only)
3. Add session management
4. Update environment variables
5. Add security middleware
6. Create migration scripts

### 4.3 Deployment Commands
```bash
# 1. Push to cloud-migration branch
git add .
git commit -m "Add cloud migration with passkey auth"
git push origin cloud-migration

# 2. Set up DigitalOcean App Platform
doctl apps create --spec .do/app.yaml

# 3. Set environment variables
doctl apps update maia-app --set-env-vars NODE_ENV=production

# 4. Deploy application
git push origin cloud-migration

# 5. Run data migration
doctl apps run maia-app -- npm run migrate-to-cloud
```

## Cost Comparison

### Option A: Cloudant + PostgreSQL Auth
- Cloudant: $50-100/month (depending on usage)
- PostgreSQL (auth only): $15/month
- DigitalOcean App: $5/month
- **Total: $70-120/month**

### Option B: PostgreSQL + CouchDB Sync
- PostgreSQL: $15/month
- CouchDB (managed): $30-50/month
- Sync service: $10/month
- DigitalOcean App: $5/month
- **Total: $60-80/month**

### Option C: Hybrid
- PostgreSQL: $15/month
- CouchDB: $30-50/month
- DigitalOcean App: $5/month
- **Total: $50-70/month**

## Timeline

### Week 1: Infrastructure Setup
- Set up Cloudant account
- Create DigitalOcean App Platform project
- Configure environment variables
- Test CouchDB connectivity

### Week 2: Authentication Implementation
- Implement passkey authentication
- Add session management
- Create login/registration UI
- Test authentication flow

### Week 3: Data Migration
- Write migration scripts
- Test data migration
- Validate data integrity
- Performance testing

### Week 4: Security & Testing
- Implement security measures
- Load testing
- Security testing
- Go-live preparation

## Risk Mitigation

### Data Loss Prevention
- Automated backups (Cloudant provides this)
- Point-in-time recovery
- Data validation scripts
- Rollback procedures

### NOSH3 Compatibility
- Maintain CouchDB schema
- Test PouchDB synchronization
- Validate replication capabilities
- Document integration points

### Performance Risks
- Load testing before deployment
- Performance monitoring
- Auto-scaling configuration
- CDN for static assets

## Next Steps

1. **Immediate Actions**
   - ✅ Review and approve this revised migration plan
   - Set up Cloudant account
   - Configure DigitalOcean App Platform
   - Test CouchDB connectivity

2. **Week 1 Tasks**
   - Set up Cloudant database
   - Configure environment variables
   - Begin authentication implementation
   - Test data migration

3. **Ongoing**
   - Regular security reviews
   - Performance monitoring
   - User feedback collection
   - Continuous improvement

## Decision Points

1. **Database Choice**: Cloudant vs PostgreSQL
2. **Authentication Database**: Separate PostgreSQL vs integrated
3. **Migration Strategy**: Gradual vs complete
4. **NOSH3 Integration Timeline**: Immediate vs future

This revised plan maintains NOSH3 compatibility while providing a clear path to cloud deployment with secure authentication. 