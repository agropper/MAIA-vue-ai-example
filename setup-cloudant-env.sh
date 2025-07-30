#!/bin/bash

# Setup Cloudant Environment Variables
echo "Setting up Cloudant environment variables..."

# Create .env file with Cloudant credentials
cat > .env << EOF
# Cloudant Configuration (IAM Authentication)
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
EOF

echo "✅ .env file created with Cloudant credentials"
echo "Now you can test the connection with: npm run test-cloudant" 