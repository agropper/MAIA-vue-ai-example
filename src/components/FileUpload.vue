<template>
  <q-file v-model="modelValue" filled counter multiple append @input="$emit('input', $event)">
    <template v-slot:prepend>
      <q-icon name="attach_file"></q-icon>
    </template>
  </q-file>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { QFile, QIcon } from 'quasar'

export default defineComponent({
  name: 'FileUpload',
  components: {
    QFile,
    QIcon
  },
  props: {
    modelValue: {
      type: [File, Array],
      default: null
    }
  },
  emits: ['update:modelValue', 'input']
})
</script>
