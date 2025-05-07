import OpenAI from 'openai'
import dotenv from 'dotenv'
import { formHandler } from './utils'

dotenv.config()

const openai = new OpenAI({
  baseURL: 'https://ppezsbr6shhcaf2njlxk25bc.agents.do-ai.run/api/v1', // Updated to include /v1 for correct endpoint
  apiKey: process.env.DIGITALOCEAN_GENAI_API_KEY // Set this in your .env file
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
      // Remove any existing timeline or English instruction system messages
      chatHistory = chatHistory.filter(
        msg => !(
          msg.role === 'system' &&
          (
            msg.content.startsWith('Timeline context:') ||
            msg.content.toLowerCase().includes('please reply in english')
          )
        )
      )
      // Build a single system prompt combining timeline and English instruction
      let systemPrompt = 'You are a helpful assistant. Please reply in English.'
      if (timeline) {
        systemPrompt = `Timeline context:\n\n${timeline}\n\n${systemPrompt}`
      }
      const newChatHistory = [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: newValue }
      ]

      const params = {
        messages: newChatHistory,
        model: 'personal-agent-05052025'
      }
      // Prepare params for logging without timeline content
      let paramsForLog = { ...params }
      if (timeline) {
        paramsForLog.messages = params.messages.map(msg =>
          msg.role === 'system' && msg.content.startsWith('Timeline context:')
            ? { ...msg, content: `[Timeline content redacted: ${Buffer.byteLength(timeline, 'utf8')} bytes, ~${estimateTokenCount(timeline)} tokens]` }
            : msg
        )
      }
      console.log('Sending params to DigitalOcean GenAI:', paramsForLog)
      // Log only the summary, not the content
      if (timeline) {
        const timelineBytes = Buffer.byteLength(timeline, 'utf8')
        const timelineTokens = estimateTokenCount(timeline)
        console.log(`Timeline received: ${timelineBytes} bytes, ~${timelineTokens} tokens`)
      }
      console.log('Chat history received:', chatHistory)
      const response = await openai.chat.completions.create(params)
      console.log('Received response from DigitalOcean GenAI:', response)
      newChatHistory.push(response.choices[0].message)

      return {
        statusCode: 200,
        body: JSON.stringify(newChatHistory)
      }
    } catch (error) {
      // Log error details
      console.error('Error processing request:', error)
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        console.error('Error response headers:', error.response.headers)
      }
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Server error: ${error.message}` })
      }
    }
  }
}

export { handler } 