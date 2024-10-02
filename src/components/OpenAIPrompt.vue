<script setup lang="ts">
import OpenAI from 'openai'
import { ref, reactive } from 'vue'
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
import PopUp from './PopUp.vue'
import type { ChatHistoryItem, AppState, QueryFormState, FileFormState } from '../types'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const localStorageKey = 'noshuri'
const chatHistory = ref<ChatHistoryItem[]>([])
const appState: AppState = {
  editBox: ref<number[]>([]),
  userName: ref<string>('Demo User'),
  message: ref<string>(''),
  messageType: ref<string>(''),
  isLoading: ref<boolean>(false),
  isMessage: ref<boolean>(false),
  isModal: ref<boolean>(false),
  jwt: ref<string>(''),
  isAuthorized: ref<boolean>(false),
  isSaving: ref<boolean>(false),
  popupContent: ref<string>(''),
  popupContentFunction: ref<Function>(() => {}),
  activeQuestion: ref<OpenAI.Chat.ChatCompletionMessageParam>({
    role: 'user',
    content: ''
  })
}
const popupRef = ref<InstanceType<typeof PopUp> | null>(null)

const formState = reactive<QueryFormState>({
  currentQuery: null
})
const fileFormState = reactive<FileFormState>({
  file: null
})

// Helper functions
const showPopup = () => {
  if (popupRef.value && popupRef.value.openPopup) {
    popupRef.value.openPopup()
  }
}

const writeMessage = (message: string, messageType: string) => {
  appState.message.value = message
  appState.messageType.value = messageType
  appState.isMessage.value = true
  setTimeout(() => {
    appState.isMessage.value = false
  }, 5000)
}

// Get URI from querystring or local storage
const urlParams = new URLSearchParams(window.location.search)
let uri = urlParams.get('uri')
if (uri && uri.length > 0) {
  sessionStorage.setItem(localStorageKey, uri)
} else if (sessionStorage.getItem(localStorageKey)) {
  uri = sessionStorage.getItem(localStorageKey) || ''
} else {
  writeMessage('No URI found in Querystring or LocalStorage', 'error')
  uri = ''
}

// Create access object for GNAP
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
    locations: [uri.replace('Timeline', 'md')],
    purpose: 'MAIA - Testing'
  }
]

// Confirm authorization to Trustee
function showAuth() {
  appState.isAuthorized.value = true
  writeMessage('Authorized', 'success')
}

// Download the patient timeline from Nosh when JWT is received
async function showJWT(jwt: string) {
  if (!uri) {
    writeMessage('No URI found in Querystring or LocalStorage', 'error')
    return
  }
  appState.jwt.value = jwt
  writeMessage('Loading Patient Timeline...', 'success')
  appState.isLoading.value = true
  try {
    await fetch(uri, {
      headers: {
        Authorization: `Bearer ${appState.jwt.value}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        return response.text()
      })
      .then((data) => {
        let timelineCheck = checkTimelineSize(data)
        writeMessage('Checked inbound timeline size. ' + timelineCheck.message, 'success')
        if (timelineCheck.error === true) {
          console.log('Timeline size error. Truncating timeline.', data)
          // Truncate the timeline to fit within the token limit
          data = truncateTimeline(data)
          timelineCheck = checkTimelineSize(data)

          if (timelineCheck.error === true) {
            console.log('Timeline size error after truncation. Clearing session.', data)
            appState.popupContent.value = 'Timeline size is too large even after truncation.'
            appState.popupContentFunction.value = closeSession
            showPopup()
            return
          } else {
            writeMessage('Timeline was truncated to fit within limits.', 'warning')
          }
        }
        chatHistory.value.push({
          role: 'system',
          content: 'timeline\n\nuploaded at ' + new Date().toLocaleString() + '\n\n' + data
        })

        appState.isLoading.value = false
        writeMessage('Patient Timeline Loaded', 'success')
      })
      .catch((error) => {
        console.error('Fatal Error. Closing Session.', error)
        closeSession()
      })
  } catch (error) {
    writeMessage('Failed to fetch Patient Timeline', 'error')
  }
}

// Save the transcript to Nosh
const saveToNosh = async () => {
  appState.isLoading.value = true
  writeMessage('Saving to Nosh...', 'success')
  try {
    const response = await fetch(uri.replace('Timeline', 'md'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${appState.jwt.value}`
      },
      body: JSON.stringify({
        content: convertJSONtoMarkdown(chatHistory.value, appState.userName.value)
      })
    })
    try {
      await response.json()
      writeMessage('Saved to Nosh', 'success')
      appState.isLoading.value = false
      appState.popupContent.value = 'Session saved to Nosh. Close this window to end the session.'
      appState.popupContentFunction.value = closeSession
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
  appState.isLoading.value = true
  appState.activeQuestion.value = {
    role: 'user',
    content: formState.currentQuery || ''
  }
  postData('/.netlify/functions/open-ai-chat', {
    chatHistory: chatHistory.value,
    newValue: formState.currentQuery
  }).then((data) => {
    console.log('DATA', data)
    if (!data || data.message) {
      writeMessage(data ? data.message : 'Failed to get response from AI', 'error')
      appState.isLoading.value = false
      appState.activeQuestion.value = {
        role: 'user',
        content: ''
      }
      return
    }
    appState.isLoading.value = false
    appState.activeQuestion.value = {
      role: 'user',
      content: ''
    }
    chatHistory.value = data

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
  formData.append('chatHistory', JSON.stringify(chatHistory.value))

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
      chatHistory.value = data.chatHistory
    }
  } catch (error) {
    writeMessage('Failed to upload file', 'error')
  }
}

// Edit Chat Message
const editMessage = (idx: number) => {
  appState.editBox.value.push(idx)
  return
}

const saveMessage = (idx: number, content: string) => {
  chatHistory.value[idx].content = content
  appState.editBox.value.splice(appState.editBox.value.indexOf(idx), 1)
  return
}

const saveToFile = () => {
  const blob = new Blob([convertJSONtoMarkdown(chatHistory.value, appState.userName.value)], {
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
  chatHistory.value = []
  appState.isModal.value = false
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
    <div v-for="(x, idx) in chatHistory" :key="idx">
      <q-chat-message
        :name="x.role"
        v-if="x.role !== 'system' && !appState.editBox.value.includes(idx)"
        size="8"
        :sent="x.role === 'user'"
        ><div>
          <q-btn
            dense
            flat
            size="sm"
            icon="edit"
            :class="['edit-button', x.role.toString()]"
            v-if="!appState.editBox.value.includes(idx)"
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
        v-if="appState.editBox.value.includes(idx)"
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
                (appState.popupContent.value = (x.content as string)
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
    <q-chat-message name="user" v-if="appState.activeQuestion.value.content != ''" size="8" sent>
      <vue-markdown :source="appState.activeQuestion.value.content" />
    </q-chat-message>
    <div class="signature-buttons" v-if="chatHistory.length">
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
          v-if="!appState.isAuthorized.value"
          name="gnap-btn"
          helper="blue small"
          @on-authorized="showAuth"
          @jwt="showJWT"
          :access="access"
          server="https://shihjay.xyz/api/as"
          label="Connect to NOSH"
        />
      </div>
    </div>
    <div :class="'message ' + appState.messageType.value">
      <p v-if="appState.isMessage.value">
        {{ appState.message.value }}
      </p>
    </div>
    <div :class="'loading-pane ' + appState.isLoading.value">
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
    :content="appState.popupContent.value"
    button-text="Close"
    :on-close="() => appState.popupContentFunction.value()"
  />
</template>
<script lang="ts">
export default {}
</script>
