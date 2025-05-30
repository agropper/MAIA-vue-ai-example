<script lang="ts">
import { defineComponent, ref } from 'vue'
import { QFile, QIcon, QBtnToggle } from 'quasar'
import { getSystemMessageType, pickFiles } from '../utils'
import { useChatState } from '../composables/useChatState'
import { useChatLogger } from '../composables/useChatLogger'
import { useTranscript } from '../composables/useTranscript'
import ChatArea from './ChatArea.vue'
import BottomToolbar from './BottomToolbar.vue'
import { showAuth, showJWT, saveToNosh, uploadFile } from '../composables/useAuthHandling'
import { sendQuery } from '../composables/useQuery'
import PopUp from './PopUp.vue'
import { API_BASE_URL } from '../utils/apiBase'

const AIoptions = [
  { label: 'Personal Chat', value: `${API_BASE_URL}/personal-chat` },
  { label: 'Anthropic', value: `${API_BASE_URL}/anthropic-chat` },
  // { label: 'Chat GPT', value: 'http://localhost:3001/api/open-ai-chat' },
  { label: 'Gemini', value: `${API_BASE_URL}/gemini-chat` },
  // { label: 'Mistral', value: 'http://localhost:3001/api/mistral-chat' },
  // { label: 'DeepSeek', value: `${API_BASE_URL}/deepseek-chat` },
  { label: 'DeepSeek R1', value: `${API_BASE_URL}/deepseek-r1-chat` },
  //{ label: 'DigitalOcean GenAI', value: `${API_BASE_URL}/digitalocean-genai-chat` }
]

