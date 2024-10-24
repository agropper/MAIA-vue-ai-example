import OpenAI from 'openai'

export type ChatHistoryItem = OpenAI.Chat.ChatCompletionMessageParam
export type ChatHistory = ChatHistoryItem[]
type AccessObject = {
  type: string
  actions: string[]
  locations: string[]
  purpose: string
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}
export interface AppState {
  chatHistory: ChatHistory
  editBox: number[]
  userName: string
  message: string
  messageType: string
  isLoading: boolean
  isMessage: boolean
  isModal: boolean
  jwt: string
  isAuthorized: boolean
  isSaving: boolean
  popupContent: string
  popupContentFunction: Function
  activeQuestion: OpenAI.Chat.ChatCompletionMessageParam
  uri: string
  writeuri: string
  localStorageKey: string
  access: AccessObject[]
  currentQuery: string
  currentFile: File | null
  selectedAI: string
  timeline: string
}
