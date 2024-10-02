import { geminiChatCompletion, parseMultipartForm } from './utils'

import { Buffer } from 'buffer'
import OpenAI from 'openai'

const openai = new OpenAI({
  organization: process.env.VITE_ORG_ID,
  project: process.env.VITE_PROJECT_ID,
  apiKey: process.env.VITE_OPENAI_API_KEY
})

// AI options map with string keys
const AI_OPTIONS = {
  1: { name: 'OpenAI', model: 'gpt-4' },
  2: { name: 'Gemini', model: 'gemini-model' } // Placeholder model name
}

const formatResponse = async (selectedAI, params) => {
  if (selectedAI.name === 'OpenAI') {
    const response = await openai.chat.completions.create(params)
    return response.choices[0].message
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
  } else {
    // Handle other POST requests related to AI (chat completions)
    try {
      let { chatHistory, newValue, aiOption } = JSON.parse(event.body)
      aiOption = aiOption ? aiOption.toString() : '1'

      if (!AI_OPTIONS[aiOption]) {
        aiOption = '1' // Default to OpenAI if invalid
      }

      const selectedAI = AI_OPTIONS[aiOption]

      console.log(`Selected AI Option: ${aiOption}`)
      console.log(`Using AI Service: ${selectedAI.name}`)

      // Add the user's input to the chat history
      chatHistory.push({
        role: 'user',
        content: newValue
      })

      const params = {
        messages: chatHistory,
        model: selectedAI.model
      }

      // Wait for the response from formatResponse before pushing it into chatHistory
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
