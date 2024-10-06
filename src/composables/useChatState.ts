import { reactive, watch } from 'vue'

import type { AppState } from '../types'

const useChatState = () => {
  const localStorageKey = 'noshuri'
  const selectedAILocalStorageKey = 'selectedAI'

  let uri = ''
  let writeuri = ''

  if (typeof window !== 'undefined') {
    // Get URI from querystring or local storage in the browser environment
    const urlParams = new URLSearchParams(window.location.search)
    uri = urlParams.get('uri') || sessionStorage.getItem(localStorageKey) || ''
    if (uri.length > 0) {
      sessionStorage.setItem(localStorageKey, uri)
    }
    writeuri = uri.replace('Timeline', 'md')
  }

  const access = [
    {
      type: 'App',
      actions: ['read'],
      locations: [uri],
      purpose: 'MAIA - Testing'
    },
    {
      type: 'App',
      actions: ['write'],
      locations: [writeuri],
      purpose: 'MAIA - Testing'
    }
  ]

  // Check if selectedAI is already set in localStorage
  const selectedAIFromStorage =
    typeof window !== 'undefined' ? localStorage.getItem(selectedAILocalStorageKey) : null

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
    queryuri: '/.netlify/functions/open-ai-chat',
    geminiuri: '/.netlify/functions/gemini-chat',
    mistraluri: '/.netlify/functions/mistral-chat',
    localStorageKey: localStorageKey,
    access: access,
    currentQuery: '',
    currentFile: null,
    selectedAI: selectedAIFromStorage || 'chatGPT' // Initialize from localStorage if available
  })

  const writeMessage = (message: string, messageType: string) => {
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
        localStorage.setItem(selectedAILocalStorageKey, newSelectedAI)
      }
    }
  )

  // If no URI is found, write an error message
  if (!uri && typeof window !== 'undefined') {
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
  }

  return {
    appState,
    writeMessage
  }
}
export { useChatState }
