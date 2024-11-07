<template>
  <div class="chat-area" id="chat-area">
    <div v-for="(x, idx) in appState.chatHistory" :key="idx">
      <!-- Normal Chat Message -->
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
            @click="editMessage(idx)"
          />
          <vue-markdown :source="x.content" />
        </div>
      </q-chat-message>

      <!-- Editable Chat Message -->
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
            @click="saveMessage(idx, x.content)"
          />
        </div>
      </q-chat-message>

      <!-- System Message -->
      <q-chat-message :name="x.role" v-if="x.role === 'system'" size="8" sent>
        <q-card color="secondary">
          <q-card-section>
            <vue-markdown :source="getSystemMessageType(x.content)" class="attachment-message" />
          </q-card-section>
          <q-card-actions>
            <q-btn label="View" @click="viewSystemMessage(x.content)" />
          </q-card-actions>
        </q-card>
      </q-chat-message>
    </div>

    <!-- Active Question -->
    <q-chat-message name="user" v-if="appState.activeQuestion.content !== ''" size="8" sent>
      <vue-markdown :source="appState.activeQuestion.content" />
    </q-chat-message>

    <!-- Signature Buttons -->
    <div class="signature-buttons" v-if="appState.chatHistory.length">
      <q-btn size="sm" color="secondary" label="Save Locally" @click="saveToFile" />
      <q-btn
        size="sm"
        color="secondary"
        label="End, Sign, & Save to Nosh"
        @click="triggerSaveToNosh"
      />
      <q-btn size="sm" color="warning" label="End without Saving" @click="closeNoSave" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { QBtn, QChatMessage, QCard, QCardSection, QCardActions } from 'quasar'
import VueMarkdown from 'vue-markdown-render'
import { getSystemMessageType } from '../utils'

export default defineComponent({
  name: 'ChatArea',
  components: {
    QBtn,
    QChatMessage,
    QCard,
    QCardSection,
    QCardActions,
    VueMarkdown
  },
  props: {
    appState: {
      type: Object,
      required: true
    }
  },
  methods: {
    editMessage(idx: number) {
      this.$emit('edit-message', idx)
    },
    saveMessage(idx: number, content: string) {
      this.$emit('save-message', idx, content)
    },
    viewSystemMessage(content: string) {
      const systemContent = content.split('\n').splice(1).join('\n')
      this.$emit('view-system-message', systemContent)
    },
    saveToFile() {
      this.$emit('save-to-file')
    },
    triggerSaveToNosh() {
      this.$emit('trigger-save-to-nosh')
    },
    closeNoSave() {
      this.$emit('close-no-save')
    },
    getSystemMessageType
  }
})
</script>
