import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Mock AI responses for local testing
const mockAIResponses = {
  'personal-chat': (message) => `[Personal AI] I understand you're asking about: "${message}". This is a mock response for local testing. In production, this would connect to your personal AI agent.`,
  'anthropic-chat': (message) => `[Anthropic Claude] Here's my response to: "${message}". This is a mock response for local testing.`,
  'gemini-chat': (message) => `[Google Gemini] I can help with: "${message}". This is a mock response for local testing.`,
  'deepseek-r1-chat': (message) => `[DeepSeek R1] My analysis of: "${message}". This is a mock response for local testing.`
};

// Utility function to estimate token count
const estimateTokenCount = (text) => {
  const averageTokenLength = 4;
  return Math.ceil(text.length / averageTokenLength);
};

// Mock personal chat endpoint
app.post('/api/personal-chat', async (req, res) => {
  try {
    let { chatHistory, newValue, timeline } = req.body;
    
    // Filter out system messages for mock responses
    chatHistory = chatHistory.filter(msg => msg.role !== 'system');
    
    // Create mock response
    const mockResponse = mockAIResponses['personal-chat'](newValue);
    
    const newChatHistory = [
      ...chatHistory,
      { role: 'user', content: newValue },
      { role: 'assistant', content: mockResponse, name: 'Personal AI' }
    ];
    
    console.log('Mock Personal Chat response sent');
    res.json(newChatHistory);
  } catch (error) {
    console.error('Mock Personal Chat error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Mock Anthropic chat endpoint
app.post('/api/anthropic-chat', async (req, res) => {
  try {
    let { chatHistory, newValue, timeline } = req.body;
    
    chatHistory = chatHistory.filter(msg => msg.role !== 'system');
    
    const mockResponse = mockAIResponses['anthropic-chat'](newValue);
    
    const newChatHistory = [
      ...chatHistory,
      { role: 'user', content: newValue },
      { role: 'assistant', content: mockResponse, name: 'Anthropic' }
    ];
    
    console.log('Mock Anthropic response sent');
    res.json(newChatHistory);
  } catch (error) {
    console.error('Mock Anthropic error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Mock Gemini chat endpoint
app.post('/api/gemini-chat', async (req, res) => {
  try {
    let { chatHistory, newValue, timeline } = req.body;
    
    chatHistory = chatHistory.filter(msg => msg.role !== 'system');
    
    const mockResponse = mockAIResponses['gemini-chat'](newValue);
    
    const newChatHistory = [
      ...chatHistory,
      { role: 'user', content: newValue },
      { role: 'assistant', content: mockResponse, name: 'Gemini' }
    ];
    
    console.log('Mock Gemini response sent');
    res.json(newChatHistory);
  } catch (error) {
    console.error('Mock Gemini error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Mock DeepSeek R1 chat endpoint
app.post('/api/deepseek-r1-chat', async (req, res) => {
  try {
    let { chatHistory, newValue, timeline } = req.body;
    
    chatHistory = chatHistory.filter(msg => msg.role !== 'system');
    
    const mockResponse = mockAIResponses['deepseek-r1-chat'](newValue);
    
    const newChatHistory = [
      ...chatHistory,
      { role: 'user', content: newValue },
      { role: 'assistant', content: mockResponse, name: 'DeepSeek R1' }
    ];
    
    console.log('Mock DeepSeek R1 response sent');
    res.json(newChatHistory);
  } catch (error) {
    console.error('Mock DeepSeek R1 error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MAIA Simple Server running',
    mode: 'local-testing',
    timestamp: new Date().toISOString()
  });
});

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile('dist/index.html', { root: '.' });
});

app.listen(PORT, () => {
  console.log(`🚀 MAIA Simple Server running on port ${PORT}`);
  console.log(`📝 Local testing mode - using mock AI responses`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
}); 