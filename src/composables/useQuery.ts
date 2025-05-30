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
  } else if (uri.endsWith('/anthropic-chat')) {
    // Only allow 'user' and 'assistant' roles, and strip extra properties (like name)
    chatHistoryToSend = appState.chatHistory
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content
      })) as any;
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

    // Add a 'name' property to new assistant messages to persist the AI label
    const aiLabel = (AIoptions || [
      { label: 'Personal Chat', value: '/.netlify/functions/personal-chat' },
      { label: 'Anthropic', value: '/.netlify/functions/anthropic-chat' },
      { label: 'Gemini', value: '/.netlify/functions/gemini-chat' },
      { label: 'DeepSeek R1', value: '/.netlify/functions/deepseek-r1-chat' }
    ]).find((opt: { label: string; value: string }) => opt.value === appState.selectedAI)?.label || 'AI';

    // Find the index where new messages start
    let firstNewIdx = 0;
    for (let i = 0; i < data.length && i < appState.chatHistory.length; i++) {
      // Compare role and content for equality
      if (
        data[i].role === appState.chatHistory[i].role &&
        data[i].content === appState.chatHistory[i].content
      ) {
        firstNewIdx = i + 1;
      } else {
        break;
      }
    }
    appState.chatHistory = data.map((msg: any, idx: number) => {
      if (
        msg.role === 'assistant' &&
        !msg.name &&
        idx >= firstNewIdx
      ) {
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
