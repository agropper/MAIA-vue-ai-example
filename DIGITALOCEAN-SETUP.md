# 🚀 DigitalOcean Agent Setup Guide

## Quick Start

### 1. Get Your DigitalOcean API Key
1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Create a new token with read/write permissions
3. Copy the token

### 2. Setup Environment
```bash
# Copy the environment template
cp env.template .env

# Edit .env and add your API key
nano .env
```

### 3. Run the Setup Wizard
```bash
# Setup new MAIA environment
npm run setup-do

# List existing resources
npm run setup-do:list

# Cleanup resources
npm run setup-do:cleanup

# Show help
npm run setup-do:help
```

## What the Wizard Does

1. **Creates a Personal AI Agent** for your patient
2. **Creates a Knowledge Base** for health records  
3. **Associates** the Knowledge Base with the Agent
4. **Updates** your `.env` file with the new endpoint
5. **Provides** the agent endpoint for MAIA to use

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run setup-do` | Setup new MAIA environment |
| `npm run setup-do:list` | List existing agents/KBs |
| `npm run setup-do:cleanup` | Remove MAIA resources |
| `npm run setup-do:help` | Show help |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DIGITALOCEAN_API_KEY` | Your DigitalOcean API key | ✅ |
| `PATIENT_ID` | Patient ID (default: demo_patient_001) | ❌ |

## Next Steps

After running the setup:
1. Restart MAIA: `docker-compose -f ../docker-compose.maia-secure.yml restart maia-vue-ai-secure`
2. Access MAIA: http://localhost:3001
3. Upload health records to populate the knowledge base

## Troubleshooting

### "DIGITALOCEAN_API_KEY environment variable is required"
- Make sure you have a `.env` file in the MAIA-vue-ai-example directory
- Add your DigitalOcean API key to the `.env` file

### "DigitalOcean API error: 401"
- Check that your API key is correct
- Ensure the API key has read/write permissions

### "DigitalOcean API error: 404"
- The API endpoint might have changed
- Check the latest DigitalOcean API documentation 