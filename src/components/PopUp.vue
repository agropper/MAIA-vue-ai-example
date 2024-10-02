<script setup lang="ts">
import { ref } from 'vue'
import { QDialog, QCard, QCardSection, QCardActions, QBtn } from 'quasar'
import VueMarkdown from 'vue-markdown-render'

interface PopupProps {
  content: string
  onClose?: () => void
  buttonText?: string
}

const props = withDefaults(defineProps<PopupProps>(), {
  content: '',
  onClose: () => {},
  buttonText: 'OK'
})

const isVisible = ref(false)

const openPopup = () => {
  isVisible.value = true
}

const closePopup = () => {
  isVisible.value = false
  props.onClose()
}

defineExpose({ openPopup })
</script>

<template>
  <q-dialog v-model="isVisible">
    <q-card>
      <q-card-section>
        <VueMarkdown :source="content" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn :label="buttonText" color="primary" @click="closePopup" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
export default {}
</script>
