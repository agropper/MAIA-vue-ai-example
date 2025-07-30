# Cloudant IAM Authentication Setup

## Your Cloudant Credentials

Based on your Cloudant instance "Cloudant-MAIA", here are the correct environment variables to use:

### Environment Variables for IAM Authentication

```bash
# Cloudant IAM Configuration
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# Alternative: Use the full URL with embedded credentials
# CLOUDANT_URL=https://apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia:21340f475d40052c304a36aac046df3a@101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
```

## Step 1: Update Your .env File

Create or update your `.env` file in the `MAIA-vue-ai-example` directory:

```bash
# Cloudant Configuration (IAM Authentication)
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# MAIA Configuration
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1

# Passkey Authentication
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
```

## Step 2: Test the Connection

```bash
cd MAIA-vue-ai-example
npm run test-cloudant
```

## Step 3: Update CouchDB Client for IAM

The existing CouchDB client should work with IAM authentication, but let's verify it handles the credentials correctly:

```javascript
// The client automatically detects IAM vs legacy auth
// based on the username format (apikey-v2-...)
const cloudantClient = new CouchDBClient({
  url: process.env.CLOUDANT_URL,
  username: process.env.CLOUDANT_USERNAME,
  password: process.env.CLOUDANT_PASSWORD,
  database: process.env.CLOUDANT_DATABASE
})
```

## Step 4: DigitalOcean App Platform Configuration

For deployment to DigitalOcean App Platform, use these environment variables:

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
    value: https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
  - key: CLOUDANT_USERNAME
    value: apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
  - key: CLOUDANT_PASSWORD
    value: 21340f475d40052c304a36aac046df3a
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

## IAM vs Legacy Authentication

### IAM Authentication (Your Setup)
- **More Secure**: API key-based authentication
- **Better for Production**: Recommended by IBM
- **Username Format**: `apikey-v2-...`
- **Password**: The API key secret

### Legacy Authentication (Alternative)
- **Simpler**: Username/password
- **Good for Development**: Easier to understand
- **Username Format**: Regular username
- **Password**: Regular password

## Security Benefits of IAM

✅ **API Key Rotation**: Can rotate keys without changing code
✅ **Fine-grained Permissions**: Can set specific permissions
✅ **Audit Trail**: Better logging and monitoring
✅ **Enterprise Ready**: Meets enterprise security requirements

## Testing Your Setup

1. **Test Connection**:
   ```bash
   npm run test-cloudant
   ```

2. **Migrate Data** (optional):
   ```bash
   npm run migrate-to-cloud
   ```

3. **Deploy to Cloud**:
   ```bash
   npm run workflow deploy-cloud
   ```

## Troubleshooting IAM Authentication

### Issue: "401 Unauthorized"
- Check that the API key is correct
- Verify the username starts with `apikey-v2-`
- Ensure the password is the API key secret

### Issue: "403 Forbidden"
- Check IAM permissions for the service
- Verify the API key has the correct roles

### Issue: "Connection Timeout"
- Check network connectivity
- Verify the host URL is correct

## Next Steps

1. **Test the connection**: `npm run test-cloudant`
2. **Migrate your data**: `npm run migrate-to-cloud`
3. **Deploy to DigitalOcean**: `npm run workflow deploy-cloud`
4. **Monitor usage**: Check IBM Cloud console

Your IAM authentication setup is more secure than legacy authentication and is ready for production use! 🚀 