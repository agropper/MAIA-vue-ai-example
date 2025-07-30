import fetch from 'node-fetch'

export class DigitalOceanAPI {
  constructor(apiKey, baseURL = 'https://api.digitalocean.com') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`DigitalOcean API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Agent Management
  async listAgents() {
    const response = await this.request('/v2/agents')
    return response.agents || []
  }

  async getAgent(agentId) {
    const response = await this.request(`/v2/agents/${agentId}`)
    return response
  }

  async createAgent(agentData) {
    const response = await this.request('/v2/agents', {
      method: 'POST',
      body: JSON.stringify(agentData)
    })
    return response
  }

  async updateAgent(agentId, agentData) {
    const response = await this.request(`/v2/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData)
    })
    return response
  }

  async deleteAgent(agentId) {
    await this.request(`/v2/agents/${agentId}`, {
      method: 'DELETE'
    })
  }

  // Knowledge Base Management
  async listKnowledgeBases() {
    const response = await this.request('/v2/knowledge_bases')
    return response.knowledge_bases || []
  }

  async getKnowledgeBase(kbId) {
    const response = await this.request(`/v2/knowledge_bases/${kbId}`)
    return response
  }

  async createKnowledgeBase(kbData) {
    const response = await this.request('/v2/knowledge_bases', {
      method: 'POST',
      body: JSON.stringify(kbData)
    })
    return response
  }

  async updateKnowledgeBase(kbId, kbData) {
    const response = await this.request(`/v2/knowledge_bases/${kbId}`, {
      method: 'PUT',
      body: JSON.stringify(kbData)
    })
    return response
  }

  async deleteKnowledgeBase(kbId) {
    await this.request(`/v2/knowledge_bases/${kbId}`, {
      method: 'DELETE'
    })
  }

  // Document Management
  async addDocumentToKnowledgeBase(kbId, document) {
    const response = await this.request(`/v2/knowledge_bases/${kbId}/documents`, {
      method: 'POST',
      body: JSON.stringify(document)
    })
    return response
  }

  async listDocumentsInKnowledgeBase(kbId) {
    const response = await this.request(`/v2/knowledge_bases/${kbId}/documents`)
    return response.documents || []
  }

  async deleteDocumentFromKnowledgeBase(kbId, documentId) {
    await this.request(`/v2/knowledge_bases/${kbId}/documents/${documentId}`, {
      method: 'DELETE'
    })
  }

  // Agent-Knowledge Base Association
  async associateKnowledgeBaseWithAgent(agentId, kbId) {
    await this.request(`/v2/agents/${agentId}/knowledge_bases`, {
      method: 'POST',
      body: JSON.stringify({ knowledge_base_id: kbId })
    })
  }

  async disassociateKnowledgeBaseFromAgent(agentId, kbId) {
    await this.request(`/v2/agents/${agentId}/knowledge_bases/${kbId}`, {
      method: 'DELETE'
    })
  }

  async getAgentKnowledgeBases(agentId) {
    const response = await this.request(`/v2/agents/${agentId}/knowledge_bases`)
    return response.knowledge_bases || []
  }
}

// Utility functions for MAIA integration
export const createMAIAAgent = async (apiKey, patientId = 'demo_patient_001') => {
  const doAPI = new DigitalOceanAPI(apiKey)
  
  const agentData = {
    name: `MAIA Agent - ${patientId}`,
    description: `Personal AI agent for patient ${patientId} with healthcare context`,
    model: 'gpt-4o-mini',
    instructions: `You are a medical AI assistant for patient ${patientId}. 
    You have access to their health records and can provide personalized medical guidance.
    Always maintain patient privacy and provide evidence-based recommendations.
    If you're unsure about medical advice, recommend consulting with a healthcare provider.`
  }

  return doAPI.createAgent(agentData)
}

export const createMAIAKnowledgeBase = async (apiKey, patientId = 'demo_patient_001') => {
  const doAPI = new DigitalOceanAPI(apiKey)
  
  const kbData = {
    name: `MAIA Knowledge Base - ${patientId}`,
    description: `Healthcare knowledge base for patient ${patientId}`,
    documents: [
      {
        name: 'patient_profile.md',
        content: `# Patient Profile: ${patientId}
        
This knowledge base contains healthcare information for patient ${patientId}.
Medical records, test results, and treatment plans will be added here.`,
        type: 'markdown'
      }
    ]
  }

  return doAPI.createKnowledgeBase(kbData)
}

export const setupMAIAEnvironment = async (apiKey, patientId = 'demo_patient_001') => {
  const doAPI = new DigitalOceanAPI(apiKey)
  
  try {
    console.log(`🚀 Setting up MAIA environment for patient ${patientId}...`)
    
    // Create knowledge base
    console.log('📚 Creating knowledge base...')
    const knowledgeBase = await createMAIAKnowledgeBase(apiKey, patientId)
    console.log(`✅ Knowledge base created: ${knowledgeBase.id}`)
    
    // Create agent
    console.log('🤖 Creating AI agent...')
    const agent = await createMAIAAgent(apiKey, patientId)
    console.log(`✅ Agent created: ${agent.id}`)
    
    // Associate knowledge base with agent
    console.log('🔗 Associating knowledge base with agent...')
    await doAPI.associateKnowledgeBaseWithAgent(agent.id, knowledgeBase.id)
    console.log('✅ Knowledge base associated with agent')
    
    return {
      agent,
      knowledgeBase,
      endpoint: `https://${agent.id}.agents.do-ai.run/api/v1`
    }
  } catch (error) {
    console.error('❌ Failed to setup MAIA environment:', error)
    throw error
  }
} 