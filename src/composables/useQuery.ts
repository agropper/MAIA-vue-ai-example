import type { AppState } from '../types'
import { postData } from '../utils'

const sendQuery = (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  uri: string
) => {
  appState.isLoading = true

  // Only push active question if there is a current query
  if (appState.currentQuery) {
    appState.activeQuestion = {
      role: 'user',
      content: appState.currentQuery || ''
    }
  }

  // Even if newValue (currentQuery) is empty, send the chatHistory that contains the timeline
  postData(uri, {
    chatHistory: appState.chatHistory,
    newValue: appState.currentQuery || '' // Make sure to always send something here, even if it's an empty string
  }).then((data) => {
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading = false
      appState.activeQuestion = {
        role: 'user',
        content: ''
      }
      return
    }

    // Update the chat history with the response from the server
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
