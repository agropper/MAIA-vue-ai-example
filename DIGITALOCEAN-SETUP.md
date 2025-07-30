# DigitalOcean API Setup for MAIA

## 🎯 **Current Status**

✅ **Agent**: Working (agent-05102025)
✅ **Knowledge Base**: Connected (devon-viaapp-kb-06162025)
✅ **Endpoint**: https://vzfujeetn2dkj4d5awhvvibo.agents.do-ai.run/api/v1
⚠️ **API Key**: Needs to be configured

## 🔑 **Setup DigitalOcean API Key**

### Step 1: Get Your API Key
1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click "Generate New Token"
3. Give it a name like "MAIA-Development"
4. Select "Write" scope
5. Copy the generated token

### Step 2: Update .env File
Replace the placeholder in your `.env` file:

```bash
# Current (placeholder)
DIGITALOCEAN_TOKEN=your-digitalocean-api-key-here

# Replace with your actual token
DIGITALOCEAN_TOKEN=dop_v1_1234567890abcdef...
```

### Step 3: Restart Server
```bash
pkill -f "node.*server-secure.js"
node server-secure.js
```

## ✅ **Test the Setup**

After updating the API key, test these endpoints:

```bash
# Test agent info
curl -s http://localhost:3001/api/current-agent | jq '.agent.name'

# Test knowledge base
curl -s http://localhost:3001/api/current-agent | jq '.knowledgeBase.name'

# Test endpoint
curl -s http://localhost:3001/api/current-agent | jq '.endpoint'
```

## 🎯 **Expected Results**

- **Agent Name**: `agent-05102025`
- **Knowledge Base**: `devon-viaapp-kb-06162025`
- **Status**: `running`
- **No Errors**: In browser console

## 🚀 **Benefits**

With the API key configured:
- ✅ **Full Agent Integration**: MAIA can use the DigitalOcean agent
- ✅ **Knowledge Base Access**: Can search patient records
- ✅ **Real AI Responses**: Powered by your DigitalOcean agent
- ✅ **Cloud Deployment Ready**: Same agent for local and cloud

## 🔧 **Troubleshooting**

### If you get API errors:
1. **Check API Key**: Ensure it's correct and has write permissions
2. **Check Agent Status**: Verify agent is running in DigitalOcean console
3. **Check Network**: Ensure your server can reach DigitalOcean API

### If agent info is missing:
1. **Restart Server**: After updating .env
2. **Check Logs**: Look for API connection errors
3. **Verify Agent**: Check DigitalOcean console for agent status

## 🎉 **Next Steps**

Once the API key is configured:
1. **Test Chat**: Try asking MAIA a question
2. **Test Knowledge Base**: Upload patient documents
3. **Deploy to Cloud**: Use same agent for production

Your MAIA application is almost complete - just need the API key! 🚀 