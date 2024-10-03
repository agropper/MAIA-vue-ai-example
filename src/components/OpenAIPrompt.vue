<script lang="ts">
import { defineComponent, ref } from 'vue'
import VueMarkdown from 'vue-markdown-render'
import {
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QChatMessage,
  QCircularProgress,
  QFile,
  QIcon,
  QInput
} from 'quasar'
import { GNAP } from 'vue3-gnap'
import { getSystemMessageType, pickFiles, convertJSONtoMarkdown } from '../utils'
import { useChatState } from '../composables/useChatState'
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
    VueMarkdown,
    QBtn,
    QCard,
    QCardActions,
    QCardSection,
    QChatMessage,
    QCircularProgress,
    QFile,
    QIcon,
    QInput,
    GNAP,
    PopUp
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
      // Handle result if needed, e.g., add to chat history or update UI
    }

    const triggerUploadFile = async (file: File) => {
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
  <div class="chat-area" id="chat-area">
    <div v-for="(x, idx) in appState.chatHistory" :key="idx">
      <q-chat-message
        :name="x.role"
        v-if="x.role !== 'system' && !appState.editBox.includes(idx)"
        size="8"
        :sent="x.role === 'user'"
        ><div>
          <q-btn
            dense
            flat
            size="sm"
            icon="edit"
            :class="['edit-button', x.role.toString()]"
            v-if="!appState.editBox.includes(idx)"
            @click="editMessage(idx)"
          ></q-btn>
          <vue-markdown :source="x.content" />
        </div>
      </q-chat-message>
      <q-chat-message
        size="8"
        class="edit-chat"
        :name="x.role"
        :sent="x.role === 'user'"
        v-if="appState.editBox.includes(idx)"
        ><div>
          <textarea v-model="x.content as string" rows="10" />
          <q-btn
            size="sm"
            icon="save"
            color="primary"
            label="Save"
            @click="saveMessage(idx, x.content as string)"
          ></q-btn>
        </div>
      </q-chat-message>
      <q-chat-message :name="x.role" v-if="x.role === 'system'" size="8" sent>
        <q-card color="secondary">
          <q-card-section>
            <vue-markdown
              :source="getSystemMessageType(x.content as string)"
              class="attachment-message"
            />
          </q-card-section>
          <q-card-actions>
            <q-btn
              label="View"
              @click="
                (appState.popupContent = (x.content as string)
                  .split('\n')
                  .splice(1, (x.content as string).split('\n').length - 1)
                  .join('\n')),
                  showPopup()
              "
            ></q-btn>
          </q-card-actions>
        </q-card>
      </q-chat-message>
    </div>
    <q-chat-message name="user" v-if="appState.activeQuestion.content != ''" size="8" sent>
      <vue-markdown :source="appState.activeQuestion.content" />
    </q-chat-message>
    <div class="signature-buttons" v-if="appState.chatHistory.length">
      <q-btn size="sm" color="secondary" label="Save Locally" @click="saveToFile" />
      <q-btn
        size="sm"
        color="secondary"
        label="End, Sign, & Save to Nosh"
        @click="triggerSaveToNosh"
      ></q-btn>
      <q-btn size="sm" color="warning" label="End without Saving" @click="closeNoSave" />
    </div>
  </div>
  <div class="bottom-toolbar">
    <div class="prompt">
      <div class="inner">
        <q-btn @click="pickFiles" flat icon="attach_file" />
        <q-input
          outlined
          placeholder="Message ChatGPT"
          v-model="appState.currentQuery"
          @keyup.enter="triggerSendQuery"
        ></q-input>
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
      <q-circular-progress
        indeterminate
        rounded
        size="30px"
        color="primary"
        class="q-ma-md"
      ></q-circular-progress>
    </div>
  </div>
  <PopUp
    ref="popupRef"
    :content="appState.popupContent"
    button-text="Close"
    :on-close="() => appState.popupContentFunction()"
  />
</template>
