import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
import { formHandler } from './utils'

dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Define token limit for the model
const TOKEN_LIMIT = 8192

const estimateTokenCount = (text) => {
  const averageTokenLength = 4 // Average length of a token in characters
  return Math.ceil(text.length / averageTokenLength)
}

const chunkMessages = (messages, tokenLimit) => {
  const chunks = []
  let currentChunk = []
  let currentTokens = 0

  messages.forEach((message) => {
    const messageTokenCount = estimateTokenCount(message.content)

    // If adding this message would exceed the token limit, start a new chunk
    if (currentTokens + messageTokenCount > tokenLimit) {
      // Only push the current chunk if it's not empty
      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
      }
      currentChunk = []
      currentTokens = 0
    }

    currentChunk.push(message)
    currentTokens += messageTokenCount
  })

  // Add the last chunk if not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
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
      let { chatHistory, newValue, timeline } = JSON.parse(event.body)
      chatHistory = chatHistory.filter((message) => message.role !== 'system')
      // Log incoming data
      console.log('Received chatHistory:', JSON.stringify(chatHistory, null, 2))
      console.log('Received newValue:', newValue)
      console.log('Received timeline:', timeline ? 'Timeline present' : 'No timeline')

      // Append the user's question to chatHistory
      chatHistory.push({
        role: 'user',
        content: newValue
      })

      // Log chatHistory after appending
      console.log('Updated chatHistory:', JSON.stringify(chatHistory, null, 2))

      let params = {
        messages: chatHistory,
        max_tokens: TOKEN_LIMIT,
        model: 'claude-3-5-sonnet-20241022'
      }
      if (timeline) {
        params = Object.assign(params, { system: timeline })
      }
      console.log(params)
      const response = await anthropic.messages.create(params)

      chatHistory.push({ role: 'assistant', content: response.content[0].text })
      // Log final chatHistory before returning

      if (timeline) {
        chatHistory.unshift({
          role: 'system',
          content: 'timeline\n\n' + timeline
        })
      }

      console.log('Final chatHistory before return:', JSON.stringify(response, null, 2))

      return {
        statusCode: 200,
        body: JSON.stringify(chatHistory)
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
