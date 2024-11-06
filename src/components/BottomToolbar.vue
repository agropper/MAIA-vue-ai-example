<template>
  <div class="bottom-toolbar">
    <div class="prompt">
      <div class="inner">
        <q-select
          v-if="appState.timelineChunks?.length"
          outlined
          dense
          v-model="appState.selectedEpoch"
          :options="epochOptions"
          label="Select Timeline Epoch"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>Epoch {{ scope.opt.value }}</q-item-label>
                <q-item-label caption>
                  {{ getChunkDates(scope.opt.value) }}
                  ({{ getChunkTokenCount(scope.opt.value) }} tokens)
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:selected>
            <q-item>
              <q-item-section>
                <q-item-label>Epoch {{ appState.selectedEpoch.value || appState.selectedEpoch }}</q-item-label>
                <q-item-label caption>
                  {{ getChunkDates(appState.selectedEpoch.value || appState.selectedEpoch)  }}
                  ({{ getChunkTokenCount(appState.selectedEpoch.value || appState.selectedEpoch) }}  tokens)
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>
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
      <p v-if="appState.isMessage">{{ appState.message }}</p>
    </div>

    <div :class="'loading-pane ' + appState.isLoading">
      <q-circular-progress indeterminate rounded size="30px" color="primary" class="q-ma-md" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import type { PropType } from 'vue'
import { QBtn, QInput, QCircularProgress, QSelect, QItem, QItemSection, QItemLabel } from 'quasar'
import { GNAP } from 'vue3-gnap'
import type { AppState } from '../types'
import {
  createEpochOptions,
  getChunkDates,
  getChunkTokenCount,
  initSpeechRecognition,
  PAUSE_THRESHOLD,
  pickFiles
} from '../utils'

export default defineComponent({
  name: 'BottomToolbar',
  
  components: {
    QBtn,
    QInput,
    QCircularProgress,
    QSelect,
    QItem,
    QItemSection,
    QItemLabel,
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
    },
    clearLocalStorageKeys: {
      type: Function as PropType<() => void>,
      required: true
    }
  },

  setup(props) {
    const isListening = ref(false)
    const recognition = ref<SpeechRecognition | null>(null)
    const isSpeechSupported = ref(false)
    const pauseTimer = ref<number | null>(null)
    const finalTranscript = ref('')
    const interimTranscript = ref('')

    const epochOptions = computed(() => 
      createEpochOptions(props.appState.timelineChunks)
    )

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

    const resetPauseTimer = () => {
      if (pauseTimer.value) {
        clearTimeout(pauseTimer.value)
      }
      pauseTimer.value = window.setTimeout(handleSubmitAfterPause, PAUSE_THRESHOLD)
    }

    recognition.value = initSpeechRecognition(
      (transcript) => {
        finalTranscript.value += transcript
        props.appState.currentQuery = finalTranscript.value
        resetPauseTimer()
      },
      (transcript) => {
        interimTranscript.value = transcript
        props.appState.currentQuery = finalTranscript.value + interimTranscript.value
      },
      () => {
        isListening.value = false
        handleSubmitAfterPause()
      },
      (error) => {
        console.error('Speech recognition error:', error)
        isListening.value = false
        if (pauseTimer.value) {
          clearTimeout(pauseTimer.value)
        }
      }
    )

    isSpeechSupported.value = recognition.value !== null

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

    return {
      isListening,
      isSpeechSupported,
      toggleSpeechRecognition,
      epochOptions,
      getChunkDates: (epoch: number) => getChunkDates(epoch, props.appState.timelineChunks),
      getChunkTokenCount: (epoch: number) => getChunkTokenCount(epoch, props.appState.timelineChunks)
    }
  }
})
</script>