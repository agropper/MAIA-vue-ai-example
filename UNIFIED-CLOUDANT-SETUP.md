# Unified Cloudant Setup: Local + Cloud Development

## Overview
This setup uses Cloudant for both local development and cloud deployment, eliminating the need for data migration and ensuring consistency across environments.

## Benefits of Unified Cloudant Setup

✅ **No Data Migration**: Same database for local and cloud
✅ **Consistency**: Identical behavior across environments
✅ **Real-time Sync**: Changes appear everywhere immediately
✅ **Simplified Workflow**: One database to manage
✅ **NOSH3 Ready**: Maintains CouchDB compatibility

## Environment Configuration

### Step 1: Create Unified .env File

Create a `.env` file in `MAIA-vue-ai-example` directory:

```bash
# Cloudant Configuration (Used for both local and cloud)
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# MAIA Configuration
NODE_ENV=development
LOCAL_TESTING=true
SINGLE_PATIENT_MODE=true
PATIENT_ID=demo_patient_001

# DigitalOcean GenAI
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1

# Passkey Authentication (for cloud deployment)
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
SESSION_SECRET=your-super-secret-session-key
```

### Step 2: Update Docker Configuration

Update `docker-compose.maia-secure.yml` to use Cloudant instead of local CouchDB:

```yaml
version: '3.8'

services:
  # MAIA Vue AI Example (Unified Cloudant)
  maia-vue-ai-secure:
    build:
      context: ./MAIA-vue-ai-example
      dockerfile: Dockerfile.secure
    container_name: hieofone_maia_vue_ai_secure
    restart: always
    env_file:
      - ./MAIA-vue-ai-example/.env
    environment:
      - NODE_ENV=development
      - PORT=3001
      - LOCAL_TESTING=true
      - SINGLE_PATIENT_MODE=true
      - PATIENT_ID=demo_patient_001
      # Cloudant configuration (no local CouchDB needed)
      - CLOUDANT_URL=${CLOUDANT_URL}
      - CLOUDANT_USERNAME=${CLOUDANT_USERNAME}
      - CLOUDANT_PASSWORD=${CLOUDANT_PASSWORD}
      - CLOUDANT_DATABASE=${CLOUDANT_DATABASE}
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - ./MAIA-vue-ai-example/src:/app/src:ro
      - ./logs:/app/logs
    networks:
      - hieofone_network
    security_opt:
      - no-new-privileges:true
    read_only: false
    tmpfs:
      - /tmp
      - /var/tmp

networks:
  hieofone_network:
    driver: bridge

volumes:
  logs:
```

### Step 3: Update Server Configuration

The server will automatically use Cloudant when the environment variables are set:

```javascript
// server-secure.js automatically detects Cloudant vs CouchDB
// based on the CLOUDANT_URL environment variable
```

## Development Workflow

### Local Development with Cloudant
```bash
# Start local development (uses Cloudant)
cd MAIA-vue-ai-example
npm run dev

# Or use Docker (also uses Cloudant)
cd ..
docker-compose -f docker-compose.maia-secure.yml up -d
```

### Cloud Deployment
```bash
# Deploy to DigitalOcean (uses same Cloudant)
npm run workflow deploy-cloud
```

## Testing the Setup

### Step 1: Test Cloudant Connection
```bash
cd MAIA-vue-ai-example
npm run test-cloudant
```

### Step 2: Test Local Development
```bash
# Start local development
npm run dev

# Access at http://localhost:3001
# All data will be stored in Cloudant
```

### Step 3: Test Cloud Deployment
```bash
# Deploy to cloud
npm run workflow deploy-cloud

# Access at https://your-domain.com
# Same data as local development
```

## Data Flow

```
Local Development ←→ Cloudant ←→ Cloud Deployment
       ↑                    ↑                    ↑
   Same Data           Same Data           Same Data
```

## Environment Variables Priority

The system automatically chooses the database based on environment variables:

1. **Cloudant** (if `CLOUDANT_URL` is set)
2. **Local CouchDB** (if `COUCHDB_URL` is set)
3. **Default** (localhost:5984)

## Migration from Local CouchDB

If you have existing data in local CouchDB:

```bash
# One-time migration to Cloudant
npm run migrate-to-cloud

# After migration, remove local CouchDB dependency
```

## Benefits of This Approach

### For Development
- **Fast Iteration**: No data migration needed
- **Consistent Testing**: Same data in local and cloud
- **Real-time Updates**: Changes appear everywhere
- **Simplified Setup**: One database configuration

### For Production
- **Reliability**: Managed Cloudant service
- **Scalability**: Automatic scaling
- **Backups**: Built-in data protection
- **Monitoring**: IBM Cloud monitoring

### For NOSH3 Integration
- **CouchDB Compatible**: Full compatibility maintained
- **PouchDB Ready**: Works with offline sync
- **Future Proof**: Ready for NOSH3 integration

## Cost Considerations

### Cloudant Lite Tier (Free)
- **Storage**: 1GB (sufficient for development)
- **Requests**: 20 reads/sec, 10 writes/sec
- **Cost**: $0/month

### When to Upgrade
- **Storage**: > 1GB data
- **Requests**: > 20 reads/sec or 10 writes/sec
- **Features**: Need advanced features

## Troubleshooting

### Connection Issues
```bash
# Test connection
npm run test-cloudant

# Check environment variables
echo $CLOUDANT_URL
echo $CLOUDANT_USERNAME
echo $CLOUDANT_PASSWORD
```

### Rate Limiting
- **Lite Tier Limits**: 20 reads/sec, 10 writes/sec
- **Solution**: Implement request throttling
- **Upgrade**: Move to Standard plan when needed

### Data Consistency
- **Real-time**: Changes appear immediately
- **Offline**: PouchDB sync when implemented
- **Backup**: Automatic Cloudant backups

## Next Steps

1. **Test the connection**: `npm run test-cloudant`
2. **Start local development**: `npm run dev`
3. **Deploy to cloud**: `npm run workflow deploy-cloud`
4. **Monitor usage**: IBM Cloud console

This unified setup gives you the best of both worlds: fast local development with production-ready cloud deployment, all using the same reliable Cloudant database! 🚀 