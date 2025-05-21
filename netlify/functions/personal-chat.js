import OpenAI from 'openai'
import dotenv from 'dotenv'
import { formHandler } from './utils.js'

dotenv.config()

const openai = new OpenAI({
  baseURL: 'https://vzfujeetn2dkj4d5awhvvibo.agents.do-ai.run/api/v1', // Updated to include /v1 for correct endpoint
  apiKey: process.env.DIGITALOCEAN_PERSONAL_API_KEY // Set this in your .env file
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
      // Remove all system messages from chatHistory
      chatHistory = chatHistory.filter(msg => msg.role !== 'system');

      // Debug: Log the timeline value before constructing the systemPrompt
      // console.log('Timeline summary:', timeline ? timeline.slice(0, 100) : 'undefined');
      setTimeout(() => {}, 1);
      // Always reconstruct the system message with the full timeline content
      let systemPrompt = 'You are a helpful assistant. Please reply in English.';
      if (timeline) {
        systemPrompt = `Timeline context:\n\n${timeline}\n\n${systemPrompt}`;
      }
      const newChatHistory = [
      // Removed   { role: 'system', content: systemPrompt }, so the Knowledge Base would be used instead. 
        ...chatHistory,
        { role: 'user', content: newValue }
      ];

      // Build the real params for the API call
      const params = {
        messages: newChatHistory,
        model: 'agent-05102025'
      };

      // Deep clone for logging
      const paramsForLog = JSON.parse(JSON.stringify(params));
      if (timeline) {
        paramsForLog.messages = paramsForLog.messages.map(msg =>
          msg.role === 'system' && typeof msg.content === 'string' && msg.content.startsWith('Timeline context:')
            ? { ...msg, content: `[Timeline content redacted: ${Buffer.byteLength(timeline, 'utf8')} bytes, ~${estimateTokenCount(timeline)} tokens]` }
            : msg
        );
      }
      console.log('Sending params to DigitalOcean GenAI:', paramsForLog);

      // Send the real params to the API
      const response = await openai.chat.completions.create(params);
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