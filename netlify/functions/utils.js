import { Buffer } from 'buffer'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // Example: 2MB size limit

const formHandler = async (event) => {
  // Handle multipart form data (file uploads) independently
  try {
    const formData = parseMultipartForm(event)

    if (!formData || !formData.file) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No file found in form data' })
      }
    }

    // Log details about the uploaded file
    console.log(
      `File uploaded: ${formData.file.filename}, Size: ${Buffer.byteLength(formData.file.content, 'utf8')} bytes`
    )

    // Add the file as system content (not for AI)
    const updatedChatHistory = formData.chatHistory || []
    updatedChatHistory.push({
      role: 'system',
      content: `File uploaded: ${formData.file.filename}, Size: ${Buffer.byteLength(formData.file.content, 'utf8')} bytes\n${formData.file.content}`
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File processed and added to system content',
        chatHistory: updatedChatHistory
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Server error: ${error.message}` })
    }
  }
}

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

          // Log file details
          console.log('File detected:', filename)

          // Check file size during parsing
          const fileSize = Buffer.byteLength(content, 'utf8')
          console.log('File size:', fileSize)

          if (fileSize > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds the allowed limit of ${MAX_FILE_SIZE} bytes`)
          }

          result.file = { filename, content }
        }
      } else if (part.includes('name="chatHistory"')) {
        const content = part.split('\r\n\r\n')[1].trim()
        console.log('Chat history detected')
        result.chatHistory = JSON.parse(content)
      } else if (part.includes('name="aiOption"')) {
        const content = part.split('\r\n\r\n')[1].trim()
        console.log('AI Option detected:', content)
        result.aiOption = content
      }
    })
  } catch (error) {
    console.error('Error parsing multipart form:', error.message)
    throw new Error('Error parsing multipart form: ' + error.message)
  }

  return result
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

    // Use generateContent for generating responses after the user message
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
export { geminiChatCompletion, formHandler }
