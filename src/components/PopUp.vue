<template>
  <q-dialog v-model="isVisible">
    <q-card>
      <q-card-section>
        <VueMarkdown :source="content" class="popup-text" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn :label="buttonText" color="primary" @click="closePopup" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QDialog, QCard, QCardSection, QCardActions, QBtn } from 'quasar'
import VueMarkdown from 'vue-markdown-render'

interface PopupProps {
  content: string
  onClose?: () => void
  buttonText?: string
}

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
