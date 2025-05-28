import type { AppState, TimelineChunk } from '../types'
import { onMounted, onUnmounted, reactive, watch } from 'vue'
import OpenAI from 'openai'

const useChatState = () => {
  const localStorageKey = 'noshuri'
  const selectedAILocalStorageKey = 'selectedAI'

  let uri = ''
  let writeuri = ''

  if (typeof window !== 'undefined') {
    // Get URI from querystring
    const urlParams = new URLSearchParams(window.location.search)
    const queryStringUri = urlParams.get('uri')

    // If there's a URI in the querystring, clear storage before setting new values
    if (queryStringUri) {
      sessionStorage.clear()
      localStorage.clear()
      uri = queryStringUri
      sessionStorage.setItem(localStorageKey, uri)
    } else {
      // If no querystring URI, fallback to stored value
      uri = sessionStorage.getItem(localStorageKey) || ''
      if (uri.length > 0) {
        sessionStorage.setItem(localStorageKey, uri)
      }
    }

    writeuri = uri.replace('Timeline', 'md')
  }

  const access = [
    {
      type: 'Timeline',
      actions: ['read'],
      locations: [uri],
      purpose: 'MAIA - Testing'
    },
    {
      type: 'Markdown',
      actions: ['write'],
      locations: [writeuri],
      purpose: 'MAIA - Testing'
    }
  ]

  // Only check storage for selectedAI if we didn't just clear it
  const selectedAIFromStorage =
    typeof window !== 'undefined' && !new URLSearchParams(window.location.search).get('uri')
      ? sessionStorage.getItem(selectedAILocalStorageKey)
      : null

  const appState: AppState = reactive({
    chatHistory: [],
    editBox: [],
    userName: 'Demo User',
    message: '',
    messageType: '',
    isLoading: false,
    isMessage: false,
    isModal: false,
    jwt: '',
    isAuthorized: false,
    isSaving: false,
    popupContent: '',
    popupContentFunction: () => {},
    activeQuestion: {
      role: 'user',
      content: ''
    },
    uri: uri,
    writeuri: writeuri,
    localStorageKey: localStorageKey,
    access: access,
    currentQuery: '',
    currentFile: null,
    selectedAI: selectedAIFromStorage || 'http://localhost:3001/api/anthropic-chat',
    timeline: '',
    timelineChunks: [],
    selectedEpoch: 1,
    hasChunkedTimeline: false
  })

  const writeMessage = (message: string, messageType: string) => {
    console.log(message)
    appState.message = message
    appState.messageType = messageType
    appState.isMessage = true
    setTimeout(() => {
      appState.isMessage = false
    }, 5000)
  }

  // Watch for changes to selectedAI and store the value in localStorage
  watch(
    () => appState.selectedAI,
    (newSelectedAI) => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(selectedAILocalStorageKey, newSelectedAI)
      }
    }
  )

  // Keeping the epoch watcher for now
  watch(
    () => appState.selectedEpoch,
    (newEpoch) => {
      console.log('Selected Epoch:', newEpoch)
      if (appState.hasChunkedTimeline) {
        const selectedChunk = appState.timelineChunks[newEpoch]
        if (selectedChunk) {
          // Update timeline content
          appState.timeline = selectedChunk.content

          // Find and update the system message in chat history
          const systemMessageIndex = appState.chatHistory.findIndex((msg) => msg.role === 'system')
          const newSystemMessage = {
            role: 'system',
            content: `Timeline context (${selectedChunk.dateRange.start} to ${selectedChunk.dateRange.end}):\n\n${selectedChunk.content}`
          } as OpenAI.Chat.ChatCompletionMessageParam

          if (systemMessageIndex !== -1) {
            // Replace existing system message
            appState.chatHistory[systemMessageIndex] = newSystemMessage
          } else if (appState.chatHistory.length === 0) {
            // Add new system message if chat is empty
            appState.chatHistory.push(newSystemMessage)
          }
        }
      }
    }
  )

  // If no URI is found, write an error message
  if (!uri && typeof window !== 'undefined') {
    // writeMessage('No URI found in Querystring or LocalStorage', 'error')
  }

  // Function to clear specific local storage keys
  const clearLocalStorageKeys = () => {
    sessionStorage.removeItem(localStorageKey)
    sessionStorage.removeItem(selectedAILocalStorageKey)
    console.log('Local Storage Keys Cleared')
  }

  // Handle key combination for clearing storage
  const handleKeyCombination = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.altKey && event.key === 'c') {
      clearLocalStorageKeys()
    }
  }

  // Add keydown listener on mount and remove on unmount
  onMounted(() => {
    window.addEventListener('keydown', handleKeyCombination)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyCombination)
  })

  return {
    appState,
    writeMessage,
    clearLocalStorageKeys
  }
}

export { useChatState }
