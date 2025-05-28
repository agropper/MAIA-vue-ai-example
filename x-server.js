import dotenv from 'dotenv'
dotenv.config()

console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.slice(0,6) + '...' + process.env.ANTHROPIC_API_KEY.slice(-2) : 'NOT SET')

import express from 'express'
import cors from 'cors'
import { handler as personalChatHandler } from './netlify/functions/personal-chat.js'
// import { handler as anthropicChatHandler } from './netlify/functions/anthropic-chat.js'
// import { handler as geminiChatHandler } from './netlify/functions/gemini-chat.js'
// import { handler as deepseekChatHandler } from './netlify/functions/deepseek-chat.js'
// import { handler as deepseekR1ChatHandler } from './netlify/functions/deepseek-r1-chat.js'
// import { handler as digitaloceanGenaiChatHandler } from './netlify/functions/digitalocean-genai-chat.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
app.use(cors())
app.use(express.json())

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

function makeRoute(path, handler) {
  console.log('Registering route:', path);
  app.post(path, async (req, res) => {
    const event = {
      httpMethod: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body)
    }
    try {
      const result = await handler(event)
      res.status(result.statusCode).send(result.body)
    } catch (error) {
      res.status(500).send({ message: 'Internal server error', error: error.message })
    }
  })
}

makeRoute('/api/personal-chat', personalChatHandler)
makeRoute('/api/anthropic-chat', anthropicChatHandler)
makeRoute('/api/gemini-chat', geminiChatHandler)
makeRoute('/api/deepseek-chat', deepseekChatHandler)
makeRoute('/api/deepseek-r1-chat', deepseekR1ChatHandler)
makeRoute('/api/digitalocean-genai-chat', digitaloceanGenaiChatHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
}) 