import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import { formHandler } from './utils'

dotenv.config()

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
    let { chatHistory, newValue } = JSON.parse(event.body)
    const geminiChatHistory = chatHistory.map((message) => {
      return { role: 'user', parts: [{ text: message.content }] }
    })
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const textOnlyModel = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const chat = textOnlyModel.startChat({
      history: geminiChatHistory,
      generationConfig: {
        maxOutputTokens: 100
      }
    })
    try {
      const result = await chat.sendMessage(newValue)
      const response = await result.response.text()
      chatHistory.push({ role: 'user', content: newValue })
      chatHistory.push({ role: 'model', content: response })
      return {
        statusCode: 200,
        body: JSON.stringify(chatHistory)
      }
    } catch (error) {
      console.error('Error:', error)
      return {
        statusCode: 500,
        body: JSON.stringify({ message: `Server error: ${error.message}` })
      }
    }
  }
}

export { handler }
