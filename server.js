import dotenv from 'dotenv'
dotenv.config()

import express from 'express';
const app = express();

import cors from 'cors'
app.use(cors())
app.use(express.json())

import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => res.send('Hello World'));

// Import API clients
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Initialize clients only if API keys are available
let personalChatClient, anthropic, openai, deepseek;

// DigitalOcean GenAI setup (Personal Chat)
if (process.env.DIGITALOCEAN_PERSONAL_API_KEY) {
  personalChatClient = new OpenAI({
    baseURL: 'https://ppezsbr6shhcaf2njlxk25bc.agents.do-ai.run/api/v1',
    apiKey: process.env.DIGITALOCEAN_PERSONAL_API_KEY
  });
}

// Anthropic setup
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

// OpenAI setup  
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// DeepSeek setup
if (process.env.DEEPSEEK_API_KEY) {
  deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY
  });
}

// Gemini setup (will use fetch for Google AI)

// Utility function
const estimateTokenCount = (text) => {
  const averageTokenLength = 4
  return Math.ceil(text.length / averageTokenLength)
}

// Personal Chat route (DigitalOcean GenAI)
app.post('/api/personal-chat', async (req, res) => {
  try {
    if (!personalChatClient) {
      return res.status(500).json({ message: 'DigitalOcean Personal API key not configured' });
    }

    let { chatHistory, newValue, timeline } = req.body
    chatHistory = chatHistory.filter(msg => msg.role !== 'system');

    let systemPrompt = 'You are a helpful assistant. Please reply in English.';
    if (timeline) {
      systemPrompt = `Timeline context:\n\n${timeline}\n\n${systemPrompt}`;
    }
    const newChatHistory = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: newValue }
    ];

    const params = {
      messages: newChatHistory,
      model: 'personal-agent-05052025'
    };

    const response = await personalChatClient.chat.completions.create(params);
    console.log('Personal Chat response received');
    newChatHistory.push(response.choices[0].message)

    res.json(newChatHistory);
  } catch (error) {
    console.error('Personal Chat error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Anthropic Chat route
app.post('/api/anthropic-chat', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).json({ message: 'Anthropic API key not configured' });
    }

    const fullChatHistory = req.body.chatHistory || []
    const newUserMessage = {
      role: 'user',
      content: req.body.newValue || ''
    }
    const updatedChatHistory = [...fullChatHistory, newUserMessage]

    const anthropicMessages = updatedChatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({ role: msg.role, content: msg.content }))

    const systemMessages = updatedChatHistory.filter(m => m.role === 'system').map(m => m.content).join('\n');
    
    let params = {
      messages: anthropicMessages,
      max_tokens: 8192,
      model: 'claude-3-7-sonnet-20250219',
      system: systemMessages
    };
    
    const response = await anthropic.messages.create(params);
    updatedChatHistory.push({ role: 'assistant', content: response.content[0].text, name: 'Claude' });
    
    res.json(updatedChatHistory);
  } catch (error) {
    console.error('Anthropic error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// OpenAI Chat route
app.post('/api/openai-chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    const fullChatHistory = req.body.chatHistory || []
    const newUserMessage = {
      role: 'user',
      content: req.body.newValue || ''
    }
    const updatedChatHistory = [...fullChatHistory, newUserMessage]

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: updatedChatHistory,
      max_tokens: 4096
    });

    updatedChatHistory.push({ role: 'assistant', content: response.choices[0].message.content, name: 'ChatGPT' });
    res.json(updatedChatHistory);
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// DeepSeek Chat route
app.post('/api/deepseek-chat', async (req, res) => {
  try {
    if (!deepseek) {
      return res.status(500).json({ message: 'DeepSeek API key not configured' });
    }

    const fullChatHistory = req.body.chatHistory || []
    const newUserMessage = {
      role: 'user',
      content: req.body.newValue || ''
    }
    const updatedChatHistory = [...fullChatHistory, newUserMessage]

    // Add English instruction to system messages
    const systemMessages = updatedChatHistory.filter(m => m.role === 'system');
    if (systemMessages.length === 0) {
      updatedChatHistory.unshift({ role: 'system', content: 'Please reply in English.' });
    } else {
      systemMessages[0].content += ' Please reply in English.';
    }

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: updatedChatHistory,
      max_tokens: 4096
    });

    updatedChatHistory.push({ role: 'assistant', content: response.choices[0].message.content, name: 'DeepSeek' });
    res.json(updatedChatHistory);
  } catch (error) {
    console.error('DeepSeek error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// DeepSeek R1 Chat route
app.post('/api/deepseek-r1-chat', async (req, res) => {
  try {
    if (!deepseek) {
      return res.status(500).json({ message: 'DeepSeek API key not configured' });
    }

    const fullChatHistory = req.body.chatHistory || []
    const newUserMessage = {
      role: 'user',
      content: req.body.newValue || ''
    }
    const updatedChatHistory = [...fullChatHistory, newUserMessage]

    // Add English instruction to system messages
    const systemMessages = updatedChatHistory.filter(m => m.role === 'system');
    if (systemMessages.length === 0) {
      updatedChatHistory.unshift({ role: 'system', content: 'Please reply in English.' });
    } else {
      systemMessages[0].content += ' Please reply in English.';
    }

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-reasoner',
      messages: updatedChatHistory,
      max_tokens: 4096
    });

    updatedChatHistory.push({ role: 'assistant', content: response.choices[0].message.content, name: 'DeepSeek R1' });
    res.json(updatedChatHistory);
  } catch (error) {
    console.error('DeepSeek R1 error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Gemini Chat route
app.post('/api/gemini-chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const fullChatHistory = req.body.chatHistory || []
    const newUserMessage = {
      role: 'user',
      content: req.body.newValue || ''
    }
    const updatedChatHistory = [...fullChatHistory, newUserMessage]

    // Convert to Gemini format
    const geminiMessages = updatedChatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: geminiMessages
      })
    });

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    updatedChatHistory.push({ role: 'assistant', content, name: 'Gemini' });
    res.json(updatedChatHistory);
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// CATCH-ALL ROUTE MUST BE LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
