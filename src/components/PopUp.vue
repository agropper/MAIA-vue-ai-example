<template>
  <q-dialog v-model="isVisible">
    <q-card>
      <q-card-actions align="right">
        <q-btn :label="buttonText" color="primary" @click="closePopup" />
        <q-btn label="Copy" color="secondary" @click="copyToClipboard" />
        <q-btn label="Save Locally" color="secondary" @click="saveMarkdown" />
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
      const blob = new Blob([this.content], {
        type: 'text/markdown'
      })
      const url = URL.createObjectURL(blob)
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
        .writeText(this.content)
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
