import type { AppState } from '../types'
import { postData } from '../utils'

const mistralQuery = (
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true
  appState.activeQuestion = {
    role: 'user',
    content: appState.currentQuery || ''
  }

  postData(appState.mistraluri, {
    chatHistory: appState.chatHistory,
    newValue: appState.currentQuery
  }).then((data) => {
    console.log('mistralQuery data:', data)
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
export { mistralQuery }
