# Medical AI Assistant (MAIA) Demo

This demonstration showcases the integration of both personal and frontier AI. Chat AI queries use an extensive multidimensional (hospitals, Medicare, wearables, etc...) health record as context but there is nothing health-specific about the implementation so it should work equally well for other domains such as academic, legal, art, etc... Optionally, when used with [Trustee® Community](#software-repositories) and [NOSH](#software-repositories), MAIA is integrated in a domain-specific way to gather, organize, and share in support of a patient's journey across multiple institutions and caregivers.

**This MAIA demo can be used independently of Trustee or NOSH** when the health records context is provided directly into one or more DigitalOcean Knowledge Bases that are attached as Resources to the personal and private GenAI agent. 

When integrated with Trustee and NOSH, MAIA utilizes the [GNAP (Grant Negotiation and Authorization Protocol)](https://ldapwiki.com/wiki/Wiki.jsp?page=Grant%20Negotiation%20and%20Authorization%20Protocol) for secure connections between components. You can view a [Demo Video Here](https://www.youtube.com/watch?v=V16lfEMN2eA&ab_channel=AdrianGropper).

## Overview

The purpose of this demo is to show how a personal AI with reasoning features (DeepSeek R1 70B) can be used to avoid sharing sensitive data when consulting the much more powerful frontier LLMs like Anthropic, Gemini, and any number of others. A typical AI chat session begins with access to a vector database for retrieval augmented generation (RAG) that can produce a patient summary along with any more specific inferences about the private records. At any point, the user can remove sensitive information from the chat transcript and provide the entire transcript to a frontier LLM of their choice. This back and forth between personal AI and frontier LLM can continue. Future versions of MAIA should support Model Context Protocol (MCP) to further enhance effectiveness and user experience. At any point, the entire chat transcipt can be saved locally by the user. 

If the MAIA is launched from the Trustee / NOSH suite of records management tools, it benefits from a more integrated experience where records can be acquired directly from EHR systems and Medicare, oragnized to support physicians as well as patients, and can be shared under patient control. MAIA chat transcripts can be edited, digitally signed by physicians and other licensed caregivers, and become new encounter notes in the NOSH health record.

## Prerequisites

- A GitHub account to host a fork of this MAIA repository
- A DigitalOcean account to pay for use of their GenAI Platform, App Platform, and databases (At current pricing, this demo costs about $26/month, $20 of which is for a 40GB managed database)
- Optionally, API keys for one or more frontier LLMs

## Environment

Local testing is supported with Vite and Express. A typical .env file might have some of the following:
- VITE_API_BASE_URL=http://localhost:3001/api
- VITE_ORG_ID=org-xxx
- VITE_PROJECT_ID=proj_xxx
- VITE_OPENAI_API_KEY=sk-xxx
- GEMINI_API_KEY=xxx
- DEEPSEEK_API_KEY=xxx
- DIGITALOCEAN_GENAI_API_KEY=xxx
- DIGITALOCEAN_PERSONAL_API_KEY=xxx
- MISTRAL_API_KEY=xxx
- VITE_GOOGLE_API_KEY=xxx
- VITE_DEEPSEEK_API_KEY=xxx
- VITE_ANTHROPIC_API_KEY=xxx
- ANTHROPIC_API_KEY=xxx
- VITE_DEFAULT_LLM=claude-3-sonnet-20240229

Make sure to set these variables before running the MAIA App and then copy the .env file to the protected settings for your App Platform. Not all of them are required.
see below for more notes about the local and cloud environment.

### Troubleshooting

When launched from NOSH, as compared to the public URL provided by App Platform, if the MAIA app experiences a failure, you may need to delete the cookies it sets during its function. MAIA sets two values:

- In SessionStorage, the value "gnap"
- In LocalStorage, the value "noshuri"

This should help the app to relaunch properly from NOSH.

### Change MAIA

1. The repo can be forked and added. Please see requirements above.
   This allows you to create your own version of MAIA for customization and development.

2. When you have a candidate, you can edit your MAIA URL in NOSH in order to test it against the app.
   This step enables you to integrate your custom MAIA version with the NOSH system for testing. Note: This change is made locally, so if you want to test on a separate machine, you will need to edit the MAIA url there as well. The data is saved to localStorage.

   ![Change MAIA URL](https://github.com/abeuscher/vue-ai-example/blob/main/public/ss-5.jpg)

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

# MAIA Vue AI Example

## 🚀 One-Click Deploy: Your Own AI Chat App

This repo contains both the frontend (Vite/Quasar) and backend (Express API) for a personal LLM chat app.

### Deploy to DigitalOcean App Platform

1. **Fork this repo.**
2. **Build the frontend locally:**
   ```sh
   npm install
   npm run build
   ```
   (This creates the `dist/` directory.)
3. **Push your changes to your fork.**
4. **Connect your fork to DigitalOcean App Platform.**
   - Choose "Node.js" as the environment.
   - The app will serve both the web UI and API from the same URL.
   - Set your environment variables (API keys, etc.) in the App Platform dashboard.

### Local Development

- **Frontend:**  
  ```sh
  npm run dev
  ```
- **Backend:**  
  ```sh
  node server.js
  ```
### API Base URL Configuration

- **Local development:**  
  If you run frontend and backend separately, set in `.env`:
  ```
  VITE_API_BASE_URL=http://localhost:3001/api
  ```
- **Production (DigitalOcean):**  
  Set in App Platform environment variables:
  ```
  VITE_API_BASE_URL=/api
  ```
- **In your code, always use:**
  ```js
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  fetch(`${baseUrl}/personal-chat`, ...)
 
---

**Now anyone can fork, build, and deploy their own version with minimal effort!**
