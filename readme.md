# Medical AI Assistant Demo

This demonstration showcases the integration of OpenAI with [Trustee® Community](#software-repositories) and [NOSH](#software-repositories), enabling AI queries using a health Timeline as context. The demo utilizes the [GNAP (Grant Negotiation and Authorization Protocol)](https://ldapwiki.com/wiki/Wiki.jsp?page=Grant%20Negotiation%20and%20Authorization%20Protocol) for secure connections between components. You can view a [Demo Video Here](https://www.youtube.com/watch?v=V16lfEMN2eA&ab_channel=AdrianGropper).

## Overview

The primary purpose of this demo is to illustrate how a suite of open-source software, centered around the Trustee Authorization Server and the NOSH Resource Server, can be used to securely share health information from a patient-controlled Electronic Health Record (EHR) as system data in a conversation with an AI.

## Prerequisites

- An OpenAI API key (obtainable for free at [OpenAI's website](https://openai.com))
- A Gemini API key (obtainable for free at [Gemini's website](https://ai.google.dev))
- A Mistral API key (obtainable for free at [Mistral's website](https://docs.mistral.ai))
- A Together API key (obtainable for free at [Together's website](https://together.ai))

## Environment Variables

The MAIA App requires the following environment variables:

- `VITE_ORG_ID`: App ID. Can be any value.
- `VITE_PROJECT_ID`: Project ID. Can be any value.
- `VITE_OPENAI_API_KEY`: Your OpenAI API key.
- `GEMINI_API_KEY`: Your Gemini API key.
- `MISTRAL_API_KEY`: Your Mistral API key.
- `TOGETHER_API_KEY`: Your Together API key.

Make sure to set these variables before running the MAIA App.

### Troubleshooting

If the MAIA app experiences a failure, you may need to delete the cookies it sets during its function. MAIA sets two values:

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

---

**Now anyone can fork, build, and deploy their own version with minimal effort!**
