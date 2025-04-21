import OpenAI from 'openai'
import dotenv from 'dotenv'
import { formHandler } from './utils'

dotenv.config()

const openai = new OpenAI({
  organization: process.env.VITE_ORG_ID,
  project: process.env.VITE_PROJECT_ID,
  apiKey: process.env.VITE_OPENAI_API_KEY
})

// Define token limit for the model
const TOKEN_LIMIT = 2048

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
      // Append the user's question to chatHistory
      chatHistory.push({
        role: 'user',
        content: newValue
      })

      // Only add the timeline to the chatHistory after the user submits a query
      if (timeline) {
        chatHistory.push({
          role: 'system',
          content: 'timeline\n\n' + timeline
        })
      }

      // Estimate the size of the chat history and break it into chunks if needed
      const chunks = chunkMessages(chatHistory, TOKEN_LIMIT)

      let allResponses = []

      // Process each chunk with OpenAI API
      for (const chunk of chunks) {
        const params = {
          messages: chunk,
          model: 'gpt-4'
        }

        const response = await openai.chat.completions.create(params)

        allResponses.push(response.choices[0].message)
      }

      // Combine all responses into chatHistory
      allResponses.forEach((responseMessage) => {
        chatHistory.push(responseMessage)
      })

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
