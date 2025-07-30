import { reactive } from 'vue'
import type { AppState, ChatHistory, ChatHistoryItem, UploadedFile } from '../types'

export const useChatState = () => {
  const appState: AppState = reactive({
    chatHistory: [],
    editBox: [],
    userName: '',
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
    uri: '',
    writeuri: '',
    localStorageKey: 'chat-history',
    access: [],
    currentQuery: '',
    currentFile: null,
    selectedAI: '/api/personal-chat',
    timeline: '',
    timelineChunks: [],
    selectedEpoch: 0,
    hasChunkedTimeline: false,
    uploadedFiles: []
  })

  const setChatHistory = (history: ChatHistory) => {
    appState.chatHistory = history
  }

  const addMessage = (message: ChatHistoryItem) => {
    appState.chatHistory.push(message)
  }

  const clearChat = () => {
    appState.chatHistory = []
    appState.uploadedFiles = []
  }

  const setLoading = (loading: boolean) => {
    appState.isLoading = loading
  }

  const setCurrentQuery = (query: string) => {
    appState.currentQuery = query
  }

  const setSelectedAI = (ai: string) => {
    appState.selectedAI = ai
  }

  const setTimeline = (timeline: string) => {
    appState.timeline = timeline
  }

  const setUploadedFiles = (files: UploadedFile[]) => {
    appState.uploadedFiles = files
  }

  const addUploadedFile = (file: UploadedFile) => {
    appState.uploadedFiles.push(file)
  }

  const removeUploadedFile = (fileId: string) => {
    appState.uploadedFiles = appState.uploadedFiles.filter(f => f.id !== fileId)
  }

  const writeMessage = (message: string, messageType: string) => {
    appState.message = message
    appState.messageType = messageType
    appState.isMessage = true
    setTimeout(() => {
      appState.isMessage = false
    }, 5000)
  }

  const clearLocalStorageKeys = () => {
    sessionStorage.removeItem('noshuri')
    sessionStorage.removeItem('selectedAI')
    console.log('Local Storage Keys Cleared')
  }

  return {
    appState,
    setChatHistory,
    addMessage,
    clearChat,
    setLoading,
    setCurrentQuery,
    setSelectedAI,
    setTimeline,
    setUploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    writeMessage,
    clearLocalStorageKeys
  }
}
