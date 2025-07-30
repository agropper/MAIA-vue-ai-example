# 🤖 DigitalOcean Agent Platform Automation

This document describes how to automate the creation and management of DigitalOcean Personal AI agents and Knowledge Bases for MAIA.

## 🎯 Overview

MAIA can automatically create and configure DigitalOcean Agent Platform resources including:
- **Personal AI Agents**: Custom AI assistants with healthcare context
- **Knowledge Bases**: Document repositories for patient health records
- **Agent-Knowledge Base Associations**: Linking agents to relevant data

## 📋 Prerequisites

### 1. DigitalOcean Account
- Create a DigitalOcean account at https://digitalocean.com
- Enable the Agent Platform feature
- Generate an API key with Agent Platform permissions

### 2. Environment Setup
Add your DigitalOcean API key to `MAIA-vue-ai-example/.env`:
```bash
DIGITALOCEAN_API_KEY=your_digitalocean_api_key_here
PATIENT_ID=demo_patient_001  # Optional, defaults to demo_patient_001
```

## 🚀 Quick Start

### 1. Setup New MAIA Environment
```bash
# From MAIA-vue-ai-example directory
npm run setup-do
```

This will:
- Create a new Personal AI agent
- Create a new Knowledge Base
- Associate the Knowledge Base with the agent
- Update your `.env` file with the new endpoint
- Provide restart instructions

### 2. Restart MAIA
```bash
# Restart the MAIA container to use the new agent
docker-compose -f ../docker-compose.maia-secure.yml restart maia-vue-ai-secure
```

### 3. Access MAIA
- Open http://localhost:3001
- Your Personal AI agent is now ready to use!

## 🔧 Management Commands

### List Existing Resources
```bash
npm run setup-do:list
```
Shows all agents and knowledge bases in your DigitalOcean account.

### Cleanup MAIA Resources
```bash
npm run setup-do:cleanup
```
Deletes all MAIA-related agents and knowledge bases.

### Get Help
```bash
npm run setup-do:help
```
Shows all available commands and options.

## 📚 Knowledge Base Management

### Adding Documents to Knowledge Base

Once you have a knowledge base, you can add patient documents:

```javascript
import { DigitalOceanAPI } from '../src/utils/digitalocean-api.js'

const doAPI = new DigitalOceanAPI(process.env.DIGITALOCEAN_API_KEY)

// Add a document to the knowledge base
await doAPI.addDocumentToKnowledgeBase(kbId, {
  name: 'patient_health_records.pdf',
  content: 'Patient health records content...',
  type: 'pdf'
})
```

### Supported Document Types
- **text**: Plain text documents
- **markdown**: Markdown formatted documents
- **pdf**: PDF documents (content extracted as text)

## 🤖 Agent Configuration

### Default Agent Instructions
The automated setup creates agents with these instructions:
```
You are a medical AI assistant for patient [PATIENT_ID]. 
You have access to their health records and can provide personalized medical guidance.
Always maintain patient privacy and provide evidence-based recommendations.
If you're unsure about medical advice, recommend consulting with a healthcare provider.
```

### Customizing Agent Instructions
You can modify the agent instructions in `src/utils/digitalocean-api.ts`:

```typescript
const agentData: CreateAgentRequest = {
  name: `MAIA Agent - ${patientId}`,
  description: `Personal AI agent for patient ${patientId} with healthcare context`,
  model: 'gpt-4o-mini',
  instructions: `Your custom instructions here...`
}
```

## 🔄 Integration with MAIA

### Automatic Endpoint Updates
The setup script automatically updates your `.env` file with the new agent endpoint:
```bash
DIGITALOCEAN_GENAI_ENDPOINT=https://[agent-id].agents.do-ai.run/api/v1
```

### File Upload Integration
When users upload files in MAIA:
1. Files are processed and converted to text/markdown
2. Content is sent to the AI agent as context
3. The agent can reference uploaded documents in responses

### Knowledge Base Population
You can extend the automation to automatically add uploaded files to the knowledge base:

```javascript
// In your file upload handler
const doAPI = new DigitalOceanAPI(process.env.DIGITALOCEAN_API_KEY)

// Add uploaded file to knowledge base
await doAPI.addDocumentToKnowledgeBase(knowledgeBaseId, {
  name: uploadedFile.name,
  content: fileContent,
  type: 'markdown'
})
```

## 🔒 Security Considerations

### API Key Management
- Store API keys in environment variables, never in code
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage for unexpected activity

### Patient Data Privacy
- Knowledge bases contain patient health information
- Ensure proper access controls
- Consider data retention policies
- Implement audit logging for data access

### Network Security
- All communication with DigitalOcean APIs uses HTTPS
- API keys are transmitted securely
- Consider IP whitelisting for production environments

## 🛠️ Troubleshooting

### Common Issues

**API Key Invalid**
```
❌ DigitalOcean API error: 401 Unauthorized
```
Solution: Verify your API key is correct and has Agent Platform permissions.

**Agent Creation Fails**
```
❌ DigitalOcean API error: 400 Bad Request
```
Solution: Check that the agent name is unique and follows naming conventions.

**Knowledge Base Association Fails**
```
❌ DigitalOcean API error: 404 Not Found
```
Solution: Verify the agent and knowledge base IDs are correct.

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=digitalocean-api
```

### Manual Verification
You can verify your setup manually:
1. Check the DigitalOcean console for created resources
2. Test the agent endpoint directly
3. Verify the knowledge base contains expected documents

## 📈 Advanced Usage

### Multiple Patients
Create separate agents for different patients:
```bash
PATIENT_ID=patient_001 npm run setup-do
PATIENT_ID=patient_002 npm run setup-do
```

### Custom Agent Models
Modify the agent creation to use different models:
```typescript
const agentData: CreateAgentRequest = {
  name: `MAIA Agent - ${patientId}`,
  description: `Personal AI agent for patient ${patientId}`,
  model: 'gpt-4o', // or 'gpt-4o-mini', 'claude-3-5-sonnet', etc.
  instructions: `...`
}
```

### Batch Operations
For multiple patients, you can script the setup:
```bash
#!/bin/bash
for patient in patient_001 patient_002 patient_003; do
  PATIENT_ID=$patient npm run setup-do
done
```

## 🔄 Future Enhancements

### Planned Features
- **Automatic Knowledge Base Updates**: Sync uploaded files to knowledge base
- **Agent Performance Monitoring**: Track agent usage and performance
- **Multi-Model Support**: Support for different AI models per patient
- **Backup and Restore**: Export/import agent configurations
- **Cost Optimization**: Monitor and optimize API usage

### Integration Opportunities
- **NOSH3 Integration**: Link agents to NOSH3 patient records
- **Trustee-Community Integration**: Secure agent access controls
- **Audit Trail**: Track all agent interactions and data access
- **Compliance**: HIPAA-compliant agent configurations

## 📞 Support

For issues with the automation:
1. Check the troubleshooting section above
2. Verify your DigitalOcean API key and permissions
3. Review the DigitalOcean Agent Platform documentation
4. Check the MAIA logs for detailed error messages

For DigitalOcean Agent Platform issues:
- Consult the [DigitalOcean Agent Platform Documentation](https://docs.digitalocean.com/products/agent-platform/)
- Contact DigitalOcean support for platform-specific issues 