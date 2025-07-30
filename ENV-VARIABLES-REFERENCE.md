# 🔧 MAIA Environment Variables Reference

## 📋 **Quick Reference for DigitalOcean Deployment**

Copy these variables to your DigitalOcean App Platform environment variables:

### **🔑 Required Variables (Must Have)**

```bash
# CLOUDANT DATABASE
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# DIGITALOCEAN AGENT
DIGITALOCEAN_TOKEN=your-actual-digitalocean-api-key-here
DIGITALOCEAN_GENAI_ENDPOINT=https://vzfujeetn2dkj4d5awhvvibo.agents.do-ai.run/api/v1

# MAIA CONFIG
NODE_ENV=production
LOCAL_TESTING=false
SINGLE_PATIENT_MODE=true
PATIENT_ID=demo_patient_001
PORT=8080

# PASSKEY AUTH
RP_ID=your-actual-domain.com
ORIGIN=https://your-actual-domain.com
SESSION_SECRET=your-actual-secure-session-secret

# SECURITY
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
MAX_FILES=5

# LOGGING
LOG_LEVEL=info
LOG_FILE=logs/maia.log

# FEATURES
ENABLE_FILE_UPLOAD=true
ENABLE_CHAT_HISTORY=true
ENABLE_KNOWLEDGE_BASE=true
ENABLE_AGENT_MANAGEMENT=true

# MONITORING
HEALTH_CHECK_ENDPOINT=/health
HEALTH_CHECK_INTERVAL=30000
```

### **🎯 Optional Variables (Nice to Have)**

```bash
# AI PROVIDERS (for fallback models)
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_ORG_ID=org-your-openai-org-id-here
VITE_PROJECT_ID=proj-your-openai-project-id-here
GEMINI_API_KEY=your-gemini-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
MISTRAL_API_KEY=your-mistral-api-key-here
TOGETHER_API_KEY=your-together-api-key-here
```

## 🚀 **Deployment Checklist**

### **Before Deploying to DigitalOcean:**

- [ ] **Replace `DIGITALOCEAN_TOKEN`** with your actual API key
- [ ] **Replace `RP_ID`** with your actual domain (e.g., `maia.yourdomain.com`)
- [ ] **Replace `ORIGIN`** with your actual domain (e.g., `https://maia.yourdomain.com`)
- [ ] **Replace `SESSION_SECRET`** with a secure random string
- [ ] **Set `NODE_ENV=production`**
- [ ] **Set `LOCAL_TESTING=false`**
- [ ] **Set `PORT=8080`** (DigitalOcean App Platform default)

### **For Local Development:**

- [ ] **Set `NODE_ENV=development`**
- [ ] **Set `LOCAL_TESTING=true`**
- [ ] **Set `PORT=3001`**
- [ ] **Keep `DIGITALOCEAN_TOKEN`** as placeholder for testing

## 🔧 **Variable Descriptions**

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `CLOUDANT_URL` | Cloudant database URL | ✅ | - |
| `CLOUDANT_USERNAME` | Cloudant IAM username | ✅ | - |
| `CLOUDANT_PASSWORD` | Cloudant IAM password | ✅ | - |
| `CLOUDANT_DATABASE` | Database name | ✅ | `maia_chats` |
| `DIGITALOCEAN_TOKEN` | DigitalOcean API key | ✅ | - |
| `DIGITALOCEAN_GENAI_ENDPOINT` | Agent endpoint | ✅ | - |
| `NODE_ENV` | Environment mode | ✅ | `development` |
| `LOCAL_TESTING` | Local development flag | ✅ | `true` |
| `SINGLE_PATIENT_MODE` | Single patient mode | ✅ | `true` |
| `PATIENT_ID` | Patient identifier | ✅ | `demo_patient_001` |
| `PORT` | Server port | ✅ | `3001` |
| `RP_ID` | Passkey relying party ID | ✅ | - |
| `ORIGIN` | Application origin | ✅ | - |
| `SESSION_SECRET` | Session encryption key | ✅ | - |

## 🎯 **Quick Setup Commands**

### **For Local Development:**
```bash
# Copy complete environment
cp .env.complete .env

# Edit to replace placeholders
nano .env

# Start server
node server-secure.js
```

### **For DigitalOcean Deployment:**
```bash
# Copy required variables to App Platform
# (Use the Required Variables section above)
```

## ✅ **Verification Commands**

```bash
# Test health endpoint
curl https://your-domain.com/health

# Test agent info
curl https://your-domain.com/api/current-agent

# Test database connection
curl https://your-domain.com/api/load-chats/demo_patient_001
```

## 🚨 **Common Issues**

1. **"DigitalOcean API key not configured"**
   - Replace `DIGITALOCEAN_TOKEN` with actual API key

2. **"Database connection failed"**
   - Verify Cloudant credentials are correct

3. **"Passkey authentication failed"**
   - Ensure `RP_ID` and `ORIGIN` match your domain

4. **"Port already in use"**
   - Change `PORT` to available port (8080 for cloud)

## 📊 **Environment-Specific Settings**

### **Local Development:**
```bash
NODE_ENV=development
LOCAL_TESTING=true
PORT=3001
```

### **Cloud Deployment:**
```bash
NODE_ENV=production
LOCAL_TESTING=false
PORT=8080
```

Your MAIA application is ready for deployment! 🚀 