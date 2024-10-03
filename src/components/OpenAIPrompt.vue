<script setup lang="ts">
import { ref } from 'vue'
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
import {
  getSystemMessageType,
  postData,
  pickFiles,
  validateFileSize,
  convertJSONtoMarkdown,
  checkTimelineSize,
  truncateTimeline
} from '../utils'
import { useChatState } from '../composables/useChatState'
import { showAuth, showJWT } from '../composables/useAuthHandling'
import PopUp from './PopUp.vue'

const { appState, formState, fileFormState, writeMessage } = useChatState()

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const localStorageKey = 'noshuri'

const popupRef = ref<InstanceType<typeof PopUp> | null>(null)

// Helper functions
const showPopup = () => {
  if (popupRef.value && popupRef.value.openPopup) {
    popupRef.value.openPopup()
  }
}

// Save the transcript to Nosh
const saveToNosh = async () => {
  appState.isLoading = true
  writeMessage('Saving to Nosh...', 'success')
  try {
    const response = await fetch(appState.writeuri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.jwt}`
      },
      body: JSON.stringify({
        content: convertJSONtoMarkdown(appState.chatHistory, appState.userName)
      })
    })
    try {
      await response.json()
      writeMessage('Saved to Nosh', 'success')
      appState.isLoading = false
      appState.popupContent = 'Session saved to Nosh. Close this window to end the session.'
      appState.popupContentFunction = closeSession
      showPopup()
    } catch (error) {
      writeMessage('Failed to get valid response.', 'error')
      return null
    }
  } catch (error) {
    writeMessage('Failed to save to Nosh', 'error')
  }
}

// Send query to AI
const sendQuery = () => {
  appState.isLoading = true
  appState.activeQuestion = {
    role: 'user',
    content: formState.currentQuery || ''
  }
  postData('/.netlify/functions/open-ai-chat', {
    chatHistory: appState.chatHistory,
    newValue: formState.currentQuery
  }).then((data) => {
    console.log('DATA', data)
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading = false
      appState.activeQuestion = {
        role: 'user',
        content: ''
      }
      return
    }
    appState.isLoading = false
    appState.activeQuestion = {
      role: 'user',
      content: ''
    }
    appState.chatHistory = data

    formState.currentQuery = ''
    setTimeout(() => {
      window.scrollTo(0, document.body.scrollHeight)
    }, 100)
  })
}

// Upload file to System Content
async function uploadFile(e: Event) {
  let fileInput = e.target as HTMLInputElement
  if (!fileInput.files || fileInput.files.length === 0) {
    writeMessage('No file selected', 'error')
    return
  }
  if (!validateFileSize(fileInput.files[0])) {
    writeMessage('File size is too large. Limit is ' + MAX_SIZE, 'error')
    return
  }
  const formData = new FormData()
  formData.append('file', fileInput.files[0])
  formData.append('appState.chatHistory', JSON.stringify(appState.chatHistory))

  try {
    const response = (await fetch('/.netlify/functions/open-ai-chat', {
      method: 'POST',
      body: formData
    })) as Response

    if (!response.ok) {
      writeMessage('Failed to upload file', 'error')
      return
    }
    const data = await response.json()
    if (data.chatHistory) {
      writeMessage('File uploaded', 'success')
      appState.chatHistory = data.chatHistory
    }
  } catch (error) {
    writeMessage('Failed to upload file', 'error')
  }
}

// Edit Chat Message
const editMessage = (idx: number) => {
  appState.editBox.push(idx)
  return
}

const saveMessage = (idx: number, content: string) => {
  appState.chatHistory[idx].content = content
  appState.editBox.splice(appState.editBox.indexOf(idx), 1)
  return
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
  localStorage.removeItem('gnap')
  sessionStorage.removeItem(localStorageKey)
  window.close()
}
</script>

<template>
  <q-file v-model="fileFormState.file" filled counter multiple append @input="uploadFile">
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
        @click="saveToNosh"
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
          v-model="formState.currentQuery"
          @keyup.enter="sendQuery"
        ></q-input>
        <q-btn color="primary" label="Send" @click="sendQuery" size="sm" />
        <GNAP
          v-if="!appState.isAuthorized"
          name="gnap-btn"
          helper="blue small"
          @on-authorized="showAuth"
          @jwt="showJWT"
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
<script lang="ts">
export default {}
</script>
