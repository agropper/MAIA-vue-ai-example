import Together from 'together-ai'
import dotenv from 'dotenv'
import { formHandler } from './utils.js'

dotenv.config()

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY
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
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      }

      // Wait for the response from formatResponse before pushing it into chatHistory
      const response = await together.chat.completions.create(params)
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
