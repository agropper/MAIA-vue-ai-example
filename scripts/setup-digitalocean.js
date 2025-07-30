#!/usr/bin/env node

import dotenv from 'dotenv'
import { setupMAIAEnvironment, DigitalOceanAPI } from '../src/utils/digitalocean-api.js'

// Load environment variables
dotenv.config()

const DIGITALOCEAN_API_KEY = process.env.DIGITALOCEAN_API_KEY
const PATIENT_ID = process.env.PATIENT_ID || 'demo_patient_001'

async function main() {
  console.log('🚀 MAIA DigitalOcean Agent Setup')
  console.log('================================')
  
  if (!DIGITALOCEAN_API_KEY) {
    console.error('❌ DIGITALOCEAN_API_KEY environment variable is required')
    console.log('Please add DIGITALOCEAN_API_KEY to your .env file')
    process.exit(1)
  }

  try {
    // Setup MAIA environment
    const result = await setupMAIAEnvironment(DIGITALOCEAN_API_KEY, PATIENT_ID)
    
    console.log('\n✅ MAIA Environment Setup Complete!')
    console.log('====================================')
    console.log(`🤖 Agent ID: ${result.agent.id}`)
    console.log(`📚 Knowledge Base ID: ${result.knowledgeBase.id}`)
    console.log(`🔗 Endpoint: ${result.endpoint}`)
    
    // Update .env file with new endpoint
    console.log('\n📝 Updating .env file...')
    await updateEnvFile(result.endpoint)
    
    console.log('\n🎉 Setup complete! You can now use MAIA with your personal AI agent.')
    console.log('\nNext steps:')
    console.log('1. Restart MAIA: docker-compose -f docker-compose.maia-secure.yml restart maia-vue-ai-secure')
    console.log('2. Access MAIA: http://localhost:3001')
    console.log('3. Upload health records to populate the knowledge base')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function updateEnvFile(endpoint) {
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const envPath = path.join(process.cwd(), '.env')
  
  try {
    let envContent = await fs.readFile(envPath, 'utf8')
    
    // Update or add the endpoint
    if (envContent.includes('DIGITALOCEAN_GENAI_ENDPOINT=')) {
      envContent = envContent.replace(
        /DIGITALOCEAN_GENAI_ENDPOINT=.*/,
        `DIGITALOCEAN_GENAI_ENDPOINT=${endpoint}`
      )
    } else {
      envContent += `\nDIGITALOCEAN_GENAI_ENDPOINT=${endpoint}\n`
    }
    
    await fs.writeFile(envPath, envContent)
    console.log('✅ .env file updated with new endpoint')
  } catch (error) {
    console.warn('⚠️  Could not update .env file:', error.message)
    console.log(`Please manually add: DIGITALOCEAN_GENAI_ENDPOINT=${endpoint}`)
  }
}

// CLI argument handling
const args = process.argv.slice(2)
const command = args[0]

if (command === 'list') {
  // List existing agents and knowledge bases
  async function listResources() {
    if (!DIGITALOCEAN_API_KEY) {
      console.error('❌ DIGITALOCEAN_API_KEY environment variable is required')
      process.exit(1)
    }
    
    const doAPI = new DigitalOceanAPI(DIGITALOCEAN_API_KEY)
    
    try {
      console.log('🤖 Existing Agents:')
      const agents = await doAPI.listAgents()
      agents.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.id}) - ${agent.status}`)
      })
      
      console.log('\n📚 Existing Knowledge Bases:')
      const knowledgeBases = await doAPI.listKnowledgeBases()
      knowledgeBases.forEach(kb => {
        console.log(`  - ${kb.name} (${kb.id}) - ${kb.document_count} documents`)
      })
    } catch (error) {
      console.error('❌ Failed to list resources:', error.message)
    }
  }
  
  listResources()
} else if (command === 'cleanup') {
  // Cleanup MAIA resources
  async function cleanup() {
    if (!DIGITALOCEAN_API_KEY) {
      console.error('❌ DIGITALOCEAN_API_KEY environment variable is required')
      process.exit(1)
    }
    
    const doAPI = new DigitalOceanAPI(DIGITALOCEAN_API_KEY)
    
    try {
      console.log('🧹 Cleaning up MAIA resources...')
      
      const agents = await doAPI.listAgents()
      const knowledgeBases = await doAPI.listKnowledgeBases()
      
      // Delete MAIA agents
      for (const agent of agents) {
        if (agent.name.includes('MAIA Agent')) {
          console.log(`🗑️  Deleting agent: ${agent.name}`)
          await doAPI.deleteAgent(agent.id)
        }
      }
      
      // Delete MAIA knowledge bases
      for (const kb of knowledgeBases) {
        if (kb.name.includes('MAIA Knowledge Base')) {
          console.log(`🗑️  Deleting knowledge base: ${kb.name}`)
          await doAPI.deleteKnowledgeBase(kb.id)
        }
      }
      
      console.log('✅ Cleanup complete!')
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message)
    }
  }
  
  cleanup()
} else if (command === 'help' || args.length === 0) {
  console.log('MAIA DigitalOcean Agent Setup')
  console.log('')
  console.log('Usage:')
  console.log('  node scripts/setup-digitalocean.js          # Setup new MAIA environment')
  console.log('  node scripts/setup-digitalocean.js list     # List existing resources')
  console.log('  node scripts/setup-digitalocean.js cleanup  # Cleanup MAIA resources')
  console.log('  node scripts/setup-digitalocean.js help     # Show this help')
  console.log('')
  console.log('Environment Variables:')
  console.log('  DIGITALOCEAN_API_KEY - Your DigitalOcean API key')
  console.log('  PATIENT_ID           - Patient ID (default: demo_patient_001)')
} else {
  console.error(`❌ Unknown command: ${command}`)
  console.log('Run "node scripts/setup-digitalocean.js help" for usage information')
  process.exit(1)
}

// Run main setup if no command specified
if (args.length === 0) {
  main()
} 