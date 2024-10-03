import type { AppState, ChatHistoryItem, QueryFormState } from '../types'

import type { Ref } from 'vue'
import { postData } from '../utils'

export function useMessageHandling(
  chatHistory: Ref<ChatHistoryItem[]>,
  appState: AppState,
  formState: QueryFormState
) {
  const writeMessage = (message: string, messageType: string) => {
    appState.message.value = message
    appState.messageType.value = messageType
    appState.isMessage.value = true
    setTimeout(() => {
      appState.isMessage.value = false
    }, 5000)
  }

  const sendQuery = () => {
    console.log('sendQuery in useMessageHandling called')
    appState.isLoading.value = true
    appState.activeQuestion.value = {
      role: 'user',
      content: formState.currentQuery || ''
    }
    postData('/.netlify/functions/open-ai-chat', {
      chatHistory: chatHistory.value,
      newValue: formState.currentQuery
    })
      .then((data) => {
        console.log('postData response:', data)
        if (!data || data.message) {
          writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
          appState.isLoading.value = false
          appState.activeQuestion.value = {
            role: 'user',
            content: ''
          }
          return
        }
        appState.isLoading.value = false
        appState.activeQuestion.value = {
          role: 'user',
          content: ''
        }
        chatHistory.value = data

        formState.currentQuery = null
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight)
        }, 100)
      })
      .catch((error) => {
        console.error('Error in postData:', error)
        writeMessage('An error occurred while sending the query', 'error')
        appState.isLoading.value = false
      })
  }

  const editMessage = (idx: number) => {
    appState.editBox.value.push(idx)
  }

  const saveMessage = (idx: number, content: string) => {
    chatHistory.value[idx].content = content
    const index = appState.editBox.value.indexOf(idx)
    if (index !== -1) {
      appState.editBox.value.splice(index, 1)
    }
  }

  return {
    writeMessage,
    sendQuery,
    editMessage,
    saveMessage
  }
}
