import { ref } from 'vue'
import { validateFileSize, convertJSONtoMarkdown } from '../utils'
import type { ChatHistoryItem, AppState, FileFormState } from '../types'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export function useFileHandling(
  chatHistory: ReturnType<typeof ref<ChatHistoryItem[]>>,
  appState: AppState,
  fileFormState: FileFormState
) {
  const uploadFile = async (e: Event) => {
    const fileInput = e.target as HTMLInputElement
    if (!fileInput.files || fileInput.files.length === 0) {
      appState.writeMessage('No file selected', 'error')
      return
    }
    if (!validateFileSize(fileInput.files[0])) {
      appState.writeMessage('File size is too large. Limit is ' + MAX_SIZE, 'error')
      return
    }
    const formData = new FormData()
    formData.append('file', fileInput.files[0])
    formData.append('chatHistory', JSON.stringify(chatHistory.value))

    try {
      const response = await fetch('/.netlify/functions/open-ai-chat', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        appState.writeMessage('Failed to upload file', 'error')
        return
      }
      const data = await response.json()
      if (data.chatHistory) {
        appState.writeMessage('File uploaded', 'success')
        chatHistory.value = data.chatHistory
      }
    } catch (error) {
      appState.writeMessage('Failed to upload file', 'error')
    }
  }

  const saveToFile = () => {
    const blob = new Blob([convertJSONtoMarkdown(chatHistory.value, appState.userName)], {
      type: 'text/markdown'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    uploadFile,
    saveToFile
  }
}
