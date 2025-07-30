# MAIA Migration to DigitalOcean with Passkey Authentication

## Overview
This document outlines the migration of MAIA from local Docker containers to DigitalOcean App Platform with secure passkey authentication.

## Current Architecture
- **MAIA Vue AI Example**: Vue.js + Express backend (Port 3001)
- **CouchDB**: Local database (Port 5984)
- **DigitalOcean GenAI**: Cloud AI agent and knowledge base
- **Security**: Development mode, no authentication

## Target Architecture
- **MAIA App**: DigitalOcean App Platform deployment
- **Database**: DigitalOcean Managed PostgreSQL
- **Authentication**: WebAuthn/FIDO2 passkeys
- **Security**: Production-grade with HTTPS, rate limiting, etc.

## Phase 1: Infrastructure Migration

### 1.1 Database Migration (CouchDB → PostgreSQL)

#### Current CouchDB Schema
```javascript
// Chat messages stored in CouchDB
{
  "_id": "chat_123",
  "_rev": "1-abc123",
  "patient_id": "demo_patient_001",
  "timestamp": "2024-01-01T00:00:00Z",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "role": "assistant", 
      "content": "Hi there!",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### PostgreSQL Schema
```sql
-- Users table for passkey authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Passkey credentials
CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  sign_count BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  patient_id VARCHAR(255) NOT NULL,
  title VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- File uploads
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size BIGINT,
  content_hash VARCHAR(64),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 DigitalOcean App Platform Configuration

#### app.yaml
```yaml
name: maia-app
services:
- name: maia-backend
  source_dir: /
  github:
    repo: your-username/maia-vue-ai-example
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}
  - key: SESSION_SECRET
    value: ${SESSION_SECRET}
  - key: DIGITALOCEAN_GENAI_ENDPOINT
    value: ${DIGITALOCEAN_GENAI_ENDPOINT}

databases:
- name: db
  engine: PG
  version: "15"
```

## Phase 2: Authentication Implementation

### 2.1 Passkey Authentication Flow

1. **Registration Process**
   - User enters username
   - Server generates challenge
   - Browser creates passkey
   - Server verifies and stores credential

2. **Login Process**
   - User clicks "Sign in with passkey"
   - Server generates challenge
   - Browser authenticates with passkey
   - Server verifies and creates session

### 2.2 Implementation Components

#### Backend Dependencies
```json
{
  "@simplewebauthn/server": "^8.3.4",
  "@simplewebauthn/browser": "^8.3.4",
  "express-session": "^1.17.3",
  "pg": "^8.11.3",
  "bcrypt": "^5.1.1",
  "uuid": "^9.0.1"
}
```

#### Frontend Dependencies
```json
{
  "@simplewebauthn/browser": "^8.3.4",
  "vue-router": "^4.4.3"
}
```

### 2.3 Security Middleware

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later'
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};
```

## Phase 3: Data Migration

### 3.1 Migration Scripts

#### CouchDB to PostgreSQL Migration
```javascript
// scripts/migrate-couchdb-to-postgres.js
import { Client } from 'pg';
import fetch from 'node-fetch';

async function migrateData() {
  // Connect to PostgreSQL
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await pgClient.connect();

  // Connect to CouchDB
  const couchAuth = Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');
  
  // Migrate chat data
  const response = await fetch(`${COUCHDB_URL}/maia_chats/_all_docs`, {
    headers: { 'Authorization': `Basic ${couchAuth}` }
  });
  
  const docs = await response.json();
  
  for (const doc of docs.rows) {
    const chatDoc = await fetch(`${COUCHDB_URL}/maia_chats/${doc.id}`, {
      headers: { 'Authorization': `Basic ${couchAuth}` }
    });
    
    const chat = await chatDoc.json();
    
    // Insert into PostgreSQL
    await pgClient.query(
      'INSERT INTO chat_sessions (id, patient_id, title, created_at) VALUES ($1, $2, $3, $4)',
      [chat._id, chat.patient_id, chat.title || 'Chat', new Date(chat.timestamp)]
    );
    
    // Insert messages
    for (const message of chat.messages) {
      await pgClient.query(
        'INSERT INTO chat_messages (session_id, role, content, timestamp) VALUES ($1, $2, $3, $4)',
        [chat._id, message.role, message.content, new Date(message.timestamp)]
      );
    }
  }
  
  await pgClient.end();
}
```

## Phase 4: Deployment Steps

### 4.1 Preparation
1. Create DigitalOcean account and API key
2. Set up GitHub repository for MAIA
3. Create DigitalOcean App Platform project
4. Provision managed PostgreSQL database

### 4.2 Code Changes Required
1. Replace CouchDB with PostgreSQL client
2. Implement passkey authentication
3. Add session management
4. Update environment variables
5. Add security middleware
6. Create database migration scripts

### 4.3 Deployment Commands
```bash
# 1. Set up DigitalOcean App Platform
doctl apps create --spec app.yaml

# 2. Set environment variables
doctl apps update maia-app --set-env-vars NODE_ENV=production

# 3. Deploy application
git push origin main

# 4. Run database migration
doctl apps run maia-app -- npm run migrate
```

## Phase 5: Security Hardening

### 5.1 Production Security Checklist
- [ ] HTTPS enforcement
- [ ] Security headers (HSTS, CSP, etc.)
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Session security
- [ ] Logging and monitoring
- [ ] Regular security updates

### 5.2 Environment Variables
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=your-super-secret-session-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Timeline

### Week 1: Infrastructure Setup
- Set up DigitalOcean App Platform
- Provision PostgreSQL database
- Create deployment pipeline

### Week 2: Authentication Implementation
- Implement passkey authentication
- Add session management
- Create login/registration UI

### Week 3: Data Migration
- Write migration scripts
- Test data migration
- Validate data integrity

### Week 4: Security & Testing
- Implement security measures
- Load testing
- Security testing
- Go-live preparation

## Cost Estimation

### DigitalOcean App Platform
- Basic App: $5/month
- Managed PostgreSQL: $15/month
- Total: ~$20/month

### Additional Services
- Domain name: $12/year
- SSL certificate: Free (Let's Encrypt)
- Monitoring: $5/month (optional)

**Total Estimated Cost: $25-30/month**

## Risk Mitigation

### Data Loss Prevention
- Automated backups (daily)
- Point-in-time recovery
- Data validation scripts
- Rollback procedures

### Security Risks
- Regular security audits
- Dependency vulnerability scanning
- Penetration testing
- Incident response plan

### Performance Risks
- Load testing before deployment
- Performance monitoring
- Auto-scaling configuration
- CDN for static assets

## Success Metrics

### Technical Metrics
- 99.9% uptime
- < 200ms response time
- Zero security incidents
- Successful data migration

### User Experience Metrics
- Passkey adoption rate
- Login success rate
- User satisfaction scores
- Support ticket reduction

## Next Steps

1. **Immediate Actions**
   - Review and approve this migration plan
   - Set up DigitalOcean account
   - Create development branch for migration

2. **Week 1 Tasks**
   - Set up DigitalOcean App Platform
   - Provision PostgreSQL database
   - Begin authentication implementation

3. **Ongoing**
   - Regular security reviews
   - Performance monitoring
   - User feedback collection
   - Continuous improvement 