import OpenAI from 'openai'
import dotenv from 'dotenv'
import { formHandler } from './utils'

dotenv.config()

const openai = new OpenAI({
  organization: process.env.VITE_ORG_ID,
  project: process.env.VITE_PROJECT_ID,
  apiKey: process.env.VITE_OPENAI_API_KEY
})

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
      chatHistory.push({
        role: 'user',
        content: newValue
      })

      const params = {
        messages: chatHistory,
        model: 'gpt-4'
      }

      // Wait for the response from formatResponse before pushing it into chatHistory
      const response = await openai.chat.completions.create(params)
      chatHistory.push(response.choices[0].message)

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
