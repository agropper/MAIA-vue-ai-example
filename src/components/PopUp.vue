<template>
  <q-dialog v-model="isVisible">
    <q-card>
      <q-card-actions>
        <q-btn label="Copy" color="secondary" @click="copyToClipboard" />
        <q-btn label="Save Locally" color="secondary" @click="saveMarkdown" />
        <span style="flex: 1; text-align: right">
          <q-btn label="Close" color="primary" @click="closePopup" />;
        </span>
      </q-card-actions>
      <q-card-section>
        <VueMarkdown :source="content" class="popup-text" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog, QCard, QCardSection, QCardActions, QBtn } from 'quasar'
import VueMarkdown from 'vue-markdown-render'
import { useTranscript } from '../composables/useTranscript'
import type { PropType } from 'vue'
import type { AppState } from '../types'
const { generateTimeline } = useTranscript()

export default {
  name: 'PopupComponent',
  components: {
    QDialog,
    QCard,
    QCardSection,
    QCardActions,
    QBtn,
    VueMarkdown
  },
  props: {
    appState: {
      type: Object as PropType<AppState>,
      required: true
    },
    content: {
      type: String,
      default: ''
    },
    onClose: {
      type: Function,
      default: () => {}
    },
    buttonText: {
      type: String,
      default: 'OK'
    }
  },
  data() {
    return {
      isVisible: false
    }
  },
  methods: {
    openPopup() {
      this.isVisible = true
    },
    closePopup() {
      this.isVisible = false
      this.onClose()
    },
    saveMarkdown() {
      const url = URL.createObjectURL(
        new Blob([generateTimeline(this.appState.timeline, this.appState.timelineChunks)], {
          type: 'text/markdown'
        })
      )
      const a = document.createElement('a')
      const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href = url
      a.download = 'timeline-' + currentDate + '.md'
      a.click()
      URL.revokeObjectURL(url)
      this.$q.notify({
        message: 'Content Saved to Markdown File',
        color: 'green',
        position: 'top'
      })
    },
    copyToClipboard() {
      navigator.clipboard
        .writeText(generateTimeline(this.appState.timeline, this.appState.timelineChunks))
        .then(() => {
          this.$q.notify({
            message: 'Content copied to clipboard',
            color: 'green',
            position: 'top'
          })
        })
        .catch((err) => {
          this.$q.notify({
            message: 'Failed to copy content',
            color: 'red',
            position: 'top'
          })
          console.error('Error copying content to clipboard: ', err)
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.popup-text {
  font-family: Arial, sans-serif;
  color: #333;
  line-height: 1.6;

  :deep() {
    p,
    ul,
    ol {
      margin-bottom: 1em;
    }

    ul,
    ol {
      padding-left: 1.5em;
    }

    li {
      margin-bottom: 0.5em;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }

    @for $i from 1 through 6 {
      h#{$i} {
        font-size: #{3.5 - ($i * 0.5)}em;
      }
    }
  }
}
</style>
