import type { AppState } from '../types'
import { reactive } from 'vue'

export function useChatState() {
  const localStorageKey = 'noshuri'

  // Get URI from querystring or local storage
  const urlParams = new URLSearchParams(window.location.search)
  let uri = urlParams.get('uri')
  if (uri && uri.length > 0) {
    sessionStorage.setItem(localStorageKey, uri)
  } else if (sessionStorage.getItem(localStorageKey)) {
    uri = sessionStorage.getItem(localStorageKey) || ''
  } else {
    uri = ''
  }
  const writeuri = uri.replace('Timeline', 'md')

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
    localStorageKey: localStorageKey,
    access: access,
    currentQuery: '',
    currentFile: null
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
  if (!uri) {
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
  }

  return {
    appState,
    writeMessage
  }
}
