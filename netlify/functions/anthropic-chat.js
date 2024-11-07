import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { formHandler } from './utils'

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
      let { chatHistory, newValue } = JSON.parse(event.body)

      // Step 1: Extract system messages and concatenate content
      const { filteredMessages, systemContext, tempStorage } = extractSystemMessages(chatHistory)

      filteredMessages.push({
        role: 'user',
        content: newValue
      })

      let params = {
        messages: filteredMessages,
        max_tokens: TOKEN_LIMIT,
        model: 'claude-3-5-sonnet-20241022',
        system: systemContext // Insert concatenated system content here
      }

      const response = await anthropic.messages.create(params)

      filteredMessages.push({ role: 'assistant', content: response.content[0].text })

      // Step 2: Restore the system messages back to their original positions
      const updatedChatHistory = restoreSystemMessages(filteredMessages, tempStorage)

      return {
        statusCode: 200,
        body: JSON.stringify(updatedChatHistory)
      }
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
