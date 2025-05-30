import { estimateTokenCount, postData } from '../utils'

import type { AppState } from '../types'

const getTimelineStats = (timeline: string) => {
  const bytes = new TextEncoder().encode(timeline).length
  const tokens = estimateTokenCount(timeline)
  return `Timeline context: [${bytes} bytes, ~${tokens} tokens]`
}

const sendQuery = (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  uri: string,
  AIoptions: { label: string; value: string }[]
) => {
  // Calculate just chat history and new query tokens
  const chatHistoryTokens = appState.chatHistory.reduce((total, msg) => {
    return total + estimateTokenCount(typeof msg.content === 'string' ? msg.content : '')
  }, 0)
  const newQueryTokens = estimateTokenCount(appState.currentQuery || '')

  const totalTokens = chatHistoryTokens + newQueryTokens

  console.log('Token breakdown:', {
    chatHistory: chatHistoryTokens,
    newQuery: newQueryTokens,
    total: totalTokens
  })

  // Debug: Log chat history before sending
  // console.log('Chat history before sending:', JSON.stringify(appState.chatHistory, null, 2))

  appState.isLoading = true

  // Only push active question if there is a current query
  if (appState.currentQuery) {
    appState.activeQuestion = {
      role: 'user',
      content: appState.currentQuery || ''
    }
  }

  // If using Personal AI, sanitize chatHistory
  let chatHistoryToSend = appState.chatHistory;
  if (uri.endsWith('/personal-chat')) {
    chatHistoryToSend = appState.chatHistory.map(msg => {
      let content = msg.content;
      if (typeof content === 'string') {
        // ok
      } else if (Array.isArray(content)) {
        // Join all text parts (for Gemini, etc.)
        content = content.map((part: any) => {
          if (typeof part === 'string') return part;
          if (typeof part === 'object' && part !== null && 'text' in part) return part.text;
          return '';
        }).join(' ');
      } else if (typeof content === 'object' && content !== null && 'text' in content) {
        content = (content as any).text;
      } else {
        content = JSON.stringify(content);
      }
      return { ...msg, content: String(content) };
    });
  }

  postData(uri, {
    chatHistory: chatHistoryToSend,
    newValue: appState.currentQuery || '',
    timeline: appState.timeline
  }).then((data) => {
    // Debug: Log response data
    // console.log('Response data received:', JSON.stringify(data, null, 2))
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading = false
      appState.activeQuestion = {
        role: 'user',
        content: ''
      }
      return
    }

    // Robust: Only add 'name' to assistant messages that do not already have it
    const aiLabel = (AIoptions || [
      { label: 'Personal Chat', value: '/.netlify/functions/personal-chat' },
      { label: 'Anthropic', value: '/.netlify/functions/anthropic-chat' },
      { label: 'Gemini', value: '/.netlify/functions/gemini-chat' },
      { label: 'DeepSeek R1', value: '/.netlify/functions/deepseek-r1-chat' }
    ]).find((opt: { label: string; value: string }) => opt.value === appState.selectedAI)?.label || 'AI';
    appState.chatHistory = data.map((msg: any) => {
      if (msg.role === 'assistant' && !msg.name) {
        return { ...msg, name: aiLabel };
      }
      return msg;
    });

    appState.isLoading = false
    appState.activeQuestion = {
      role: 'user',
      content: ''
    }

    appState.currentQuery = ''
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  })
}

export { sendQuery }