export default defineComponent({
  name: 'ChatPrompt',
  components: {
    BottomToolbar,
    QFile,
    QIcon,
    PopUp,
    ChatArea,
    QBtnToggle
  },
  computed: {
    placeholderText() {
      const personalChatValue = this.AIoptions.find((option) => option.label === 'Personal Chat')?.value;
      if (
        this.appState.chatHistory.length === 0 &&
        this.appState.selectedAI === personalChatValue
      ) {
        return 'Click Send for patient summary';
      }
      return `Message ${this.AIoptions.find((option) => option.value === this.appState.selectedAI)?.label}`;
    },
    aiOption() {
      return this.AIoptions.filter((option) => option.value === this.appState.selectedAI)
        ? this.AIoptions.filter((option) => option.value === this.appState.selectedAI)
        : [this.AIoptions[0]]
    }
  },
  setup() {
    const { appState, writeMessage, clearLocalStorageKeys } = useChatState()
    const { logMessage, logContextSwitch, logSystemEvent, setTimelineChunks } = useChatLogger()
    const { generateTranscript } = useTranscript()
    const localStorageKey = 'noshuri'
    const popupRef = ref<InstanceType<typeof PopUp> | null>(null)

    const showPopup = () => {
      if (popupRef.value && popupRef.value.openPopup) {
        popupRef.value.openPopup()
      }
    }

    const editMessage = (idx: number) => {
      appState.editBox.push(idx)
      logSystemEvent('Message edit initiated', { messageIndex: idx }, appState)
    }

    const triggerAuth = () => {
      showAuth(appState, writeMessage)
      logSystemEvent('Authentication triggered', {}, appState)
    }

    const triggerJWT = (jwt: string) => {
      showJWT(jwt, writeMessage, appState, closeSession, showPopup)
      logSystemEvent('JWT provided', { jwt }, appState)
    }

    const triggerSaveToNosh = async () => {
      await saveToNosh(appState, writeMessage, showPopup, closeSession)
      logSystemEvent('Saved to NOSH', {}, appState)
    }

    const triggerSendQuery = async () => {
      // If Personal Chat is selected and chatHistory is empty, only use the default if the input is empty or matches the default
      const personalChatValue = AIoptions.find((option) => option.label === 'Personal Chat')?.value;
      const defaultPrompt = 'Show patient summary';
      if (
        appState.selectedAI === personalChatValue &&
        appState.chatHistory.length === 0
      ) {
        // If the user has typed something, use that instead of the default
        if (!appState.currentQuery || appState.currentQuery.trim() === '' || appState.currentQuery.trim() === defaultPrompt) {
          appState.currentQuery = defaultPrompt;
        }
        // Otherwise, use what the user typed (do nothing)
      }
      await sendQuery(appState, writeMessage, appState.selectedAI, AIoptions)
      logMessage({
        role: 'user',
        content: `Sent query to ${appState.selectedAI}`
      })
    }

    const triggerUploadFile = async (file: File) => {
      await uploadFile(file, appState, writeMessage)
      logSystemEvent('File uploaded', { fileName: file.name }, appState)
    }

    const handleFileUpload = (event: Event) => {
      const files = (event.target as HTMLInputElement).files
      if (files && files.length > 0) {
        triggerUploadFile(files[0])
      }
    }

    const saveMessage = (idx: number, content: string) => {
      appState.chatHistory[idx].content = content
      const index = appState.editBox.indexOf(idx)
      if (index > -1) {
        appState.editBox.splice(index, 1)
      }
      logMessage({
        role: 'user',
        content: `Saved message at index ${idx}`
      })
    }

    const saveToFile = () => {
      const transcriptContent = generateTranscript(appState, true)
      const blob = new Blob([transcriptContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transcript.md'
      a.click()
      URL.revokeObjectURL(url)
      logSystemEvent('Transcript saved to file', {}, appState)
    }

    const closeNoSave = () => {
      appState.chatHistory = []
      appState.isModal = false
      closeSession()
      logSystemEvent('Session closed without saving', {}, appState)
    }

    const closeSession = () => {
      appState.isAuthorized = false
      localStorage.removeItem('gnap')
      sessionStorage.removeItem(localStorageKey)
      window.close()
      logSystemEvent('Session closed', {}, appState)
    }

    // Call this to initialize timeline chunks, assuming you have them in `appState.timelineChunks`
    setTimelineChunks(appState.timelineChunks, appState)

    return {
      appState,
      writeMessage,
      localStorageKey,
      popupRef,
      showPopup,
      editMessage,
      triggerAuth,
      triggerJWT,
      triggerSaveToNosh,
      triggerSendQuery,
      triggerUploadFile,
      handleFileUpload,
      saveMessage,
      saveToFile,
      closeNoSave,
      closeSession,
      clearLocalStorageKeys,
      getSystemMessageType,
      pickFiles,
      AIoptions
    }
  }
})
</script>

<template>
  <!-- AI Selection Toggle -->
  <!--
  <q-btn-toggle
    v-if="appState.chatHistory.length === 0"
    v-model="appState.selectedAI"
    toggle-color="primary"
    :options="AIoptions"
  >
  </q-btn-toggle>
  <q-btn-toggle
    v-if="appState.chatHistory.length > 0"
    v-model="appState.selectedAI"
    color="primary"
    :options="aiOption"
  >
  </q-btn-toggle>
  -->

  <!-- File Upload -->
  <q-file v-model="appState.currentFile" filled counter multiple append @input="handleFileUpload">
    <template v-slot:prepend>
      <q-icon name="attach_file"></q-icon>
    </template>
  </q-file>

  <!-- Chat Area Component -->
  <ChatArea
    :appState="appState"
    :AIoptions="AIoptions"
    @edit-message="editMessage"
    @save-message="saveMessage"
    @view-system-message="
      (content: string) => {
        appState.popupContent = content
        showPopup()
      }
    "
    @save-to-file="saveToFile"
    @trigger-save-to-nosh="triggerSaveToNosh"
    @close-no-save="closeNoSave"
    @get-system-message-type="getSystemMessageType"
  />

  <!-- Bottom Toolbar -->
  <BottomToolbar
    :appState="appState"
    :pickFiles="pickFiles"
    :triggerSendQuery="triggerSendQuery"
    :triggerAuth="triggerAuth"
    :triggerJWT="triggerJWT"
    :placeholderText="placeholderText"
    :clearLocalStorageKeys="clearLocalStorageKeys"
    :AIoptions="AIoptions"
  />

  <!-- Popup for displaying system messages -->
  <PopUp
    ref="popupRef"
    :appState="appState"
    :content="appState.popupContent"
    button-text="Close"
    :on-close="() => appState.popupContentFunction()"
  />
</template>
