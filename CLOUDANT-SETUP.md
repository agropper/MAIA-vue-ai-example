# Cloudant Setup Guide (Lite Tier)

## Overview
This guide helps you configure MAIA to use IBM Cloudant (Lite tier) with legacy and IAM authentication.

## Cloudant Lite Tier Benefits
- **Free tier**: 1GB storage, 20 reads/sec, 10 writes/sec
- **Perfect for development**: Sufficient for testing and small production loads
- **CouchDB compatible**: Full compatibility with existing CouchDB code
- **Managed service**: Automatic backups, scaling, and monitoring

## Step 1: Create Cloudant Instance

### 1.1 IBM Cloud Account Setup
1. Go to [IBM Cloud](https://cloud.ibm.com/)
2. Create account or sign in
3. Navigate to **Catalog** → **Databases** → **Cloudant**

### 1.2 Create Cloudant Instance
1. Select **Cloudant** service
2. Choose **Lite** plan (free tier)
3. Set **Service name**: `maia-cloudant`
4. Select **Region**: Choose closest to your users
5. Click **Create**

### 1.3 Get Connection Details
1. Go to your Cloudant instance
2. Click **Service credentials**
3. Create new credential or use existing
4. Note down the connection details

## Step 2: Configure Authentication

### 2.1 Legacy Authentication (Recommended for MAIA)
```bash
# Environment variables for legacy auth
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats
```

### 2.2 IAM Authentication (Alternative)
```bash
# Environment variables for IAM auth
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_IAM_API_KEY=your-iam-api-key
CLOUDANT_DATABASE=maia_chats
```

## Step 3: Update MAIA Configuration

### 3.1 Environment Variables
Create or update your `.env` file:

```bash
# Cloudant Configuration (Legacy Auth)
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats

# Alternative: IAM Authentication
# CLOUDANT_URL=https://your-instance.cloudant.com
# CLOUDANT_IAM_API_KEY=your-iam-api-key
# CLOUDANT_DATABASE=maia_chats

# MAIA Configuration
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1

# Passkey Authentication
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
```

### 3.2 Test Connection
```bash
# Test Cloudant connection
npm run test-cloudant
```

## Step 4: Update CouchDB Client

The existing CouchDB client already supports Cloudant. Just update your environment variables:

```javascript
// src/utils/couchdb-client.js
// The client automatically detects Cloudant vs CouchDB
// based on the URL and authentication method
```

## Step 5: Data Migration

### 5.1 Local to Cloudant Migration
```bash
# Migrate from local CouchDB to Cloudant
npm run migrate-to-cloud
```

### 5.2 Verify Migration
```bash
# Check data in Cloudant
npm run validate-cloudant
```

## Step 6: DigitalOcean App Platform Configuration

### 6.1 App Platform Environment Variables
```yaml
# .do/app.yaml
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
```

## Step 7: Security Considerations

### 7.1 Network Security
- Cloudant Lite tier includes SSL/TLS encryption
- All connections are HTTPS
- No additional network security required

### 7.2 Authentication Security
- **Legacy Auth**: Username/password (simpler for development)
- **IAM Auth**: API key-based (more secure for production)

### 7.3 Data Security
- Automatic backups included
- Data encrypted at rest
- HIPAA compliance available (not included in Lite tier)

## Step 8: Monitoring and Management

### 8.1 Cloudant Dashboard
- Monitor usage in IBM Cloud console
- View database statistics
- Manage documents and design documents

### 8.2 Usage Limits (Lite Tier)
- **Storage**: 1GB
- **Reads**: 20/second
- **Writes**: 10/second
- **Indexes**: 3 per database

### 8.3 Upgrade Path
When you need more capacity:
1. **Standard Plan**: $0.25/GB/month
2. **Enterprise Plan**: Custom pricing
3. **Dedicated Plan**: Single-tenant deployment

## Troubleshooting

### Connection Issues
```bash
# Test connection
curl -u username:password https://your-instance.cloudant.com/_up

# Check authentication
curl -u username:password https://your-instance.cloudant.com/_session
```

### Rate Limiting
If you hit rate limits:
- Implement request throttling
- Use bulk operations
- Consider upgrading to Standard plan

### Data Migration Issues
```bash
# Check migration status
npm run validate-migration

# Retry failed migrations
npm run retry-migration
```

## Cost Estimation

### Lite Tier (Free)
- **Storage**: 1GB included
- **Requests**: 20 reads/sec, 10 writes/sec
- **Cost**: $0/month

### Estimated Usage for MAIA
- **Chat messages**: ~1KB per message
- **File uploads**: ~100KB per file
- **1GB storage**: ~1M chat messages or 10K files
- **Rate limits**: Sufficient for development and small production

## Next Steps

1. **Create Cloudant instance** following Step 1
2. **Update environment variables** in Step 3
3. **Test connection** using Step 4
4. **Migrate data** using Step 5
5. **Deploy to DigitalOcean** using Step 6
6. **Monitor usage** using Step 8

This setup gives you a production-ready CouchDB-compatible database with automatic scaling, backups, and monitoring - all for free with the Lite tier! 