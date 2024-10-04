import type { AppState } from '../types'
import { postData } from '../utils'

const geminiQuery = async (
  appState: AppState,
  writeMessage: (message: string, type: string) => void
) => {
  appState.isLoading = true

  appState.activeQuestion = {
    role: 'user',
    content: appState.currentQuery || ''
  }
  await postData(appState.geminiuri, {
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
export { geminiQuery }
