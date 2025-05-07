import { estimateTokenCount, postData } from '../utils'

import type { AppState } from '../types'

const sendQuery = (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  uri: string
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
  console.log('Chat history before sending:', JSON.stringify(appState.chatHistory, null, 2))

  appState.isLoading = true

  // Only push active question if there is a current query
  if (appState.currentQuery) {
    appState.activeQuestion = {
      role: 'user',
      content: appState.currentQuery || ''
    }
  }

  // Remove the redundant timeline property
  postData(uri, {
    chatHistory: appState.chatHistory,
    newValue: appState.currentQuery || '',
    timeline: appState.timeline
  }).then((data) => {
    // Debug: Log response data
    console.log('Response data received:', JSON.stringify(data, null, 2))
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading = false
      appState.activeQuestion = {
        role: 'user',
        content: ''
      }
      return
    }

    // FIX: Replace chatHistory with the full conversation
    appState.chatHistory = data
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
