# Medical AI Assistant (MAIA) Demo

This demonstration showcases the integration of both personal and frontier AI. Chat AI queries use an extensive multidimensional (hospitals, Medicare, wearables, etc...) health record as context but there is nothing health-specific about the implementation so it should work equally well for other domains such as academic, legal, art, etc... Optionally, when used with [Trustee® Community](#software-repositories) and [NOSH](#software-repositories), MAIA is integrated in a domain-specific way to gather, organize, and share in support of a patient's journey across multiple institutions and caregivers.

**This MAIA demo can be used independently of Trustee or NOSH** when the health records context is provided directly into one or more DigitalOcean Knowledge Bases that are attached as Resources to the personal and private GenAI agent. 

When integrated with Trustee and NOSH, MAIA utilizes the [GNAP (Grant Negotiation and Authorization Protocol)](https://ldapwiki.com/wiki/Wiki.jsp?page=Grant%20Negotiation%20and%20Authorization%20Protocol) for secure connections between components. You can view a [Demo Video Here](https://www.youtube.com/watch?v=V16lfEMN2eA&ab_channel=AdrianGropper).

## 🚀 Quick Start

### Prerequisites

- A GitHub account to host a fork of this MAIA repository
- A DigitalOcean account for GenAI Platform, App Platform, and Cloudant database
- API keys for AI providers (DigitalOcean, Anthropic, etc.)

### 🎯 Unified Setup (Recommended)

**NEW: Unified Cloudant Setup** - MAIA now uses Cloudant for both local development and production, eliminating data migration concerns.

📖 **Complete Setup Guide:** [UNIFIED-CLOUDANT-SETUP.md](UNIFIED-CLOUDANT-SETUP.md)

### 📚 Documentation

- **🚀 Deployment Guide:** [DIGITALOCEAN-DEPLOYMENT-GUIDE.md](DIGITALOCEAN-DEPLOYMENT-GUIDE.md)
- **☁️ Cloudant Setup:** [CLOUDANT-SETUP.md](CLOUDANT-SETUP.md)
- **🔐 IAM Authentication:** [CLOUDANT-IAM-SETUP.md](CLOUDANT-IAM-SETUP.md)
- **⚡ Quick Setup:** [CLOUDANT-QUICK-SETUP.md](CLOUDANT-QUICK-SETUP.md)
- **🔧 Environment Variables:** [ENV-VARIABLES-REFERENCE.md](ENV-VARIABLES-REFERENCE.md)

## Overview

The purpose of this demo is to show how a personal AI with reasoning features can be used to avoid sharing sensitive data when consulting the much more powerful frontier LLMs like Anthropic, Gemini, and any number of others. A typical AI chat session begins with access to a vector database for retrieval augmented generation (RAG) that can produce a patient summary along with any more specific inferences about the private records. At any point, the user can remove sensitive information from the chat transcript and provide the entire transcript to a frontier LLM of their choice. This back and forth between personal AI and frontier LLM can continue. Future versions of MAIA should support Model Context Protocol (MCP) to further enhance effectiveness and user experience. At any point, the entire chat transcript can be saved to Cloudant.

If the MAIA is launched from the Trustee / NOSH suite of records management tools, it benefits from a more integrated experience where records can be acquired directly from EHR systems and Medicare, organized to support physicians as well as patients, and can be shared under patient control. MAIA chat transcripts can be edited, digitally signed by physicians and other licensed caregivers, and become new encounter notes in the NOSH health record.

## 🏗️ Architecture

### ✅ Current Features

- **Unified Cloudant Database** - Single database for local and production
- **DigitalOcean GenAI Agent** - Personal AI with knowledge base access
- **Multiple AI Providers** - Anthropic, OpenAI, DeepSeek support
- **File Upload & Processing** - PDF parsing and analysis
- **Chat Management** - Save, load, and manage conversations
- **Cache-Busting** - Fixed Chrome caching issues
- **Security Headers** - Comprehensive security implementation

### 🔧 Technical Stack

- **Frontend:** Vue.js 3 + Quasar + Vite
- **Backend:** Express.js + Node.js
- **Database:** IBM Cloudant (CouchDB-compatible)
- **AI Providers:** DigitalOcean GenAI, Anthropic Claude, OpenAI, DeepSeek
- **Deployment:** DigitalOcean App Platform

## Environment Configuration

### Required Environment Variables

```bash
# Cloudant Database (Primary)
CLOUDANT_URL=https://your-instance.cloudant.com
CLOUDANT_USERNAME=your-username
CLOUDANT_PASSWORD=your-password
CLOUDANT_DATABASE=maia_chats

# DigitalOcean GenAI
DIGITALOCEAN_PERSONAL_API_KEY=your-do-api-key
DIGITALOCEAN_GENAI_ENDPOINT=https://your-agent.agents.do-ai.run/api/v1

# AI Providers (Optional)
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
DEEPSEEK_API_KEY=your-deepseek-key

# Application
VITE_API_BASE_URL=http://localhost:3001/api
SESSION_SECRET=your-session-secret
```

📖 **Complete Environment Guide:** [ENV-VARIABLES-REFERENCE.md](ENV-VARIABLES-REFERENCE.md)

## 🚀 Deployment

### Local Development

```bash
# Clone and setup
git clone https://github.com/agropper/MAIA-vue-ai-example.git
cd MAIA-vue-ai-example

# Install dependencies
npm install

# Setup environment
cp .example.env .env
# Edit .env with your credentials

# Build frontend
npm run build

# Start server
node server.js
```

### DigitalOcean App Platform

📖 **Complete Deployment Guide:** [DIGITALOCEAN-DEPLOYMENT-GUIDE.md](DIGITALOCEAN-DEPLOYMENT-GUIDE.md)

1. **Fork this repository**
2. **Setup Cloudant database** - See [CLOUDANT-SETUP.md](CLOUDANT-SETUP.md)
3. **Configure environment variables** in DigitalOcean App Platform
4. **Deploy** - The app will automatically build and deploy

## Troubleshooting

### Common Issues

- **Chrome Caching:** Use hard refresh (Cmd+Shift+R) or clear browser cache
- **API Key Issues:** Verify DigitalOcean agent permissions and API key validity
- **Database Connection:** Check Cloudant credentials and network connectivity

### NOSH Integration

When launched from NOSH, if the MAIA app experiences a failure, you may need to delete the cookies it sets during its function. MAIA sets two values:

- In SessionStorage, the value "gnap"
- In LocalStorage, the value "noshuri"

This should help the app to relaunch properly from NOSH.

## Resources

### Software Repositories:

#### Patient-Centered Domain

- GNAP Resource Server: [https://github.com/shihjay2/nosh3](https://github.com/shihjay2/nosh3)
- GNAP Authorization Server: [https://github.com/HIEofOne/Trustee-Community](https://github.com/HIEofOne/Trustee-Community)
- W3C Verifiable Credentials and SMART on FHIR Support: [https://github.com/HIEofOne/Trustee-Proxy](https://github.com/HIEofOne/Trustee-Proxy)

#### MAIA Domain

- GNAP Client: [https://github.com/abeuscher/vue-ai-example](https://github.com/abeuscher/vue-ai-example)
- GNAP Client Support: [https://github.com/hieofOne/vue3-gnap](https://github.com/hieofOne/vue3-gnap)

For further instructions, details, and challenge specifics, please visit: [Challenge Details](https://pages.pathcheck.org/patient-journey-challenge)

## Contact

For questions or assistance, please contact: info@hieofone.com

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file in the root directory of this project for the full license text.
