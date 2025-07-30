<template>
  <div class="file-badges">
    <div v-for="file in files" :key="file.id" class="file-badge">
      <q-chip
        :color="getFileTypeColor(file.type)"
        text-color="white"
        :icon="getFileTypeIcon(file.type)"
        :label="`${file.name} (${formatFileSize(file.size)})`"
      />
      <q-btn
        flat
        round
        dense
        icon="visibility"
        size="sm"
        @click="viewFile(file)"
        class="view-btn"
        color="primary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import { QChip, QBtn } from 'quasar'
import type { UploadedFile } from '../types'

export default defineComponent({
  name: 'FileBadge',
  components: {
    QChip,
    QBtn
  },
  props: {
    files: {
      type: Array as PropType<UploadedFile[]>,
      required: true
    }
  },
  methods: {
    getFileTypeColor(type: string): string {
      const colors = {
        transcript: 'blue',
        timeline: 'green',
        pdf: 'teal',
        markdown: 'purple',
        text: 'grey'
      }
      return colors[type as keyof typeof colors] || 'grey'
    },
    getFileTypeIcon(type: string): string {
      const icons = {
        transcript: 'chat',
        timeline: 'timeline',
        pdf: 'picture_as_pdf',
        markdown: 'description',
        text: 'text_snippet'
      }
      return icons[type as keyof typeof icons] || 'insert_drive_file'
    },
    formatFileSize(bytes: number): string {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    },
    viewFile(file: UploadedFile) {
      this.$emit('view-file', file)
    }
  }
})
</script>

<style lang="scss" scoped>
.file-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}

.file-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .q-chip {
    margin-right: 4px;
  }
  
  .view-btn {
    opacity: 0.7;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 1;
    }
  }
}
</style> 