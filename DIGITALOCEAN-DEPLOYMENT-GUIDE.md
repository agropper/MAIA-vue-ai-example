# 🚀 DigitalOcean App Platform Deployment Guide

## 📋 **Prerequisites**

Before deploying to DigitalOcean App Platform, ensure you have:

1. **DigitalOcean Account**: With API access
2. **Domain Name**: For your MAIA application
3. **Cloudant Database**: Already configured (✅ Done)
4. **DigitalOcean Agent**: Already configured (✅ Done)

## 🔧 **Step 1: Prepare Environment Variables**

### **Required Variables for Cloud Deployment**

Copy these variables from your `.env` file to DigitalOcean App Platform:

```bash
# =============================================================================
# CLOUDANT DATABASE CONFIGURATION (Primary Database)
# =============================================================================
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# =============================================================================
# DIGITALOCEAN CONFIGURATION (AI Agent & Knowledge Base)
# =============================================================================
DIGITALOCEAN_TOKEN=your-actual-digitalocean-api-key-here
DIGITALOCEAN_GENAI_ENDPOINT=https://vzfujeetn2dkj4d5awhvvibo.agents.do-ai.run/api/v1

# =============================================================================
# MAIA APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=production
LOCAL_TESTING=false
SINGLE_PATIENT_MODE=true
PATIENT_ID=demo_patient_001
PORT=8080

# =============================================================================
# PASSKEY AUTHENTICATION (for cloud deployment)
# =============================================================================
# Replace with your actual domain
RP_ID=your-actual-domain.com
ORIGIN=https://your-actual-domain.com
SESSION_SECRET=your-actual-secure-session-secret

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
MAX_FILES=5

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_FILE=logs/maia.log

# =============================================================================
# DEVELOPMENT CONFIGURATION
# =============================================================================
ENABLE_FILE_UPLOAD=true
ENABLE_CHAT_HISTORY=true
ENABLE_KNOWLEDGE_BASE=true
ENABLE_AGENT_MANAGEMENT=true

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
HEALTH_CHECK_ENDPOINT=/health
HEALTH_CHECK_INTERVAL=30000
```

### **Optional Variables (for enhanced features)**

```bash
# AI PROVIDERS (Optional - for fallback/alternative AI models)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_ORG_ID=org-your-openai-org-id-here
VITE_PROJECT_ID=proj-your-openai-project-id-here
GEMINI_API_KEY=your-gemini-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
MISTRAL_API_KEY=your-mistral-api-key-here
TOGETHER_API_KEY=your-together-api-key-here
```

## 🚀 **Step 2: Deploy to DigitalOcean App Platform**

### **Method 1: Using DigitalOcean CLI**

1. **Install DigitalOcean CLI**:
   ```bash
   brew install doctl
   doctl auth init
   ```

2. **Create App Platform App**:
   ```bash
   doctl apps create --spec app.yaml
   ```

### **Method 2: Using DigitalOcean Web Console**

1. **Go to App Platform**: https://cloud.digitalocean.com/apps
2. **Create New App**: Click "Create App"
3. **Connect Repository**: Connect your GitHub repository
4. **Configure Build**: Use the following settings

## 📁 **Step 3: App Configuration**

### **Build Configuration**

```yaml
# app.yaml
name: maia-app
services:
- name: maia
  source_dir: /MAIA-vue-ai-example
  github:
    repo: your-username/your-repo
    branch: main
  run_command: npm start
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "8080"
```

### **Environment Variables**

Add all the required variables from Step 1 to your App Platform environment variables.

## 🔧 **Step 4: Domain Configuration**

1. **Add Custom Domain**: In App Platform settings
2. **Update Environment Variables**:
   ```bash
   RP_ID=your-actual-domain.com
   ORIGIN=https://your-actual-domain.com
   ```

## ✅ **Step 5: Verification**

### **Test Your Deployment**

1. **Health Check**: `https://your-domain.com/health`
2. **API Test**: `https://your-domain.com/api/current-agent`
3. **Frontend**: `https://your-domain.com`

### **Expected Results**

- ✅ **Health Check**: `{"status":"healthy","environment":"production"}`
- ✅ **Agent Info**: Returns your DigitalOcean agent details
- ✅ **Chat History**: Loads from Cloudant
- ✅ **File Upload**: Works with Cloudant storage

## 🔄 **Step 6: Data Migration (Not Needed!)**

**No data migration required!** Your MAIA application already uses Cloudant, so:

- ✅ **Local Development**: Uses Cloudant
- ✅ **Cloud Deployment**: Uses same Cloudant
- ✅ **Data Consistency**: Real-time sync

## 🎯 **Step 7: Post-Deployment**

### **Monitor Your App**

1. **Logs**: Check DigitalOcean App Platform logs
2. **Metrics**: Monitor performance in App Platform dashboard
3. **Health**: Verify all endpoints are responding

### **Update DNS**

1. **Point Domain**: Update DNS to point to your App Platform app
2. **SSL Certificate**: DigitalOcean handles this automatically

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

2. **Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Database Connection**:
   - Verify Cloudant credentials are correct
   - Check network connectivity

4. **Agent Issues**:
   - Verify DigitalOcean API key is correct
   - Check agent status in DigitalOcean console

### **Debug Commands**

```bash
# Check app logs
doctl apps logs your-app-id

# Check app status
doctl apps get your-app-id

# Update environment variables
doctl apps update your-app-id --env NODE_ENV=production
```

## 🎉 **Success!**

Once deployed, your MAIA application will have:

- ✅ **Cloud Deployment**: Running on DigitalOcean App Platform
- ✅ **Unified Database**: Same Cloudant for local and cloud
- ✅ **AI Integration**: DigitalOcean agent for patient interactions
- ✅ **Security**: Passkey authentication ready
- ✅ **Scalability**: Automatic scaling with App Platform

## 📊 **Next Steps**

1. **Test the Application**: Verify all features work in production
2. **Monitor Performance**: Set up monitoring and alerts
3. **Scale as Needed**: Adjust instance count based on usage
4. **Backup Strategy**: Cloudant provides automatic backups

Your MAIA application is now ready for production use! 🚀 