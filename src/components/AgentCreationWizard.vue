<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 700px; max-width: 900px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">🤖 Agent Creation Wizard</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Wizard Progress -->
        <q-stepper
          v-model="currentStep"
          ref="stepper"
          color="primary"
          animated
          class="wizard-stepper"
        >
          <!-- Step 1: Agent Details -->
          <q-step
            :name="1"
            title="Agent Details"
            icon="smart_toy"
            :done="currentStep > 1"
          >
            <div class="text-subtitle1 q-mb-md">Step 1: Configure Your Agent</div>
            
            <q-input
              v-model="agentForm.name"
              label="Agent Name"
              outlined
              dense
              :rules="[val => !!val || 'Agent name is required']"
              class="q-mb-md"
              placeholder="e.g., MAIA Medical Assistant"
            />
            
            <q-input
              v-model="agentForm.description"
              label="Description"
              outlined
              dense
              type="textarea"
              rows="2"
              class="q-mb-md"
              placeholder="Brief description of your agent's purpose"
            />

            <div class="row q-gutter-md">
              <q-btn
                label="Next"
                color="primary"
                @click="nextStep"
                :disable="!agentForm.name"
              />
              <q-btn
                label="Cancel"
                flat
                v-close-popup
              />
            </div>
          </q-step>

          <!-- Step 2: Model Selection -->
          <q-step
            :name="2"
            title="AI Model"
            icon="psychology"
            :done="currentStep > 2"
          >
            <div class="text-subtitle1 q-mb-md">Step 2: Choose AI Model</div>
            
            <div v-if="loadingModels" class="text-center q-pa-md">
              <q-spinner size="2rem" color="primary" />
              <div class="text-caption q-mt-sm">Loading available models...</div>
            </div>
            
            <div v-else>
              <q-select
                v-model="agentForm.model_uuid"
                :options="availableModels"
                label="Select AI Model"
                outlined
                dense
                class="q-mb-md"
                :rules="[val => !!val || 'Please select a model']"
                option-label="name"
                option-value="uuid"
                emit-value
                map-options
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.name }}</q-item-label>
                      <q-item-label caption>{{ scope.opt.uuid }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <div v-if="selectedModel" class="q-mb-md">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle2">Selected Model Details</div>
                    <div class="text-caption">
                      <strong>Name:</strong> {{ selectedModel.name }}<br>
                      <strong>UUID:</strong> {{ selectedModel.uuid }}<br>
                      <strong>Version:</strong> {{ selectedModel.version?.major || 'N/A' }}<br>
                      <strong>Provider:</strong> {{ getModelProvider(selectedModel.name) }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <div class="row q-gutter-md">
              <q-btn
                label="Back"
                flat
                @click="previousStep"
              />
              <q-btn
                label="Next"
                color="primary"
                @click="nextStep"
                :disable="!agentForm.model_uuid"
              />
            </div>
          </q-step>

          <!-- Step 3: Agent Configuration -->
          <q-step
            :name="3"
            title="Configuration"
            icon="settings"
            :done="currentStep > 3"
          >
            <div class="text-subtitle1 q-mb-md">Step 3: Agent Configuration</div>
            
            <q-input
              v-model="agentForm.instruction"
              label="Agent Instructions"
              outlined
              dense
              type="textarea"
              rows="4"
              placeholder="You are a medical AI assistant for the patient. You have access to their health records and can provide personalized medical guidance. Always maintain patient privacy and provide evidence-based recommendations."
              class="q-mb-md"
            />

            <q-input
              v-model="agentForm.project_id"
              label="Project ID (Optional)"
              outlined
              dense
              class="q-mb-md"
              placeholder="Leave empty to use default workspace"
            />

            <q-input
              v-model="agentForm.region"
              label="Region"
              outlined
              dense
              class="q-mb-md"
              placeholder="tor1"
            />

            <div class="row q-gutter-md">
              <q-btn
                label="Back"
                flat
                @click="previousStep"
              />
              <q-btn
                label="Create Agent"
                color="primary"
                @click="createAgent"
                :loading="isCreating"
              />
            </div>
          </q-step>

          <!-- Step 4: Knowledge Base Setup -->
          <q-step
            :name="4"
            title="Knowledge Base"
            icon="library_books"
            :done="currentStep > 4"
          >
            <div class="text-subtitle1 q-mb-md">Step 4: Knowledge Base Setup</div>
            
            <div v-if="createdAgent" class="q-mb-md">
              <q-card color="positive" text-color="white">
                <q-card-section>
                  <div class="row items-center">
                    <q-icon name="check_circle" size="2rem" />
                    <div class="q-ml-md">
                      <div class="text-h6">Agent Created Successfully!</div>
                      <div class="text-caption">{{ createdAgent.name }}</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div class="text-body2 q-mb-md">
              Your agent has been created successfully. You can now:
            </div>

            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="library_books" color="secondary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Create a Knowledge Base</q-item-label>
                  <q-item-label caption>Add documents and data for your agent to learn from</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    label="Create KB"
                    color="secondary"
                    size="sm"
                    @click="createKnowledgeBase"
                    :loading="isCreatingKB"
                  />
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-icon name="settings" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Configure Agent Settings</q-item-label>
                  <q-item-label caption>Fine-tune your agent's behavior and capabilities</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    label="Configure"
                    color="primary"
                    size="sm"
                    @click="configureAgent"
                  />
                </q-item-section>
              </q-item>
            </q-list>

            <div class="row q-gutter-md q-mt-md">
              <q-btn
                label="Finish"
                color="positive"
                @click="finishWizard"
              />
            </div>
          </q-step>
        </q-stepper>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { 
  QDialog, 
  QCard, 
  QCardSection, 
  QSpace, 
  QBtn, 
  QIcon, 
  QForm, 
  QInput, 
  QSelect,
  QStepper,
  QStep,
  QSpinner,
  QList,
  QItem,
  QItemSection,
  QItemLabel
} from 'quasar'

interface DigitalOceanModel {
  uuid: string
  name: string
  version?: { major: number }
  is_foundational?: boolean
  upload_complete?: boolean
  created_at?: string
  updated_at?: string
  parent_uuid?: string
  agreement?: {
    uuid: string
    name: string
    description: string
    url: string
  }
}

interface DigitalOceanAgent {
  id: string
  name: string
  description: string
  model_uuid: string
  instruction: string
  project_id?: string
  region?: string
  tags?: string[]
}

export default defineComponent({
  name: 'AgentCreationWizard',
  components: {
    QDialog,
    QCard,
    QCardSection,
    QSpace,
    QBtn,
    QIcon,
    QForm,
    QInput,
    QSelect,
    QStepper,
    QStep,
    QSpinner,
    QList,
    QItem,
    QItemSection,
    QItemLabel
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'agent-created'],
  setup(props, { emit }) {
    const $q = useQuasar()
    
    const showDialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const currentStep = ref(1)
    const loadingModels = ref(false)
    const isCreating = ref(false)
    const isCreatingKB = ref(false)
    const availableModels = ref<DigitalOceanModel[]>([])
    const createdAgent = ref<DigitalOceanAgent | null>(null)

    const agentForm = ref({
      name: 'MAIA Medical Assistant',
      description: 'Personal AI agent for healthcare assistance',
      model_uuid: '',
      instruction: 'You are a medical AI assistant for the patient. You have access to their health records and can provide personalized medical guidance. Always maintain patient privacy and provide evidence-based recommendations.',
      project_id: '',
      region: 'tor1',
      tags: ['Personal']
    })

    const selectedModel = computed(() => {
      return availableModels.value.find(model => model.uuid === agentForm.value.model_uuid)
    })

    const getModelProvider = (modelName: string) => {
      if (modelName.includes('Claude')) return 'Anthropic'
      if (modelName.includes('GPT') || modelName.includes('o3')) return 'OpenAI'
      if (modelName.includes('Llama')) return 'Meta'
      if (modelName.includes('DeepSeek')) return 'DeepSeek'
      if (modelName.includes('Mistral')) return 'Mistral'
      if (modelName.includes('Qwen')) return 'Alibaba'
      return 'Unknown'
    }

    const loadModels = async () => {
      loadingModels.value = true
      try {
        const response = await fetch('/api/models')
        if (!response.ok) {
          throw new Error('Failed to load models')
        }
        const models = await response.json()
        availableModels.value = models
      } catch (error) {
        console.error('Failed to load models:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to load available models'
        })
      } finally {
        loadingModels.value = false
      }
    }

    const nextStep = () => {
      if (currentStep.value < 4) {
        currentStep.value++
      }
    }

    const previousStep = () => {
      if (currentStep.value > 1) {
        currentStep.value--
      }
    }

    const createAgent = async () => {
      isCreating.value = true
      try {
        // Transform agent name to be DigitalOcean compatible (lowercase, numbers, dashes only)
        const transformedForm = {
          ...agentForm.value,
          name: agentForm.value.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        }
        
        console.log('🔍 Sending agent creation request:', transformedForm)
        
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transformedForm)
        })

        if (!response.ok) {
          throw new Error('Failed to create agent')
        }

        const result = await response.json()
        createdAgent.value = result.agent
        nextStep()
        
        $q.notify({
          type: 'positive',
          message: 'Agent created successfully!'
        })
      } catch (error: any) {
        console.error('Failed to create agent:', error)
        $q.notify({
          type: 'negative',
          message: `Failed to create agent: ${error.message}`
        })
      } finally {
        isCreating.value = false
      }
    }

    const createKnowledgeBase = async () => {
      isCreatingKB.value = true
      try {
        const response = await fetch('/api/knowledge-bases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: `${agentForm.value.name} Knowledge Base`,
            description: `Knowledge base for ${agentForm.value.name}`,
            tags: ['Personal']
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create knowledge base')
        }

        const result = await response.json()
        
        $q.notify({
          type: 'positive',
          message: 'Knowledge base created successfully!'
        })
      } catch (error: any) {
        console.error('Failed to create knowledge base:', error)
        $q.notify({
          type: 'negative',
          message: `Failed to create knowledge base: ${error.message}`
        })
      } finally {
        isCreatingKB.value = false
      }
    }

    const configureAgent = () => {
      // TODO: Implement agent configuration
      $q.notify({
        type: 'info',
        message: 'Agent configuration coming soon'
      })
    }

    const finishWizard = () => {
      emit('agent-created', createdAgent.value)
      showDialog.value = false
      currentStep.value = 1
      createdAgent.value = null
    }

    watch(showDialog, (newVal) => {
      if (newVal) {
        loadModels()
      }
    })

    return {
      showDialog,
      currentStep,
      loadingModels,
      isCreating,
      isCreatingKB,
      availableModels,
      createdAgent,
      agentForm,
      selectedModel,
      loadModels,
      nextStep,
      previousStep,
      createAgent,
      createKnowledgeBase,
      configureAgent,
      finishWizard,
      getModelProvider
    }
  }
})
</script>

<style scoped>
.wizard-stepper {
  min-height: 400px;
}
</style> 