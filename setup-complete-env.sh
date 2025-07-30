#!/bin/bash

# Setup Complete Environment Configuration for MAIA
echo "Setting up complete .env file for MAIA..."

# Create complete .env file
cat > .env << 'EOF'
# =============================================================================
# MAIA COMPLETE ENVIRONMENT CONFIGURATION
# =============================================================================
# This file contains all environment variables needed for MAIA
# Copy this to .env and replace placeholder values with your actual credentials
# =============================================================================

# =============================================================================
# CLOUDANT DATABASE CONFIGURATION (Primary Database)
# =============================================================================
# Cloudant IAM Authentication - Used for both local and cloud
CLOUDANT_URL=https://101aa9c8-aee0-475f-b6c0-cd5b68e28c24-bluemix.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=apikey-v2-eddelp7dcgxzao6urqtv5g5fp8802s6dbsuovnyy8ia
CLOUDANT_PASSWORD=21340f475d40052c304a36aac046df3a
CLOUDANT_DATABASE=maia_chats

# =============================================================================
# DIGITALOCEAN CONFIGURATION (AI Agent & Knowledge Base)
# =============================================================================
# Get your API key from: https://cloud.digitalocean.com/account/api/tokens
DIGITALOCEAN_TOKEN=your-digitalocean-api-key-here
DIGITALOCEAN_GENAI_ENDPOINT=https://vzfujeetn2dkj4d5awhvvibo.agents.do-ai.run/api/v1

# =============================================================================
# MAIA APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=development
LOCAL_TESTING=true
SINGLE_PATIENT_MODE=true
PATIENT_ID=demo_patient_001
PORT=3001

# =============================================================================
# PASSKEY AUTHENTICATION (for cloud deployment)
# =============================================================================
# Replace with your actual domain for cloud deployment
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
SESSION_SECRET=your-super-secret-session-key-change-this

# =============================================================================
# AI PROVIDERS (Optional - for fallback/alternative AI models)
# =============================================================================
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
VITE_ORG_ID=org-your-openai-org-id-here
VITE_PROJECT_ID=proj-your-openai-project-id-here

# Google Gemini Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# Anthropic Claude Configuration
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Mistral AI Configuration
MISTRAL_API_KEY=your-mistral-api-key-here

# Together AI Configuration
TOGETHER_API_KEY=your-together-api-key-here

# =============================================================================
# LEGACY COUCHDB CONFIGURATION (for backward compatibility)
# =============================================================================
# These are kept for compatibility but Cloudant is preferred
COUCHDB_URL=http://localhost:5984
COUCHDB_USER=maia_admin
COUCHDB_PASSWORD=MaiaSecure2024!
COUCHDB_DATABASE=maia_chats

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File upload limits
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
# Enable/disable features for development
ENABLE_FILE_UPLOAD=true
ENABLE_CHAT_HISTORY=true
ENABLE_KNOWLEDGE_BASE=true
ENABLE_AGENT_MANAGEMENT=true

# =============================================================================
# CLOUD DEPLOYMENT CONFIGURATION
# =============================================================================
# These will be set automatically by DigitalOcean App Platform
# DIGITALOCEAN_APP_ID=your-app-id
# DIGITALOCEAN_REGION=nyc1
# DIGITALOCEAN_ENVIRONMENT=production

# =============================================================================
# MONITORING CONFIGURATION
# =============================================================================
# Health check endpoint
HEALTH_CHECK_ENDPOINT=/health
HEALTH_CHECK_INTERVAL=30000

# =============================================================================
# NOTES FOR DEPLOYMENT
# =============================================================================
# 1. For local development: Copy this file to .env and update credentials
# 2. For DigitalOcean deployment: Use these same variables in App Platform
# 3. Required variables for cloud deployment:
#    - CLOUDANT_URL, CLOUDANT_USERNAME, CLOUDANT_PASSWORD, CLOUDANT_DATABASE
#    - DIGITALOCEAN_TOKEN
#    - RP_ID, ORIGIN, SESSION_SECRET (for passkey auth)
# 4. Optional variables for enhanced features:
#    - VITE_OPENAI_API_KEY (for OpenAI fallback)
#    - GEMINI_API_KEY (for Gemini fallback)
#    - ANTHROPIC_API_KEY (for Claude fallback)
# =============================================================================
EOF

echo "✅ Complete .env file created!"
echo ""
echo "📋 Next steps:"
echo "1. Replace placeholder values with your actual credentials"
echo "2. For DigitalOcean deployment, copy these variables to App Platform"
echo "3. Restart the server: pkill -f 'node.*server-secure.js' && node server-secure.js"
echo ""
echo "🔑 Required for cloud deployment:"
echo "   - DIGITALOCEAN_TOKEN (your actual API key)"
echo "   - RP_ID and ORIGIN (your domain)"
echo "   - SESSION_SECRET (change to a secure random string)"
echo ""
echo "📁 File created: .env" 