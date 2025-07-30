# MAIA Development Workflow: Local ↔ Cloud

## Repository Structure Clarification

### MAIA-Local Repository
**Purpose**: Container orchestration and local development environment
- Docker Compose configurations
- Service coordination (MAIA, NOSH3, Trustee-Community)
- Local development setup scripts
- Environment configuration

### MAIA-vue-ai-example Repository
**Purpose**: The actual MAIA application code
- Vue.js frontend
- Express.js backend
- Business logic and features
- What gets deployed to cloud

## Development Workflow

### Phase 1: Local Development (Primary)
```bash
# Work on MAIA-vue-ai-example locally
cd MAIA-vue-ai-example

# Make changes to code
# Test locally with hot reload
npm run dev

# Commit changes to main branch
git add .
git commit -m "Add new feature X"
git push origin main
```

### Phase 2: Cloud Testing (Secondary)
```bash
# When ready to test in cloud
cd MAIA-vue-ai-example

# Switch to cloud-migration branch
git checkout cloud-migration

# Merge latest changes from main
git merge main

# Push to cloud-migration branch
git push origin cloud-migration

# Deploy to DigitalOcean App Platform
# (This will automatically deploy from cloud-migration branch)
```

### Phase 3: Production Deployment
```bash
# When cloud testing is successful
cd MAIA-vue-ai-example

# Merge cloud-migration back to main
git checkout main
git merge cloud-migration

# Push to main (this becomes production)
git push origin main
```

## Environment Configuration

### Local Development Environment
```bash
# MAIA-vue-ai-example/.env.local
NODE_ENV=development
LOCAL_TESTING=true
COUCHDB_URL=http://localhost:5984
COUCHDB_USER=maia_admin
COUCHDB_PASSWORD=MaiaSecure2024!
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1
```

### Cloud Environment
```bash
# DigitalOcean App Platform Environment Variables
NODE_ENV=production
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats
SESSION_SECRET=your-super-secret-session-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
```

## Branch Strategy

### Main Branch
- **Purpose**: Primary development branch
- **Environment**: Local development
- **Database**: Local CouchDB
- **Deployment**: Local Docker containers

### Cloud-Migration Branch
- **Purpose**: Cloud testing and deployment
- **Environment**: DigitalOcean App Platform
- **Database**: Cloudant (managed CouchDB)
- **Deployment**: DigitalOcean App Platform

## Development Commands

### Local Development
```bash
# Start local development
cd MAIA-vue-ai-example
npm run dev

# Or use Docker
cd ..
docker-compose -f docker-compose.maia-secure.yml up -d

# View logs
docker-compose -f docker-compose.maia-secure.yml logs -f maia-vue-ai-secure
```

### Cloud Deployment
```bash
# Deploy to cloud (from cloud-migration branch)
doctl apps create --spec .do/app.yaml

# Update environment variables
doctl apps update maia-app --set-env-vars NODE_ENV=production

# View cloud logs
doctl apps logs maia-app
```

## Database Strategy

### Local Development
- **Database**: Local CouchDB (via Docker)
- **Data**: Stored in `./couchdb_data`
- **Access**: http://localhost:5984

### Cloud Environment
- **Database**: Cloudant (IBM's managed CouchDB)
- **Data**: Stored in IBM Cloud
- **Access**: HTTPS endpoint

### Data Synchronization
```bash
# Migrate local data to cloud
npm run migrate-to-cloud

# Backup cloud data
npm run backup-cloud

# Restore data to local
npm run restore-local
```

## Feature Development Workflow

### 1. New Feature Development
```bash
# Start on main branch
git checkout main

# Create feature branch
git checkout -b feature/new-feature

# Develop and test locally
npm run dev

# Commit changes
git add .
git commit -m "Add new feature"

# Push feature branch
git push origin feature/new-feature
```

### 2. Local Testing
```bash
# Test locally with Docker
cd ..
docker-compose -f docker-compose.maia-secure.yml up -d

# Access at http://localhost:3001
```

### 3. Cloud Testing
```bash
# Merge to cloud-migration branch
git checkout cloud-migration
git merge feature/new-feature

# Push to cloud
git push origin cloud-migration

# Test in cloud environment
# Access at https://your-domain.com
```

### 4. Production Release
```bash
# Merge to main
git checkout main
git merge feature/new-feature

# Push to main
git push origin main

# Deploy to production
# (This would be a separate production environment)
```

## Environment Differences

### Local Environment
- **Fast Development**: Hot reload, instant feedback
- **Full Control**: Direct access to all services
- **Offline Capable**: Works without internet
- **Debugging**: Easy to debug and inspect

### Cloud Environment
- **Production-like**: Real-world conditions
- **Scalability**: Can handle more load
- **Security**: HTTPS, proper security headers
- **Monitoring**: Built-in logging and monitoring

## Migration Scripts

### Local to Cloud Migration
```bash
# scripts/migrate-local-to-cloud.js
# Migrates data from local CouchDB to Cloudant
npm run migrate-to-cloud
```

### Cloud to Local Migration
```bash
# scripts/migrate-cloud-to-local.js
# Migrates data from Cloudant to local CouchDB
npm run migrate-cloud-to-local
```

## Monitoring and Debugging

### Local Monitoring
```bash
# View local logs
docker-compose -f docker-compose.maia-secure.yml logs -f

# Access CouchDB
curl http://localhost:5984/_utils/

# Debug Vue.js
# Use browser dev tools
```

### Cloud Monitoring
```bash
# View cloud logs
doctl apps logs maia-app

# Monitor performance
doctl apps get maia-app

# Access Cloudant dashboard
# Via IBM Cloud console
```

## Best Practices

### 1. Development
- **Primary Development**: Always on main branch locally
- **Feature Branches**: Use for new features
- **Local Testing**: Test thoroughly before cloud deployment
- **Environment Variables**: Keep local and cloud configs separate

### 2. Deployment
- **Cloud Testing**: Use cloud-migration branch for testing
- **Production**: Deploy from main branch
- **Rollback**: Keep previous versions for rollback
- **Monitoring**: Monitor both environments

### 3. Data Management
- **Backup**: Regular backups of both environments
- **Migration**: Test data migrations thoroughly
- **Consistency**: Ensure data consistency between environments
- **Versioning**: Version your data schemas

## Troubleshooting

### Local Issues
```bash
# Reset local environment
docker-compose -f docker-compose.maia-secure.yml down -v
docker-compose -f docker-compose.maia-secure.yml up -d

# Clear node modules
cd MAIA-vue-ai-example
rm -rf node_modules
npm install
```

### Cloud Issues
```bash
# Restart cloud app
doctl apps restart maia-app

# Check cloud logs
doctl apps logs maia-app

# Rollback to previous version
doctl apps rollback maia-app
```

This workflow allows you to develop quickly locally while maintaining the ability to test in a production-like cloud environment when needed. 