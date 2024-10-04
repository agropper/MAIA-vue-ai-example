import type { AppState } from '../types'
import { reactive } from 'vue'

export function useChatState() {
  const localStorageKey = 'noshuri'

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
    localStorageKey: localStorageKey,
    access: access,
    currentQuery: '',
    currentFile: null,
    geminiChat: null
  })

  const writeMessage = (message: string, messageType: string) => {
    appState.message = message
    appState.messageType = messageType
    appState.isMessage = true
    setTimeout(() => {
      appState.isMessage = false
    }, 5000)
  }

  // If no URI is found, write an error message
  if (!uri && typeof window !== 'undefined') {
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
  }

  return {
    appState,
    writeMessage
  }
}
