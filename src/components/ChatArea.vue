<template>
  <div class="chat-area" id="chat-area">
    <div v-for="(x, idx) in chatHistory" :key="idx">
      <q-chat-message
        :name="x.role"
        v-if="x.role !== 'system' && !appState.editBox.includes(idx)"
        size="8"
        :sent="x.role === 'user'"
      >
        <div>
          <q-btn
            dense
            flat
            size="sm"
            icon="edit"
            :class="['edit-button', x.role.toString()]"
            v-if="!appState.editBox.includes(idx)"
            @click="$emit('edit-message', idx)"
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
      >
        <div>
          <textarea v-model="x.content" rows="10" />
          <q-btn
            size="sm"
            icon="save"
            color="primary"
            label="Save"
            @click="$emit('save-message', idx, x.content)"
          ></q-btn>
        </div>
      </q-chat-message>
      <q-chat-message :name="x.role" v-if="x.role === 'system'" size="8" sent>
        <q-card color="secondary">
          <q-card-section>
            <vue-markdown :source="getSystemMessageType(x.content)" class="attachment-message" />
          </q-card-section>
          <q-card-actions>
            <q-btn label="View" @click="handleViewSystemMessage(x.content)"></q-btn>
          </q-card-actions>
        </q-card>
      </q-chat-message>
    </div>
    <q-chat-message name="user" v-if="appState.activeQuestion.content != ''" size="8" sent>
      <vue-markdown :source="appState.activeQuestion.content" />
    </q-chat-message>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import VueMarkdown from 'vue-markdown-render'
import { QChatMessage, QCard, QCardSection, QCardActions, QBtn } from 'quasar'
import { getSystemMessageType } from '../utils'
import type { ChatHistoryItem } from '../types'

export default defineComponent({
  name: 'ChatArea',
  components: {
    VueMarkdown,
    QChatMessage,
    QCard,
    QCardSection,
    QCardActions,
    QBtn
  },
  props: {
    chatHistory: {
      type: Array as () => ChatHistoryItem[],
      required: true
    },
    appState: {
      type: Object,
      required: true
    }
  },
  emits: ['edit-message', 'save-message', 'update-popup-content', 'show-popup'],
  setup(props, { emit }) {
    const handleViewSystemMessage = (content: string) => {
      const popupContent = content
        .split('\n')
        .splice(1, content.split('\n').length - 1)
        .join('\n')

      emit('update-popup-content', popupContent)
      emit('show-popup')
    }

    return {
      getSystemMessageType,
      handleViewSystemMessage
    }
  }
})
</script>

<style scoped>
.chat-area {
  height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 20px;
}

.edit-button {
  position: absolute;
  right: 10px;
  top: 10px;
}

.edit-button.user {
  left: 10px;
}

.edit-chat textarea {
  width: 100%;
  min-height: 100px;
  margin-bottom: 10px;
}

.attachment-message {
  max-height: 200px;
  overflow-y: auto;
}
</style>
