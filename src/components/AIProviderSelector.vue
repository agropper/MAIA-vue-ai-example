<!-- filepath: /src/components/AIProviderSelector.vue -->
<template>
    <div class="provider-selector">
      <q-select
        v-model="selectedProvider"
        :options="availableProviders"
        label="Select AI Provider"
        @update:model-value="handleProviderChange"
      />
      <q-input
        v-if="selectedProvider"
        v-model="apiKey"
        label="API Key"
        type="password"
        outlined
      />
      <q-btn
        v-if="selectedProvider"
        label="Initialize Provider"
        color="primary"
        @click="initializeProvider"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import { useAIStore } from '../stores/ai';
  
  export default defineComponent({
    setup() {
      const aiStore = useAIStore();
      const selectedProvider = ref(null);
      const apiKey = ref('');
      const availableProviders = [
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'OpenAI', value: 'openai' },
        { label: 'Google', value: 'google' },
        { label: 'Mistral', value: 'mistral' },
        { label: 'Deepseek', value: 'deepseek' },
      ];
  
      const handleProviderChange = (value) => {
        selectedProvider.value = value;
      };
  
      const initializeProvider = async () => {
        if (selectedProvider.value && apiKey.value) {
          await aiStore.initializeProvider(selectedProvider.value, {
            apiKey: apiKey.value,
          });
        }
      };
  
      return {
        selectedProvider,
        apiKey,
        availableProviders,
        handleProviderChange,
        initializeProvider,
      };
    },
  });
  </script>