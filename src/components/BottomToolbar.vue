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
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { QBtn, QInput, QCircularProgress } from 'quasar'
import { GNAP } from 'vue3-gnap'

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
      type: Object as PropType<{
        currentQuery: string
        messageType: string
        isMessage: boolean
        message: string
        isLoading: boolean
        access: any[]
        isAuthorized: boolean
      }>,
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
      default: 'Message Chat GPT',
      required: false
    }
  }
})
</script>
