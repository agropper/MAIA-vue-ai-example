<template>
  <div class="bottom-toolbar">
    <div class="prompt">
      <div class="inner">
        <q-btn @click="pickFiles" flat icon="attach_file" />
        <q-input
          outlined
          :placeholder="placeholderText"
          v-model="appState.currentQuery"
          @keyup.enter="triggerSendQuery"
        >
          <template v-slot:append>
            <q-btn
              v-if="isSpeechSupported"
              flat
              dense
              :icon="isListening ? 'mic' : 'mic_none'"
              :color="isListening ? 'primary' : 'grey'"
              @click="toggleSpeechRecognition"
            />
          </template>
        </q-input>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import type { PropType } from 'vue'
import { QBtn, QInput, QCircularProgress } from 'quasar'
import { GNAP } from 'vue3-gnap'
import type { AppState } from '../types'

export default defineComponent({
  name: 'BottomToolbar',
  components: {
    QBtn,
    QInput,
    QCircularProgress,
    GNAP
  },
  props: {
    appState: {
      type: Object as PropType<AppState>,
      required: true
    },
    pickFiles: {
      type: Function as PropType<(evt: Event) => void>,
      required: true
    },
    triggerSendQuery: {
      type: Function as PropType<() => void>,
      required: true
    },
    triggerAuth: {
      type: Function as PropType<() => void>,
      required: true
    },
    triggerJWT: {
      type: Function as PropType<(...args: any[]) => any>,
      required: true
    },
    placeholderText: {
      type: String,
      default: 'Message Anthropic',
      required: false
    }
  },
  setup(props) {
    const isListening = ref(false)
    const recognition = ref<SpeechRecognition | null>(null)
    const isSpeechSupported = ref(false)
    const pauseTimer = ref<number | null>(null)
    const finalTranscript = ref('')
    const interimTranscript = ref('')

    const PAUSE_THRESHOLD = 1500 // 1.5 seconds of silence before submitting

    const handleSubmitAfterPause = () => {
      if (finalTranscript.value.trim()) {
        props.appState.currentQuery = finalTranscript.value.trim()
        props.triggerSendQuery()
        finalTranscript.value = ''
        interimTranscript.value = ''
        if (recognition.value) {
          recognition.value.stop()
        }
      }
    }

    // Reset the pause timer
    const resetPauseTimer = () => {
      if (pauseTimer.value) {
        clearTimeout(pauseTimer.value)
      }
      pauseTimer.value = window.setTimeout(handleSubmitAfterPause, PAUSE_THRESHOLD)
    }

    // Check if speech recognition is supported
    const initSpeechRecognition = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
        recognition.value = new SpeechRecognition()
        recognition.value.continuous = true
        recognition.value.interimResults = true
        isSpeechSupported.value = true

        recognition.value.onresult = (event) => {
          interimTranscript.value = ''

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript.value += event.results[i][0].transcript
              // Update the input field immediately with final results
              props.appState.currentQuery = finalTranscript.value
              resetPauseTimer()
            } else {
              interimTranscript.value += event.results[i][0].transcript
              // Show interim results in the input field
              props.appState.currentQuery = finalTranscript.value + interimTranscript.value
            }
          }
        }

        recognition.value.onend = () => {
          isListening.value = false
          // Submit any remaining final transcript
          handleSubmitAfterPause()
        }

        recognition.value.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          isListening.value = false
          if (pauseTimer.value) {
            clearTimeout(pauseTimer.value)
          }
        }
      }
    }

    const toggleSpeechRecognition = () => {
      if (!recognition.value) return

      if (isListening.value) {
        recognition.value.stop()
        isListening.value = false
        if (pauseTimer.value) {
          clearTimeout(pauseTimer.value)
        }
      } else {
        finalTranscript.value = ''
        interimTranscript.value = ''
        recognition.value.start()
        isListening.value = true
      }
    }

    // Initialize speech recognition on component mount
    initSpeechRecognition()

    return {
      isListening,
      isSpeechSupported,
      toggleSpeechRecognition
    }
  }
})
</script>

<style scoped>
.inner {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
