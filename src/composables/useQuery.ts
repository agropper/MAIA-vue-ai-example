import type { AppState } from '../types'
import { postData } from '../utils'

const sendQuery = (
  appState: AppState,
  writeMessage: (message: string, type: string) => void,
  uri: string
) => {
  appState.isLoading = true
  appState.activeQuestion = {
    role: 'user',
    content: appState.currentQuery || ''
  }

  postData(uri, {
    chatHistory: appState.chatHistory,
    newValue: appState.currentQuery
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
    appState.isLoading = false
    appState.activeQuestion = {
      role: 'user',
      content: ''
    }
    appState.chatHistory = data

    appState.currentQuery = ''
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  })
}
export { sendQuery }
