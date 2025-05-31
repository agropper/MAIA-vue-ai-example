import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { formHandler } from './utils.js'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Define token limit for the model
const TOKEN_LIMIT = 8192

const extractSystemMessages = (messages) => {
  let systemContent = []
  let tempStorage = []

  // Extract 'system' role contents and remove them from the original array
  const filteredMessages = messages.filter((message, index) => {
    if (message.role === 'system') {
      tempStorage.push({ index, content: message.content })
      systemContent.push(message.content)
      return false // Remove 'system' role messages
    }
    return true
  })

  // Concatenate system contents into a single string
  const systemContext = systemContent.join('\n')

  return { filteredMessages, systemContext, tempStorage }
}

const restoreSystemMessages = (messages, tempStorage) => {
  tempStorage.forEach((item) => {
    messages.splice(item.index, 0, { role: 'system', content: item.content })
  })

  return messages
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (
    event.headers['content-type'] &&
    event.headers['content-type'].includes('multipart/form-data')
  ) {
    const response = await formHandler(event)
    return response
  } else {
    try {
      // Parse incoming body
      const body = JSON.parse(event.body)
      const fullChatHistory = body.chatHistory || []
      const newUserMessage = {
        role: 'user',
        content: body.newValue || ''
      }
      // Append the new user message to the full chat history
      const updatedChatHistory = [...fullChatHistory, newUserMessage]

      // Filter for Anthropic: only user/assistant roles, only required fields
      const anthropicMessages = updatedChatHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({ role: msg.role, content: msg.content }))

      // Prepare context for Anthropic (system prompt and user/assistant messages only)
      const systemMessages = updatedChatHistory.filter(m => m.role === 'system').map(m => m.content).join('\n');
      const nonSystemMessages = updatedChatHistory.filter(m => m.role !== 'system');
      let params = {
        messages: anthropicMessages,
        max_tokens: TOKEN_LIMIT,
        model: 'claude-3-7-sonnet-20250219',
        system: systemMessages
      };
      const response = await anthropic.messages.create(params);
      // Append the new assistant message with name: 'Claude'
      updatedChatHistory.push({ role: 'assistant', content: response.content[0].text, name: 'Claude' });
      // Return the full updated chat history
      return {
        statusCode: 200,
        body: JSON.stringify(updatedChatHistory)
      };
    } catch (error) {
      // Log error details
      console.error('Error processing request:', error)

      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Server error: ${error.message}` })
      }
    }
  }
}

export { handler }
