import fetch from 'node-fetch'

export interface DigitalOceanAgent {
  id: string
  name: string
  description: string
  model: string
  status: string
  created_at: string
  updated_at: string
}

export interface DigitalOceanKnowledgeBase {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
  document_count: number
}

export interface CreateAgentRequest {
  name: string
  description: string
  model: string
  instructions: string
  knowledge_base_ids?: string[]
}

export interface CreateKnowledgeBaseRequest {
  name: string
  description: string
  documents?: Array<{
    name: string
    content: string
    type: 'text' | 'markdown' | 'pdf'
  }>
}

export class DigitalOceanAPI {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string, baseURL: string = 'https://api.digitalocean.com') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  private async request(endpoint: string, options: any = {}): Promise<any> {
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
  async listAgents(): Promise<DigitalOceanAgent[]> {
    const response: any = await this.request('/v2/agents')
    return response.agents || []
  }

  async getAgent(agentId: string): Promise<DigitalOceanAgent> {
    const response: any = await this.request(`/v2/agents/${agentId}`)
    return response
  }

  async createAgent(agentData: CreateAgentRequest): Promise<DigitalOceanAgent> {
    const response: any = await this.request('/v2/agents', {
      method: 'POST',
      body: JSON.stringify(agentData)
    })
    return response
  }

  async updateAgent(agentId: string, agentData: Partial<CreateAgentRequest>): Promise<DigitalOceanAgent> {
    const response: any = await this.request(`/v2/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(agentData)
    })
    return response
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/v2/agents/${agentId}`, {
      method: 'DELETE'
    })
  }

  // Knowledge Base Management
  async listKnowledgeBases(): Promise<DigitalOceanKnowledgeBase[]> {
    const response: any = await this.request('/v2/knowledge_bases')
    return response.knowledge_bases || []
  }

  async getKnowledgeBase(kbId: string): Promise<DigitalOceanKnowledgeBase> {
    const response: any = await this.request(`/v2/knowledge_bases/${kbId}`)
    return response
  }

  async createKnowledgeBase(kbData: CreateKnowledgeBaseRequest): Promise<DigitalOceanKnowledgeBase> {
    const response: any = await this.request('/v2/knowledge_bases', {
      method: 'POST',
      body: JSON.stringify(kbData)
    })
    return response
  }

  async updateKnowledgeBase(kbId: string, kbData: Partial<CreateKnowledgeBaseRequest>): Promise<DigitalOceanKnowledgeBase> {
    const response: any = await this.request(`/v2/knowledge_bases/${kbId}`, {
      method: 'PUT',
      body: JSON.stringify(kbData)
    })
    return response
  }

  async deleteKnowledgeBase(kbId: string): Promise<void> {
    await this.request(`/v2/knowledge_bases/${kbId}`, {
      method: 'DELETE'
    })
  }

  // Document Management
  async addDocumentToKnowledgeBase(kbId: string, document: {
    name: string
    content: string
    type: 'text' | 'markdown' | 'pdf'
  }): Promise<any> {
    const response: any = await this.request(`/v2/knowledge_bases/${kbId}/documents`, {
      method: 'POST',
      body: JSON.stringify(document)
    })
    return response
  }

  async listDocumentsInKnowledgeBase(kbId: string): Promise<any[]> {
    const response: any = await this.request(`/v2/knowledge_bases/${kbId}/documents`)
    return response.documents || []
  }

  async deleteDocumentFromKnowledgeBase(kbId: string, documentId: string): Promise<void> {
    await this.request(`/v2/knowledge_bases/${kbId}/documents/${documentId}`, {
      method: 'DELETE'
    })
  }

  // Agent-Knowledge Base Association
  async associateKnowledgeBaseWithAgent(agentId: string, kbId: string): Promise<void> {
    await this.request(`/v2/agents/${agentId}/knowledge_bases`, {
      method: 'POST',
      body: JSON.stringify({ knowledge_base_id: kbId })
    })
  }

  async disassociateKnowledgeBaseFromAgent(agentId: string, kbId: string): Promise<void> {
    await this.request(`/v2/agents/${agentId}/knowledge_bases/${kbId}`, {
      method: 'DELETE'
    })
  }

  async getAgentKnowledgeBases(agentId: string): Promise<DigitalOceanKnowledgeBase[]> {
    const response: any = await this.request(`/v2/agents/${agentId}/knowledge_bases`)
    return response.knowledge_bases || []
  }
}

// Utility functions for MAIA integration
export const createMAIAAgent = async (apiKey: string, patientId: string = 'demo_patient_001') => {
  const doAPI = new DigitalOceanAPI(apiKey)
  
  const agentData: CreateAgentRequest = {
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

export const createMAIAKnowledgeBase = async (apiKey: string, patientId: string = 'demo_patient_001') => {
  const doAPI = new DigitalOceanAPI(apiKey)
  
  const kbData: CreateKnowledgeBaseRequest = {
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

export const setupMAIAEnvironment = async (apiKey: string, patientId: string = 'demo_patient_001') => {
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