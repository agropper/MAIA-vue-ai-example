import { Mistral } from '@mistralai/mistralai'
import dotenv from 'dotenv'
import { formHandler } from './utils.js'

dotenv.config()

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

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
        model: 'mistral-large-latest'
      }

      // Wait for the response from formatResponse before pushing it into chatHistory
      const response = await client.chat.complete(params)
      chatHistory.push({ role: 'assistant', content: response.choices[0].message.content })
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
