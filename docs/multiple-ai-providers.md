# Multiple AI Provider Integration Guide

## Overview

This document outlines the architecture and implementation strategy for supporting multiple AI providers in the MAIA Vue AI Example project. The goal is to create a flexible system that allows users to choose between different AI providers while maintaining a consistent interface and user experience.

## Current AI Providers

The project currently supports:
- Anthropic Claude
- OpenAI GPT
- Google Gemini
- Mistral AI
- Deepseek AI

## Architecture Design

### 1. Provider Interface

```typescript
interface AIProvider {
  name: string;
  id: string;
  models: AIModel[];
  sendMessage: (message: string, options?: ProviderOptions) => Promise<AIResponse>;
  getModels: () => Promise<AIModel[]>;
  validateConfig: (config: ProviderConfig) => boolean;
}

interface AIModel {
  id: string;
  name: string;
  maxTokens: number;
  contextWindow: number;
  pricing: {
    input: number;  // cost per 1K tokens
    output: number; // cost per 1K tokens
  };
}

interface ProviderConfig {
  apiKey: string;
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
```

### 2. Implementation Strategy

#### Step 1: Create Provider Factory

```typescript
// src/providers/factory.ts
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { GoogleProvider } from './google';
import { MistralProvider } from './mistral';
import { DeepseekProvider } from './deepseek';

export class ProviderFactory {
  static createProvider(type: string, config: ProviderConfig): AIProvider {
    switch (type) {
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'openai':
        return new OpenAIProvider(config);
      case 'google':
        return new GoogleProvider(config);
      case 'mistral':
        return new MistralProvider(config);
      case 'deepseek':
        return new DeepseekProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
```

#### Step 2: Implement Provider Classes

```typescript
// src/providers/anthropic.ts
export class AnthropicProvider implements AIProvider {
  private config: ProviderConfig;
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async sendMessage(message: string, options?: ProviderOptions): Promise<AIResponse> {
    // Implementation for Anthropic
  }
}

// Similar implementations for other providers...
```

#### Step 3: Update State Management

```typescript
// src/stores/ai.ts
import { defineStore } from 'pinia';
import { ProviderFactory } from '../providers/factory';

export const useAIStore = defineStore('ai', {
  state: () => ({
    currentProvider: null as AIProvider | null,
    providerConfig: {} as Record<string, ProviderConfig>,
    availableModels: [] as AIModel[],
  }),

  actions: {
    async initializeProvider(type: string, config: ProviderConfig) {
      this.currentProvider = ProviderFactory.createProvider(type, config);
      this.providerConfig[type] = config;
      await this.loadModels();
    },

    async loadModels() {
      if (this.currentProvider) {
        this.availableModels = await this.currentProvider.getModels();
      }
    },
  },
});
```

#### Step 4: Update UI Components

```vue
<!-- src/components/AIProviderSelector.vue -->
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
    />
    
    <q-select
      v-if="selectedProvider"
      v-model="selectedModel"
      :options="availableModels"
      label="Select Model"
    />
  </div>
</template>
```

## Configuration Management

### 1. Environment Variables

```env
# .env
VITE_ANTHROPIC_API_KEY=
VITE_OPENAI_API_KEY=
VITE_GOOGLE_API_KEY=
VITE_MISTRAL_API_KEY=
VITE_DEEPSEEK_API_KEY=sk-d15579fad180443888f331c0d5b0b08d
```

### 2. Provider Configuration Storage

```typescript
// src/utils/config.ts
export const saveProviderConfig = (providerId: string, config: ProviderConfig) => {
  localStorage.setItem(`ai_provider_${providerId}`, JSON.stringify(config));
};

export const loadProviderConfig = (providerId: string): ProviderConfig | null => {
  const config = localStorage.getItem(`ai_provider_${providerId}`);
  return config ? JSON.parse(config) : null;
};
```

## Error Handling

```typescript
// src/utils/error-handling.ts
export class AIProviderError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export const handleProviderError = (error: unknown) => {
  if (error instanceof AIProviderError) {
    // Handle specific provider errors
    switch (error.code) {
      case 'API_KEY_INVALID':
        // Handle invalid API key
        break;
      case 'RATE_LIMIT':
        // Handle rate limiting
        break;
      // ... other error cases
    }
  }
  // Handle generic errors
};
```

## Testing Strategy

1. **Unit Tests**
   - Test each provider implementation
   - Test provider factory
   - Test configuration management

2. **Integration Tests**
   - Test provider switching
   - Test model loading
   - Test error handling

3. **Performance Tests**
   - Measure response times
   - Compare token usage
   - Monitor API costs

## Implementation Steps

1. [ ] Create provider interfaces and types
2. [ ] Implement provider factory
3. [ ] Create individual provider implementations
4. [ ] Update state management
5. [ ] Create provider selection UI
6. [ ] Implement configuration storage
7. [ ] Add error handling
8. [ ] Write tests
9. [ ] Update documentation
10. [ ] Add monitoring and analytics

## Considerations

1. **API Rate Limits**
   - Implement rate limiting per provider
   - Add retry mechanisms
   - Monitor usage

2. **Cost Management**
   - Track token usage per provider
   - Implement cost alerts
   - Add usage analytics

3. **Performance**
   - Cache provider responses
   - Implement request queuing
   - Monitor response times

4. **Security**
   - Secure API key storage
   - Implement key rotation
   - Add access controls

## Future Enhancements

1. [I] Add support for custom providers
2. [I] Implement provider fallback mechanism
3. [I] Add provider performance comparison
4. [I] Create provider-specific features
5. [I] Add provider usage analytics dashboard

## References

- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Deepseek AI Documentation](https://platform.deepseek.com/docs) 