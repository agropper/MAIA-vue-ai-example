# Cloudant Quick Setup Checklist

## ✅ Step 1: Create Cloudant Instance
- [ ] Go to [IBM Cloud](https://cloud.ibm.com/)
- [ ] Navigate to **Catalog** → **Databases** → **Cloudant**
- [ ] Select **Lite** plan (free tier)
- [ ] Set **Service name**: `maia-cloudant`
- [ ] Choose **Region** (closest to your users)
- [ ] Click **Create**

## ✅ Step 2: Get Connection Details
- [ ] Go to your Cloudant instance
- [ ] Click **Service credentials**
- [ ] Create new credential or use existing
- [ ] Copy the connection details:
  - **URL**: `https://your-instance.cloudant.com`
  - **Username**: `your-username`
  - **Password**: `your-password`

## ✅ Step 3: Configure Environment Variables
Create or update your `.env` file:

```bash
# Cloudant Configuration
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats

# MAIA Configuration
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1

# Passkey Authentication
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
```

## ✅ Step 4: Test Connection
```bash
cd MAIA-vue-ai-example
npm run test-cloudant
```

## ✅ Step 5: Migrate Data (Optional)
```bash
# Migrate from local CouchDB to Cloudant
npm run migrate-to-cloud
```

## ✅ Step 6: Deploy to Cloud
```bash
# Deploy to DigitalOcean App Platform
npm run workflow deploy-cloud
```

## Troubleshooting

### Connection Issues
- **401 Error**: Check username/password
- **404 Error**: Check CLOUDANT_URL
- **Network Error**: Check internet connection

### Rate Limiting
- **Lite Tier Limits**: 20 reads/sec, 10 writes/sec
- **Solution**: Implement throttling or upgrade to Standard plan

### Data Migration Issues
- **Large Datasets**: Use bulk operations
- **Network Timeouts**: Increase timeout settings
- **Authentication**: Verify credentials

## Cost Breakdown

### Lite Tier (Free)
- **Storage**: 1GB
- **Reads**: 20/second
- **Writes**: 10/second
- **Cost**: $0/month

### Estimated MAIA Usage
- **Chat messages**: ~1KB each
- **1GB storage**: ~1M messages
- **Rate limits**: Sufficient for development

## Next Steps After Setup

1. **Test the connection**: `npm run test-cloudant`
2. **Migrate data**: `npm run migrate-to-cloud`
3. **Deploy to cloud**: `npm run workflow deploy-cloud`
4. **Monitor usage**: IBM Cloud console
5. **Scale up**: Upgrade to Standard plan when needed

## Support

- **IBM Cloud Documentation**: [Cloudant Docs](https://cloud.ibm.com/docs/Cloudant)
- **MAIA Migration Help**: Check `MIGRATION-PLAN.md`
- **Development Workflow**: Check `DEVELOPMENT-WORKFLOW.md`

Your Cloudant setup is ready for MAIA! 🚀 