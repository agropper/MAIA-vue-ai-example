<template>
  <div class="bottom-toolbar">
    <div class="prompt">
      <div class="inner">
        <q-btn @click="$emit('pick-files')" flat icon="attach_file" />
        <q-input
          outlined
          placeholder="Message ChatGPT"
          :model-value="modelValue"
          @update:model-value="$emit('update:modelValue', $event)"
          @keyup.enter="handleSend"
        ></q-input>
        <q-btn color="primary" label="Send" @click="handleSend" size="sm" />
        <GNAP
          v-if="!appState.isAuthorized.value"
          name="gnap-btn"
          helper="blue small"
          @on-authorized="$emit('show-auth')"
          @jwt="$emit('show-jwt', $event)"
          :access="access"
          server="https://shihjay.xyz/api/as"
          label="Connect to NOSH"
        />
      </div>
    </div>
    <div :class="['message', appState.messageType.value]">
      <p v-if="appState.isMessage.value">
        {{ appState.message.value }}
      </p>
    </div>
    <div :class="['loading-pane', { 'is-loading': appState.isLoading.value }]">
      <q-circular-progress
        indeterminate
        rounded
        size="30px"
        color="primary"
        class="q-ma-md"
      ></q-circular-progress>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { QBtn, QInput, QCircularProgress } from 'quasar'
import { GNAP } from 'vue3-gnap'

export default defineComponent({
  name: 'MessageInput',
  components: {
    QBtn,
    QInput,
    QCircularProgress,
    GNAP
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    appState: {
      type: Object,
      required: true
    },
    access: {
      type: Array,
      required: true
    }
  },
  emits: ['update:modelValue', 'send', 'pick-files', 'show-auth', 'show-jwt'],
  setup(props, { emit }) {
    const handleSend = () => {
      console.log('handleSend called')
      try {
        emit('send')
      } catch (error) {
        console.error('Error in handleSend:', error)
      }
    }

    return {
      handleSend
    }
  }
})
</script>

<style scoped>
.bottom-toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 10px;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.prompt {
  display: flex;
  align-items: center;
}

.inner {
  display: flex;
  align-items: center;
  width: 100%;
}

.message {
  margin-top: 10px;
  padding: 5px;
  border-radius: 4px;
}

.message.error {
  background-color: #ffebee;
  color: #c62828;
}

.message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.loading-pane {
  display: none;
  justify-content: center;
  margin-top: 10px;
}

.loading-pane.is-loading {
  display: flex;
}
</style>
