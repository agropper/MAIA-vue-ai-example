import { Buffer } from 'buffer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { encoding_for_model } from 'tiktoken' // Add tiktoken for token counting

const openai = new OpenAI({
  organization: process.env.VITE_ORG_ID,
  project: process.env.VITE_PROJECT_ID,
  apiKey: process.env.VITE_OPENAI_API_KEY
})

const MIN_REQUIRED_TOKENS = 2000 // Define a minimum threshold
const MAX_FILE_SIZE = 2 * 1024 * 1024 // Example: 2MB size limit

// Initialize the tokenizer for GPT-4
const tokenizer = encoding_for_model('gpt-4')

// AI options map with string keys
const AI_OPTIONS = {
  1: { name: 'OpenAI', model: 'gpt-4' },
  2: { name: 'Gemini', model: 'gemini-model' } // Placeholder model name
}

// Function to calculate tokens and pad if needed
function padTokensIfNeeded(messages, timelineData) {
  let totalTokens = 0

  // Tokenize the chat history
  messages.forEach((message) => {
    totalTokens += tokenizer.encode(message.content).length
  })

  // Tokenize the timeline data
  const timelineTokens = tokenizer.encode(timelineData)
  totalTokens += timelineTokens.length

  let tokensNeeded = MIN_REQUIRED_TOKENS - totalTokens

  // If more tokens are needed, add padding
  let paddedTimeline = timelineData
  if (tokensNeeded > 0) {
    const paddingText = 'This is padding text. ' // Example padding sentence
    const paddingTokens = tokenizer.encode(paddingText).length

    // Repeat padding text until reaching the desired token count
    while (tokensNeeded > 0) {
      paddedTimeline += paddingText
      tokensNeeded -= paddingTokens
    }
  }

  return paddedTimeline
}

// Function to parse multipart form data
const parseMultipartForm = (event) => {
  const boundary = event.headers['content-type'].split('boundary=')[1]
  let result = { file: null, chatHistory: null, aiOption: null }
  try {
    const parts = Buffer.from(event.body, 'base64').toString().split(`--${boundary}`)

    parts.forEach((part) => {
      if (part.includes('filename=')) {
        const filenameMatch = part.match(/filename="(.+)"/)
        if (filenameMatch) {
          const filename = filenameMatch[1]
          const content = part.split('\r\n\r\n').slice(1).join('\r\n\r\n').trim()

          // Check file size during parsing
          const fileSize = Buffer.byteLength(content, 'utf8')
          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds the allowed limit of ${MAX_FILE_SIZE} bytes`)
          }

          result.file = { filename, content }
        }
      } else if (part.includes('name="chatHistory"')) {
        const content = part.split('\r\n\r\n')[1].trim()
        result.chatHistory = JSON.parse(content)
      } else if (part.includes('name="aiOption"')) {
        const content = part.split('\r\n\r\n')[1].trim()
        result.aiOption = content
      }
    })
  } catch (error) {
    throw new Error('Error parsing multipart form: ' + error.message)
  }
  return result
}
async function handleInitialGeminiPrompt(googleChat, textOnlyModel) {
  const prompt = googleChat[0].parts[0].text
  console.log('Initial prompt for Gemini API:', prompt)

  // Generate initial content using the model
  const result = await textOnlyModel.generateContent(prompt)
  const response = await result.response
  const responseText = response.text()

  console.log('Initial response from Gemini API:', responseText)

  // Add the model's response to the chat history
  googleChat.push({
    role: 'model',
    parts: [{ text: responseText }]
  })

  return googleChat
}

async function handleGeminiChat(googleChat, textOnlyModel) {
  // Start the chat with the Gemini model
  const result = await textOnlyModel.startChat({ history: googleChat })
  await result._sendPromise

  console.log('Gemini API history:', JSON.stringify(result._history, null, 2))

  const chatHistory = result._history
  const modelMessage = chatHistory.find((entry) => entry.role === 'model')

  if (modelMessage && modelMessage.parts && modelMessage.parts[0].text) {
    const responseText = modelMessage.parts[0].text
    return responseText
  } else {
    throw new Error('No valid model response found in history')
  }
}

async function geminiChatCompletion(params) {
  const apiKey = process.env.GEMINI_API_KEY
  console.log('Gemini API Key:', apiKey)
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  const client = new GoogleGenerativeAI(apiKey)
  const textOnlyModel = client.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Transforming messages into Gemini's format (role + parts)
  const googleChat = params.messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.content }]
  }))

  console.log('Google Chat:', googleChat)

  try {
    let responseText

    // Get the latest user message
    const recentUserMessage = googleChat[googleChat.length - 1] // Only the newest user message

    // Ensure the message is from the user
    if (recentUserMessage.role !== 'user') {
      throw new Error('The latest message should be from the user.')
    }

    // Instead of startChat, use generateContent for each interaction
    const result = await textOnlyModel.generateContent(recentUserMessage.parts[0].text)
    const response = await result.response

    // Log the result to understand the structure returned from Gemini
    console.log('Gemini API result:', JSON.stringify(result, null, 2))

    responseText = response.text()

    // Add the model's response to googleChat
    googleChat.push({
      role: 'model',
      parts: [{ text: responseText }]
    })

    // Convert the Gemini chat format back to OpenAI format
    const openAIFormattedChat = googleChat.map((message) => ({
      role: message.role,
      content: message.parts[0].text
    }))

    console.log(
      'Transformed OpenAI-formatted Chat Object:',
      JSON.stringify(openAIFormattedChat, null, 2)
    )

    return openAIFormattedChat
  } catch (error) {
    throw new Error(`Error calling Gemini API: ${error.message}`)
  }
}

const formatResponse = async (selectedAI, params) => {
  if (selectedAI.name === 'OpenAI') {
    const response = await openai.chat.completions.create(params)
    return response.choices[0].message // OpenAI response uses "message"
  } else if (selectedAI.name === 'Gemini') {
    const response = await geminiChatCompletion(params)
    return response[response.length - 1] // Return the last message in the Gemini chat object
  } else {
    throw new Error('Unsupported AI option')
  }
}

const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  if (
    event.headers['content-type'] &&
    event.headers['content-type'].includes('multipart/form-data')
  ) {
    // Handling multipart form data (file uploads) - untouched
    try {
      // Existing logic
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Server error: ${error.message}` })
      }
    }
  } else {
    // Handle regular chat requests
    try {
      let { chatHistory, newValue, aiOption } = JSON.parse(event.body)
      aiOption = aiOption ? aiOption.toString() : '1'

      if (!AI_OPTIONS[aiOption]) {
        aiOption = '1' // Default to OpenAI if invalid
      }

      const selectedAI = AI_OPTIONS[aiOption]

      console.log(`Selected AI Option: ${aiOption}`)
      console.log(`Using AI Service: ${selectedAI.name}`)

      // Ensure the user's message is only pushed once
      if (!chatHistory.find((msg) => msg.content === newValue && msg.role === 'user')) {
        chatHistory.push({
          role: 'user',
          content: newValue
        })
      }

      const params = {
        messages: chatHistory,
        model: selectedAI.model
      }

      const responseMessage = await formatResponse(selectedAI, params)
      chatHistory.push(responseMessage)

      console.log('Chat history:', chatHistory)
      return {
        statusCode: 200,
        body: JSON.stringify(chatHistory)
      }
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Server error: ${error.message}` })
      }
    }
  }
}

export { handler }
