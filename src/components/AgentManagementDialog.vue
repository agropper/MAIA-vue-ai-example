<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 800px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">🤖 Agent Management</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>

        <!-- Agent List -->
        <div v-if="availableAgents.length > 0" class="q-mb-md">
          <h6 class="q-mb-sm">Available Agents:</h6>
          <div v-for="agent in availableAgents" :key="agent.id" class="q-mb-sm">
            <q-item clickable @click="selectAgent(agent)" class="agent-item">
              <q-item-section>
                <q-item-label>
                  {{ agent.name }}
                  <q-chip 
                    v-if="currentAgent && currentAgent.id === agent.id" 
                    size="sm" 
                    color="primary" 
                    text-color="white"
                    class="q-ml-sm"
                  >
                    Current
                  </q-chip>
                </q-item-label>
                <q-item-label caption>{{ agent.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>

        <!-- Agent Actions (if agent exists) -->
        <div v-if="currentAgent" class="q-mb-md">
          <div class="row q-gutter-md">
            <q-btn 
              label="Update Agent" 
              color="primary" 
              @click="updateAgent" 
              :loading="isUpdating"
              :disable="!knowledgeBase"
              :title="knowledgeBase ? 'Update agent settings' : 'Select a knowledge base first'"
            />
            <q-btn label="Close" flat v-close-popup />
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center q-pa-md">
          <q-icon name="hourglass_empty" size="2rem" color="primary" class="q-mb-sm" />
          <div class="text-caption">Loading agent information...</div>
        </div>

        <!-- Content (only show when not loading) -->
        <div v-else>
          <!-- No Agent Configured -->
          <div v-if="!currentAgent" class="text-center q-pa-md">
            <q-icon name="smart_toy" size="4rem" color="grey-4" />
            <div class="text-h6 q-mt-md">No Agent Configured</div>
            <div class="text-caption q-mb-md">Create a new agent to get started with AI assistance</div>
            <q-btn
              label="Create New Agent"
              color="primary"
              size="lg"
              @click="showWizard = true"
              icon="add"
            />
          </div>

          <!-- Agent Management (if agent exists) -->
          <div v-if="currentAgent">
          
          <!-- Knowledge Base Section -->
          <q-card flat bordered class="q-mb-md">
            <q-card-section>
              <div class="row items-center q-mb-sm">
                <q-icon name="library_books" color="secondary" />
                <span class="text-subtitle2 q-ml-sm">Available Knowledge Bases</span>
              </div>
              
              <!-- Create New Knowledge Base Button -->
              <div class="q-mb-md">
                <q-btn
                  label="Create New Knowledge Base"
                  color="primary"
                  icon="add"
                  @click="handleCreateKnowledgeBase"
                  :disable="!hasUploadedDocuments"
                  :title="hasUploadedDocuments ? 'Create a new KB from uploaded documents' : 'Upload documents first using the paper clip'"
                />
                <div v-if="!hasUploadedDocuments" class="text-caption text-grey q-mt-xs">
                  Upload documents using the paper clip button to create a new knowledge base
                </div>
              </div>
              
              <!-- Knowledge Base List -->
              <div v-if="availableKnowledgeBases.length > 0" class="q-mb-md">
                <h6 class="q-mb-sm">Available Knowledge Bases:</h6>
                <div v-for="kb in availableKnowledgeBases" :key="kb.uuid" class="q-mb-sm">
                  <q-item class="kb-item">
                    <q-item-section>
                      <q-item-label>
                        {{ kb.name }}
                        <!-- Protection Status Icon -->
                        <q-icon 
                          v-if="kb.isProtected" 
                          name="lock" 
                          color="warning" 
                          size="sm"
                          class="q-ml-xs"
                          title="Protected KB"
                        />
                        <q-icon 
                          v-else 
                          name="public" 
                          color="positive" 
                          size="sm"
                          class="q-ml-xs"
                          title="Public KB"
                        />
                        <q-chip 
                          v-if="isKnowledgeBaseConnected(kb)" 
                          size="sm" 
                          color="positive" 
                          text-color="white"
                          class="q-ml-sm"
                        >
                          Connected
                        </q-chip>
                        <q-chip 
                          v-else
                          size="sm" 
                          color="grey" 
                          text-color="white"
                          class="q-ml-sm"
                        >
                          Available
                        </q-chip>
                        <!-- Owner info for protected KBs -->
                        <q-chip 
                          v-if="kb.isProtected && kb.owner" 
                          size="sm" 
                          color="warning" 
                          text-color="white"
                          class="q-ml-sm"
                        >
                          {{ kb.owner }}
                        </q-chip>
                      </q-item-label>
                      <q-item-label caption>{{ kb.description || 'No description' }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <div class="row q-gutter-xs">
                        <!-- Protection Toggle (only for KB owner) -->
                        <q-btn
                          v-if="currentUser && kb.owner === currentUser.username"
                          :icon="kb.isProtected ? 'lock_open' : 'lock'"
                          :color="kb.isProtected ? 'warning' : 'grey'"
                          size="sm"
                          flat
                          @click="toggleKBProtection(kb)"
                          :title="kb.isProtected ? 'Remove protection' : 'Add protection'"
                        />
                        
                        <!-- DETACH button for connected KBs -->
                        <q-btn
                          v-if="isKnowledgeBaseConnected(kb)"
                          icon="link_off"
                          color="negative"
                          size="sm"
                          flat
                          @click="confirmDetachKnowledgeBase(kb)"
                          title="Detach this knowledge base from the agent"
                        />
                        <!-- CONNECT button for available KBs -->
                        <q-btn
                          v-else
                          icon="link"
                          color="primary"
                          size="sm"
                          flat
                          @click="confirmConnectKnowledgeBase(kb)"
                          title="Connect this knowledge base to the agent"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </div>
              </div>
              <div v-else class="text-caption text-grey">
                No knowledge bases available
              </div>
            </q-card-section>
          </q-card>
        </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Agent Creation Wizard -->
    <AgentCreationWizard
      v-model="showWizard"
      @agent-created="handleAgentCreated"
    />

    <!-- Document Manager Dialog -->
    <q-dialog v-model="showDocumentManager" persistent>
      <q-card style="min-width: 500px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">📚 Knowledge Base Documents</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div class="text-center q-pa-md">
            <q-icon name="library_books" size="3rem" color="grey-4" />
            <div class="text-caption text-grey q-mt-sm">Document management coming soon</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Create New Knowledge Base Dialog -->
    <q-dialog v-model="showCreateKbDialog" persistent>
      <q-card style="min-width: 600px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">📚 Create New Knowledge Base</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div v-if="uploadedFiles.length === 0" class="text-center q-pa-md">
            <q-icon name="attach_file" size="3rem" color="grey-4" />
            <div class="text-h6 q-mt-md">No Documents Available</div>
            <div class="text-caption q-mb-md">Upload documents using the paper clip button to create a knowledge base</div>
          </div>
          
          <div v-else>
            <div class="text-subtitle2 q-mb-md">Select documents to include in the new knowledge base:</div>
            
            <q-form @submit="createKnowledgeBaseFromDocuments" class="q-gutter-md">
              <q-input
                v-model="newKbName"
                label="Knowledge Base Name"
                outlined
                :rules="[val => !!val || 'Name is required']"
                hint="Enter a descriptive name for your knowledge base"
              />
              
              <q-input
                v-model="newKbDescription"
                label="Description"
                outlined
                type="textarea"
                rows="3"
                hint="Optional description of the knowledge base contents"
              />
              
              <!-- Document List -->
              <div v-if="uploadedFiles.length === 0" class="text-center q-pa-md">
                <q-icon name="upload_file" size="2rem" color="grey-4" />
                <div class="text-caption">No documents uploaded</div>
              </div>
              
              <div v-else>
                <div class="text-subtitle2 q-mb-sm">Uploaded Documents:</div>
                <div v-for="file in uploadedFiles" :key="file.name" class="q-mb-xs">
                  <q-item dense>
                    <q-item-section>
                      <q-item-label>{{ file.name }}</q-item-label>
                      <q-item-label caption>{{ formatFileSize(file.size) }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-checkbox v-model="selectedDocuments" :val="file" />
                    </q-item-section>
                  </q-item>
                </div>
              </div>
              
              <div class="row q-gutter-sm q-mt-md">
                <q-btn
                  label="Create Knowledge Base"
                  color="primary"
                  type="submit"
                  :loading="isCreatingKb"
                  :disable="selectedDocuments.length === 0 || !newKbName"
                />
                <q-btn
                  label="Cancel"
                  flat
                  v-close-popup
                />
              </div>
            </q-form>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm">
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Agent</div>
          <div class="text-body2 q-mt-sm">
            Are you sure you want to delete "{{ currentAgent?.name }}"? This action cannot be undone.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" @click="deleteAgent" :loading="isDeleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Add Document Dialog -->
    <q-dialog v-model="showAddDocumentDialog" persistent>
      <q-card style="min-width: 500px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">📚 Add Documents to Knowledge Base</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div class="text-center q-pa-md">
            <q-icon name="upload_file" size="3rem" color="primary" />
            <div class="text-h6 q-mt-md">Add Documents</div>
            <div class="text-caption text-grey q-mt-sm">
              Upload files to add to your knowledge base: {{ knowledgeBase?.name }}
            </div>
            
            <div class="q-mt-md">
              <q-btn
                label="Upload Files"
                color="primary"
                icon="upload"
                @click="handleFileUpload"
              />
            </div>
            
            <div class="q-mt-md">
              <q-btn
                label="Create New Knowledge Base"
                color="secondary"
                icon="add"
                @click="handleCreateKnowledgeBase"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Switch Knowledge Base Confirmation Dialog -->
    <q-dialog v-model="showSwitchKbDialog" persistent>
      <q-card style="min-width: 400px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Switch Knowledge Base</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <div class="text-body2">
            Are you sure you want to switch the current agent to use 
            <strong>"{{ selectedKnowledgeBase?.name }}"</strong>?
          </div>
          <div class="text-caption text-grey q-mt-sm">
            This will disassociate the current knowledge base and associate the new one.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn 
            color="primary" 
            label="Switch" 
            @click="confirmSwitchKnowledgeBase"
            :loading="isUpdating"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ confirmTitle }}</div>
          <div class="text-body2 q-mt-sm">{{ confirmMessage }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Confirm" @click="executeConfirmAction" :loading="isUpdating" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Passkey Authentication Dialog -->
    <PasskeyAuthDialog
      v-model="showPasskeyAuthDialog"
      @authenticated="handlePasskeyAuthenticated"
    />
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import { useQuasar } from 'quasar'
import {
  QDialog,
  QCard,
  QCardSection,
  QCardActions,
  QSpace,
  QBtn,
  QIcon,
  QForm,
  QInput,
  QSelect,
  QItem,
  QItemSection,
  QItemLabel,
  QCheckbox,
  QChip,
  QTooltip
} from 'quasar'
import AgentCreationWizard from './AgentCreationWizard.vue'
import PasskeyAuthDialog from './PasskeyAuthDialog.vue'
import type { UploadedFile } from '../types'

export interface DigitalOceanAgent {
  id: string
  name: string
  description: string
  model: string
  status: string
  instructions: string
  knowledgeBase?: DigitalOceanKnowledgeBase
  knowledgeBases?: DigitalOceanKnowledgeBase[] // Added for multiple KBs
}

export interface DigitalOceanKnowledgeBase {
  uuid: string
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  region: string
  isProtected: boolean
  owner?: string
}

export default defineComponent({
  name: 'AgentManagementDialog',
  components: {
    QDialog,
    QCard,
    QCardSection,
    QCardActions,
    QSpace,
    QBtn,
    QIcon,
    QForm,
    QInput,
    QSelect,
    QItem,
    QItemSection,
    QItemLabel,
    AgentCreationWizard,
    PasskeyAuthDialog,
    QCheckbox,
    QChip,
    QTooltip
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    uploadedFiles: {
      type: Array as PropType<UploadedFile[]>,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'agent-created', 'agent-selected', 'agent-updated', 'refresh-agent-data', 'user-authenticated'],
  setup(props, { emit }) {
    const $q = useQuasar()
    
    const showDialog = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    // Agent state
    const currentAgent = ref<DigitalOceanAgent | null>(null)
    const availableAgents = ref<DigitalOceanAgent[]>([])
    const selectedAgentId = ref<string>('')
    const knowledgeBase = ref<DigitalOceanKnowledgeBase | null>(null)
    const availableKnowledgeBases = ref<DigitalOceanKnowledgeBase[]>([])
    const documents = ref<any[]>([])
    const isLoading = ref(true) // Start with loading true
    const isCreating = ref(false)
    const isUpdating = ref(false)
    const isDeleting = ref(false)
    const showDocumentManager = ref(false)
    const showDeleteConfirm = ref(false)
    const showWizard = ref(false)
    const showAddDocumentDialog = ref(false)
    const showCreateKbDialog = ref(false)
    const showSwitchKbDialog = ref(false)
    const selectedKnowledgeBase = ref<DigitalOceanKnowledgeBase | null>(null)
    const newKbName = ref('')
    const newKbDescription = ref('')
    const isCreatingKb = ref(false)
    const selectedDocuments = ref<string[]>([])

    // Passkey Authentication state
    const showPasskeyAuthDialog = ref(false)
    const currentUser = ref<any>(null)
    const isAuthenticated = ref(false)

    // Dialog state for confirmations
    const showConfirmDialog = ref(false)
    const confirmAction = ref<(() => Promise<void>) | null>(null)
    const confirmMessage = ref('')
    const confirmTitle = ref('')

    // Load current agent info
    const loadAgentInfo = async () => {
      isLoading.value = true
      try {
        // Load current agent info (this includes KB associations)
        const currentAgentResponse = await fetch('/api/current-agent')
        if (!currentAgentResponse.ok) {
          throw new Error('Failed to load current agent')
        }
        
        const currentAgentData = await currentAgentResponse.json()
        
        if (currentAgentData.agent) {
          currentAgent.value = currentAgentData.agent
          console.log(`🤖 Current agent loaded: ${currentAgentData.agent.name}`)
          
          if (currentAgentData.agent.knowledgeBase) {
            console.log(`📚 Current KB: ${currentAgentData.agent.knowledgeBase.name}`)
          } else {
            console.log(`📚 No KB assigned`)
          }
          
          // Handle warnings from the API
          if (currentAgentData.warning) {
            console.warn(currentAgentData.warning)
          }
        } else {
          currentAgent.value = null
          console.log('🤖 No agent configured')
        }
        
        // Load all agents for the agent list
        try {
          const agentsResponse = await fetch('/api/agents')
          if (agentsResponse.ok) {
            const agents: DigitalOceanAgent[] = await agentsResponse.json()
            availableAgents.value = agents
          }
        } catch (agentsError) {
          console.warn('Failed to load agents list:', agentsError)
        }
        
        // Load all knowledge bases for the KB list
        try {
          const knowledgeBasesResponse = await fetch('/api/knowledge-bases')
          if (knowledgeBasesResponse.ok) {
            const knowledgeBases: DigitalOceanKnowledgeBase[] = await knowledgeBasesResponse.json()
            
            // Get all connected KBs from the current agent
            const connectedKBs = currentAgent.value?.knowledgeBases || (currentAgent.value?.knowledgeBase ? [currentAgent.value.knowledgeBase] : [])
            
            // Combine available KBs with connected KBs, avoiding duplicates
            const allKBs = [...knowledgeBases]
            connectedKBs.forEach(connectedKB => {
              if (!allKBs.find(kb => kb.uuid === connectedKB.uuid)) {
                allKBs.push(connectedKB)
              }
            })
            
            availableKnowledgeBases.value = allKBs
            console.log(`📚 Loaded ${allKBs.length} knowledge bases (${connectedKBs.length} connected)`)
          }
        } catch (kbError) {
          console.warn('Failed to load knowledge bases:', kbError)
        }
        
      } catch (error) {
        console.error('Failed to load agent info:', error)
        $q.notify({
          type: 'negative',
          message: 'Failed to load agent information'
        })
      } finally {
        isLoading.value = false
      }
    }

    // Handle agent selection
    const onAgentSelected = async (agentId: string) => {
      try {
        const response = await fetch(`/api/set-current-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ agentId })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Agent selected:', result);
          
          // Emit agent update event
          emit('agent-updated', result.agent);
          
          // Close dialog
          emit('update:modelValue', false);
          
          $q.notify({
            type: 'positive',
            message: `Agent ${result.agent.name} is now active!`
          });
        } else {
          throw new Error('Failed to set current agent');
        }
      } catch (error: any) {
        console.error('❌ Error setting current agent:', error);
        $q.notify({
          type: 'negative',
          message: `Failed to set current agent: ${error.message || 'Unknown error'}`
        });
      }
    };

    const selectAgent = async (agent: any) => {
      await onAgentSelected(agent.id);
    };

    // Create new agent
    const createAgent = async () => {
      isCreating.value = true
      try {
        const response = await fetch('/api/setup-maia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patientId: 'demo_patient_001'
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create agent')
        }

        const result = await response.json()
        
        currentAgent.value = result.agent
        knowledgeBase.value = result.knowledgeBase
        
        $q.notify({
          type: 'positive',
          message: 'Agent created successfully!'
        })
        
        emit('agent-updated', result)
        showDialog.value = false
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Failed to create agent: ${error.message}`
        })
      } finally {
        isCreating.value = false
      }
    }

    // Update agent
    const updateAgent = async () => {
      // TODO: Implement agent update functionality
      $q.notify({
        type: 'info',
        message: 'Agent update functionality coming soon'
      })
    }

    // Delete agent
    const confirmDelete = () => {
      showDeleteConfirm.value = true
    }

    const deleteAgent = async () => {
      if (!currentAgent.value) return
      
      isDeleting.value = true
      try {
        const response = await fetch(`/api/agents/${currentAgent.value.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete agent')
        }

        currentAgent.value = null
        knowledgeBase.value = null
        
        $q.notify({
          type: 'positive',
          message: 'Agent deleted successfully!'
        })
        
        emit('agent-updated', null)
        showDeleteConfirm.value = false
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Failed to delete agent: ${error.message}`
        })
      } finally {
        isDeleting.value = false
      }
    }

    // Passkey authentication methods
    const handlePasskeyAuthenticated = (userData: { userId: string }) => {
      const userInfo = {
        username: userData.userId,
        displayName: userData.userId
      }
      currentUser.value = userInfo
      isAuthenticated.value = true
      showPasskeyAuthDialog.value = false
      
      // Emit the current user to parent component
      emit('user-authenticated', userInfo)
      
      console.log('🔍 User authenticated in AgentManagementDialog:', userInfo)
      
      // Close the dialog to return to main interface
      // User can now click "Create New Knowledge Base" again if they want to proceed
      emit('update:modelValue', false)
      
      $q.notify({
        type: 'positive',
        message: `Welcome, ${userInfo.displayName}! You can now create knowledge bases.`
      })
    }



    // Load agent info when dialog opens
    const onDialogOpen = () => {
      loadAgentInfo()
    }

    const handleAgentCreated = (agent: DigitalOceanAgent) => {
      currentAgent.value = agent
      knowledgeBase.value = null // No direct knowledge base creation here, it's part of the wizard
      showWizard.value = false
      $q.notify({
        type: 'positive',
        message: 'Agent created successfully!'
      })
      emit('agent-updated', { agent: agent, knowledgeBase: null })
    }

    // Watch for dialog opening to load agent info
    watch(showDialog, (newVal) => {
      if (newVal) {
        loadAgentInfo()
      }
    })

    // Handle knowledge base selection
    const handleKnowledgeBaseClick = async (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return
      
      // If clicking on the current KB, show add document dialog
      if (kb === knowledgeBase.value) {
        showAddDocumentDialog.value = true
        return
      }
      
      // If clicking on a different KB, show confirmation dialog
      selectedKnowledgeBase.value = kb
      showSwitchKbDialog.value = true
    }

    // Handle KB switch confirmation
    const confirmSwitchKnowledgeBase = async () => {
      if (!selectedKnowledgeBase.value || !currentAgent.value) return
      
      try {
        console.log(`🔄 Starting KB switch from ${knowledgeBase.value?.name} to ${selectedKnowledgeBase.value.name}`)
        
        // First, detach current KB from agent
        if (knowledgeBase.value && currentAgent.value) {
          const deleteResponse = await fetch(`/api/agents/${currentAgent.value.id}/knowledge-bases/${knowledgeBase.value.uuid}`, {
            method: 'DELETE'
          })
          if (!deleteResponse.ok) {
            throw new Error(`Failed to detach current KB: ${deleteResponse.statusText}`)
          }
          console.log(`✅ Detached current KB: ${knowledgeBase.value.name}`)
        }
        
        // Then associate new KB with agent
        if (currentAgent.value) {
          const postResponse = await fetch(`/api/agents/${currentAgent.value.id}/knowledge-bases/${selectedKnowledgeBase.value.uuid}`, {
            method: 'POST'
          })
          if (!postResponse.ok) {
            throw new Error(`Failed to associate new KB: ${postResponse.statusText}`)
          }
          console.log(`✅ Associated new KB: ${selectedKnowledgeBase.value.name}`)
        }
        
        // CRITICAL: Verify the switch actually worked by fetching the current agent state
        console.log(`🔍 Verifying KB switch...`)
        const verifyResponse = await fetch('/api/current-agent')
        if (!verifyResponse.ok) {
          throw new Error('Failed to verify agent state after KB switch')
        }
        
        const agentData = await verifyResponse.json()
        const actualKb = agentData.agent?.knowledgeBase
        
        if (!actualKb) {
          throw new Error('Agent has no knowledge base after switch - this indicates a failure')
        }
        
        if (actualKb.uuid !== selectedKnowledgeBase.value.uuid) {
          throw new Error(`KB switch verification failed: expected ${selectedKnowledgeBase.value.name} but agent has ${actualKb.name}`)
        }
        
        console.log(`✅ KB switch verified: agent now has ${actualKb.name}`)
        
        // Update local state with the verified data
        knowledgeBase.value = actualKb
        if (currentAgent.value) {
          currentAgent.value.knowledgeBase = actualKb
        }
        
        // Emit event to parent to update agent badge
        emit('agent-updated', currentAgent.value)
        
        // Refresh the knowledge base list to reflect the change
        await refreshKnowledgeBases()
        
        $q.notify({
          type: 'positive',
          message: `Successfully switched to knowledge base: ${actualKb.name}`
        })
        
        showSwitchKbDialog.value = false
        selectedKnowledgeBase.value = null
      } catch (error) {
        console.error('❌ Failed to switch knowledge base:', error)
        $q.notify({
          type: 'negative',
          message: `Failed to switch knowledge base: ${error.message}`
        })
        
        // Try to reload the current agent state to ensure UI is accurate
        try {
          await loadAgentInfo()
        } catch (reloadError) {
          console.error('Failed to reload agent info after KB switch failure:', reloadError)
        }
      }
    }

    // Refresh knowledge bases list
    const refreshKnowledgeBases = async () => {
      try {
        const kbResponse = await fetch('/api/knowledge-bases')
        if (kbResponse.ok) {
          const knowledgeBases: DigitalOceanKnowledgeBase[] = await kbResponse.json()
          
          // Get all connected KBs from the current agent
          const connectedKBs = currentAgent.value?.knowledgeBase ? [currentAgent.value.knowledgeBase] : []
          
          // Combine available KBs with connected KBs, avoiding duplicates
          const allKBs = [...knowledgeBases]
          connectedKBs.forEach(connectedKB => {
            if (!allKBs.find(kb => kb.uuid === connectedKB.uuid)) {
              allKBs.push(connectedKB)
            }
          })
          
          availableKnowledgeBases.value = allKBs
          console.log(`📚 Refreshed ${allKBs.length} knowledge bases (${connectedKBs.length} connected)`)
          
          // Update the current knowledge base to reflect the switch
          if (currentAgent.value && selectedKnowledgeBase.value) {
            knowledgeBase.value = selectedKnowledgeBase.value
          }
        }
      } catch (error) {
        console.error('Failed to refresh knowledge bases:', error)
      }
    }

    // Handle add document to current KB
    const handleAddDocument = () => {
      showAddDocumentDialog.value = true
    }

    // Handle create new KB
    const handleCreateKnowledgeBase = () => {
      console.log('🔍 handleCreateKnowledgeBase called')
      console.log('🔍 isAuthenticated:', isAuthenticated.value)
      console.log('🔍 showPasskeyAuthDialog:', showPasskeyAuthDialog.value)
      
      if (!isAuthenticated.value) {
        // Show passkey authentication first
        console.log('🔍 Showing passkey auth dialog')
        showPasskeyAuthDialog.value = true
      } else {
        // User is already authenticated, show KB creation dialog
        console.log('🔍 Showing KB creation dialog')
        showCreateKbDialog.value = true
      }
    }

    // Handle file upload
    const handleFileUpload = () => {
      // TODO: Implement file upload functionality
      $q.notify({
        type: 'info',
        message: 'File upload functionality coming soon'
      })
    }

    // Create knowledge base
    const createKnowledgeBase = async () => {
      if (!newKbName.value) return
      
      isCreatingKb.value = true
      try {
        const response = await fetch('/api/knowledge-bases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newKbName.value,
            description: newKbDescription.value
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create knowledge base')
        }

        const newKb = await response.json()
        
        // Add to available knowledge bases
        availableKnowledgeBases.value.push(newKb)
        
        // Set as current knowledge base
        knowledgeBase.value = newKb
        
        // Clear form
        newKbName.value = ''
        newKbDescription.value = ''
        showCreateKbDialog.value = false
        
        $q.notify({
          type: 'positive',
          message: 'Knowledge base created successfully!'
        })
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Failed to create knowledge base: ${error.message}`
        })
      } finally {
        isCreatingKb.value = false
      }
    }

    // Computed property to check if there are uploaded documents
    const hasUploadedDocuments = computed(() => {
      return props.uploadedFiles.length > 0;
    });

    // Format file size
    const formatFileSize = (bytes: number, decimalPoint = 2) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimalPoint < 0 ? 0 : decimalPoint;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Create knowledge base from selected documents
    const createKnowledgeBaseFromDocuments = async () => {
      if (!newKbName.value || selectedDocuments.value.length === 0) return;

      isCreatingKb.value = true;
      try {
        const response = await fetch('/api/knowledge-bases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: newKbName.value,
            description: newKbDescription.value,
            document_uuids: selectedDocuments.value,
            owner: currentUser.value?.username // Add owner information
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create knowledge base from documents');
        }

        const newKb = await response.json();
        availableKnowledgeBases.value.push(newKb);
        knowledgeBase.value = newKb;
        newKbName.value = '';
        newKbDescription.value = '';
        selectedDocuments.value = [];
        showCreateKbDialog.value = false;
        $q.notify({
          type: 'positive',
          message: 'Knowledge base created successfully from documents!'
        });
      } catch (error: any) {
        $q.notify({
          type: 'negative',
          message: `Failed to create knowledge base from documents: ${error.message}`
        });
      } finally {
        isCreatingKb.value = false;
      }
    };

    // Helper to check if a KB is connected to the current agent
    const isKnowledgeBaseConnected = (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return false;
      
      // Check against all connected KBs
      const connectedKBs = currentAgent.value.knowledgeBases || (currentAgent.value.knowledgeBase ? [currentAgent.value.knowledgeBase] : []);
      return connectedKBs.some(connectedKB => connectedKB.uuid === kb.uuid);
    };

    // Handle KB detachment with confirmation
    const confirmDetachKnowledgeBase = async (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return;

      confirmTitle.value = 'Confirm Detach'
      confirmMessage.value = `Are you sure you want to detach the knowledge base "${kb.name}" from the agent?`
      confirmAction.value = () => detachKnowledgeBase(kb)
      showConfirmDialog.value = true
    };

    // Handle KB connection with confirmation
    const confirmConnectKnowledgeBase = async (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return;

      confirmTitle.value = 'Confirm Connect'
      confirmMessage.value = `Are you sure you want to connect the knowledge base "${kb.name}" to the agent?`
      confirmAction.value = () => connectKnowledgeBase(kb)
      showConfirmDialog.value = true
    };

    // Handle KB detachment
    const detachKnowledgeBase = async (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return;

      isUpdating.value = true;
      try {
        const response = await fetch(`/api/agents/${currentAgent.value.id}/knowledge-bases/${kb.uuid}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error(`Failed to detach KB: ${response.statusText}`);
        }

        console.log(`✅ Detached KB: ${kb.name}`);
        $q.notify({
          type: 'positive',
          message: `Knowledge base "${kb.name}" detached from agent.`
        });

        // Refresh the current agent data to get updated KB associations
        await loadAgentInfo();
        // Also refresh the knowledge base list
        await refreshKnowledgeBases();
        // Notify parent component to refresh agent data
        emit('refresh-agent-data');

      } catch (error: any) {
        console.error('❌ Failed to detach KB:', error);
        $q.notify({
          type: 'negative',
          message: `Failed to detach KB: ${error.message}`
        });
      } finally {
        isUpdating.value = false;
      }
    };

    // Handle KB connection
    const connectKnowledgeBase = async (kb: DigitalOceanKnowledgeBase) => {
      if (!currentAgent.value) return;

      isUpdating.value = true;
      try {
        const response = await fetch(`/api/agents/${currentAgent.value.id}/knowledge-bases/${kb.uuid}`, {
          method: 'POST'
        });

        const result = await response.json();

        if (!response.ok) {
          // Check if this is the DigitalOcean API limitation
          if (result.api_limitation) {
            console.error('❌ DigitalOcean API limitation detected:', result.message);
            $q.notify({
              type: 'warning',
              message: '⚠️ DigitalOcean API Limitation: Knowledge base attachment operations are not working correctly. Please use the DigitalOcean dashboard to manually attach knowledge bases.',
              timeout: 10000,
              position: 'top'
            });
          } else {
            throw new Error(`Failed to connect KB: ${response.statusText}`);
          }
        } else {
          console.log(`✅ Connected KB: ${kb.name}`);
          $q.notify({
            type: 'positive',
            message: `Knowledge base "${kb.name}" connected to agent.`
          });
        }

        // Refresh the current agent data to get updated KB associations
        await loadAgentInfo();
        // Also refresh the knowledge base list
        await refreshKnowledgeBases();
        // Notify parent component to refresh agent data
        emit('refresh-agent-data');

      } catch (error: any) {
        console.error('❌ Failed to connect KB:', error);
        $q.notify({
          type: 'negative',
          message: `Failed to connect KB: ${error.message}`
        });
      } finally {
        isUpdating.value = false;
      }
    };

    // Execute confirmed action
    const executeConfirmAction = async () => {
      if (confirmAction.value) {
        await confirmAction.value()
        showConfirmDialog.value = false
        confirmAction.value = null
      }
    };

    // Toggle KB protection
    const toggleKBProtection = async (kb: DigitalOceanKnowledgeBase) => {
      try {
        if (kb.isProtected) {
          // Remove protection
          const response = await fetch('/api/kb-protection/unprotect-kb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kbId: kb.uuid,
              owner: currentUser.value?.username
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            $q.notify({
              type: 'positive',
              message: 'Knowledge base protection removed'
            });
            await loadAgentInfo(); // Refresh the list
          } else {
            throw new Error(result.error);
          }
        } else {
          // Add protection
          const response = await fetch('/api/kb-protection/protect-kb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kbId: kb.uuid,
              kbName: kb.name,
              owner: currentUser.value?.username,
              description: `Protected by ${currentUser.value?.displayName || currentUser.value?.username}`
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            $q.notify({
              type: 'positive',
              message: 'Knowledge base is now protected'
            });
            await loadAgentInfo(); // Refresh the list
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error: any) {
        console.error('Error toggling KB protection:', error);
        $q.notify({
          type: 'negative',
          message: `Failed to ${kb.isProtected ? 'remove' : 'add'} protection: ${error.message}`
        });
      }
    };

    return {
      showDialog,
      currentAgent,
      availableAgents,
      knowledgeBase,
      availableKnowledgeBases,
      documents,
      isLoading,
      isCreating,
      isUpdating,
      isDeleting,
      showDocumentManager,
      showDeleteConfirm,
      showWizard,
      showAddDocumentDialog,
      showCreateKbDialog,
      showSwitchKbDialog,
      selectedKnowledgeBase,
      newKbName,
      newKbDescription,
      isCreatingKb,
      selectedDocuments,
      hasUploadedDocuments,
      onAgentSelected,
      selectAgent,
      updateAgent,
      confirmDelete,
      deleteAgent,
      onDialogOpen,
      handleAgentCreated,
      handleKnowledgeBaseClick,
      confirmSwitchKnowledgeBase,
      refreshKnowledgeBases,
      handleAddDocument,
      handleCreateKnowledgeBase,
      handleFileUpload,
      createKnowledgeBase,
      createKnowledgeBaseFromDocuments,
      formatFileSize,
      confirmDetachKnowledgeBase,
      confirmConnectKnowledgeBase,
      isKnowledgeBaseConnected,
      showConfirmDialog,
      confirmAction,
      confirmMessage,
      confirmTitle,
      executeConfirmAction,
      currentUser,
      toggleKBProtection,
      showPasskeyAuthDialog,
      handlePasskeyAuthenticated
    }
  }
})
</script>

<style scoped>
.agent-status {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.q-card {
  border-radius: 12px;
}
</style> 