#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const WORKFLOW_COMMANDS = {
  'local-dev': {
    description: 'Start local development environment',
    command: 'npm run dev'
  },
  'local-docker': {
    description: 'Start local development with Docker',
    command: 'cd .. && docker-compose -f docker-compose.maia-secure.yml up -d'
  },
  'local-logs': {
    description: 'View local Docker logs',
    command: 'cd .. && docker-compose -f docker-compose.maia-secure.yml logs -f maia-vue-ai-secure'
  },
  'commit-local': {
    description: 'Commit and push local changes to main branch',
    command: 'git add . && git commit -m "Update local development" && git push origin main'
  },
  'deploy-cloud': {
    description: 'Deploy to cloud environment',
    command: 'git checkout cloud-migration && git merge main && git push origin cloud-migration'
  },
  'sync-data': {
    description: 'Sync data from local to cloud',
    command: 'npm run migrate-to-cloud'
  },
  'cloud-logs': {
    description: 'View cloud logs',
    command: 'doctl apps logs maia-app'
  },
  'merge-cloud': {
    description: 'Merge cloud changes back to main',
    command: 'git checkout main && git merge cloud-migration && git push origin main'
  }
}

function runCommand(command, description) {
  console.log(`\n🚀 ${description}`)
  console.log(`Running: ${command}\n`)
  
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${description} completed successfully`)
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message)
    process.exit(1)
  }
}

function showHelp() {
  console.log('MAIA Development Workflow Helper')
  console.log('================================')
  console.log('')
  console.log('Usage: node scripts/dev-workflow.js <command>')
  console.log('')
  console.log('Available commands:')
  
  Object.entries(WORKFLOW_COMMANDS).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(15)} - ${value.description}`)
  })
  
  console.log('')
  console.log('Workflow Examples:')
  console.log('  1. Local Development:')
  console.log('     node scripts/dev-workflow.js local-dev')
  console.log('     node scripts/dev-workflow.js commit-local')
  console.log('')
  console.log('  2. Cloud Testing:')
  console.log('     node scripts/dev-workflow.js deploy-cloud')
  console.log('     node scripts/dev-workflow.js cloud-logs')
  console.log('')
  console.log('  3. Data Sync:')
  console.log('     node scripts/dev-workflow.js sync-data')
  console.log('')
  console.log('  4. Production Release:')
  console.log('     node scripts/dev-workflow.js merge-cloud')
}

function checkEnvironment() {
  console.log('🔍 Checking environment...')
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    console.error('❌ Not in MAIA-vue-ai-example directory')
    process.exit(1)
  }
  
  // Check if .env file exists
  if (!fs.existsSync('.env') && !fs.existsSync('.env.local')) {
    console.warn('⚠️  No .env file found. Please create one from env.template')
  }
  
  // Check git status
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
    if (gitStatus.trim()) {
      console.log('📝 Git status:')
      console.log(gitStatus)
    } else {
      console.log('✅ Working directory is clean')
    }
  } catch (error) {
    console.error('❌ Git not available')
  }
  
  console.log('✅ Environment check complete\n')
}

function main() {
  const command = process.argv[2]
  
  if (!command || command === 'help') {
    showHelp()
    return
  }
  
  if (command === 'check') {
    checkEnvironment()
    return
  }
  
  if (!WORKFLOW_COMMANDS[command]) {
    console.error(`❌ Unknown command: ${command}`)
    console.log('Run "node scripts/dev-workflow.js help" for available commands')
    process.exit(1)
  }
  
  const { command: cmd, description } = WORKFLOW_COMMANDS[command]
  
  console.log('🔍 Checking environment first...')
  checkEnvironment()
  
  runCommand(cmd, description)
}

// Run the script
main() 