<script lang="ts">
import { defineComponent, ref } from 'vue'
import { QBtn, QCircularProgress, QFile, QIcon, QInput } from 'quasar'
import { GNAP } from 'vue3-gnap'
import { getSystemMessageType, pickFiles, convertJSONtoMarkdown } from '../utils'
import { useChatState } from '../composables/useChatState'
import ChatArea from './ChatArea.vue'
import {
  showAuth,
  showJWT,
  saveToNosh,
  sendQuery,
  uploadFile
} from '../composables/useAuthHandling'
import PopUp from './PopUp.vue'

export default defineComponent({
  name: 'OpenAIPrompt',
  components: {
    QBtn,
    QCircularProgress,
    QFile,
    QIcon,
    QInput,
    GNAP,
    PopUp,
    ChatArea
  },
  setup() {
    const { appState, writeMessage } = useChatState()
    const localStorageKey = 'noshuri'
    const popupRef = ref<InstanceType<typeof PopUp> | null>(null)

    // Helper functions
    const showPopup = () => {
      if (popupRef.value && popupRef.value.openPopup) {
        popupRef.value.openPopup()
      }
    }

    // Edit Chat Message
    const editMessage = (idx: number) => {
      appState.editBox.push(idx)
    }

    const triggerAuth = () => {
      showAuth(appState, writeMessage)
    }

    const triggerJWT = (jwt: string) => {
      showJWT(jwt, showPopup, closeSession, writeMessage, appState)
    }

    const triggerSaveToNosh = async () => {
      await saveToNosh(appState, writeMessage, showPopup, closeSession)
    }

    const triggerSendQuery = async () => {
      await sendQuery(appState, writeMessage)
      console.log(appState.chatHistory)
      // Handle result if needed, e.g., add to chat history or update UI
    }

    const triggerUploadFile = async (file: File) => {
      console.log('Uploading file:', file)
      await uploadFile(file, appState, writeMessage)
    }

    // Usage example for file upload
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
    }

    const saveToFile = () => {
      const blob = new Blob([convertJSONtoMarkdown(appState.chatHistory, appState.userName)], {
        type: 'text/markdown'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transcript.md'
      a.click()
      URL.revokeObjectURL(url)
    }

    const closeNoSave = () => {
      appState.chatHistory = []
      appState.isModal = false
      closeSession()
    }

    const closeSession = () => {
      appState.isAuthorized = false
      localStorage.removeItem('gnap')
      sessionStorage.removeItem(localStorageKey)
      window.close()
    }

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
      getSystemMessageType,
      pickFiles,
      convertJSONtoMarkdown
    }
  }
})
</script>
<template>
  <q-file v-model="appState.currentFile" filled counter multiple append @input="handleFileUpload">
    <template v-slot:prepend>
      <q-icon name="attach_file"></q-icon>
    </template>
  </q-file>

  <!-- Chat Area Component -->
  <ChatArea
    :appState="appState"
    @edit-message="editMessage"
    @save-message="saveMessage"
    @view-system-message="
      (content) => {
        appState.popupContent = content
        showPopup()
      }
    "
    @save-to-file="saveToFile"
    @trigger-save-to-nosh="triggerSaveToNosh"
    @close-no-save="closeNoSave"
    @get-system-message-type="getSystemMessageType"
  />

  <div class="bottom-toolbar">
    <div class="prompt">
      <div class="inner">
        <q-btn @click="pickFiles" flat icon="attach_file" />
        <q-input
          outlined
          placeholder="Message ChatGPT"
          v-model="appState.currentQuery"
          @keyup.enter="triggerSendQuery"
        />
        <q-btn color="primary" label="Send" @click="triggerSendQuery" size="sm" />
        <GNAP
          v-if="!appState.isAuthorized"
          name="gnap-btn"
          helper="blue small"
          @on-authorized="triggerAuth"
          @jwt="triggerJWT"
          :access="appState.access"
          server="https://trustee.health/api/as"
          label="Connect to NOSH"
        />
      </div>
    </div>
    <div :class="'message ' + appState.messageType">
      <p v-if="appState.isMessage">
        {{ appState.message }}
      </p>
    </div>
    <div :class="'loading-pane ' + appState.isLoading">
      <q-circular-progress indeterminate rounded size="30px" color="primary" class="q-ma-md" />
    </div>
  </div>

  <PopUp
    ref="popupRef"
    :content="appState.popupContent"
    button-text="Close"
    :on-close="() => appState.popupContentFunction()"
  />
</template>
