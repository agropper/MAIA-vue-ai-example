<template>
  <div class="agent-status-indicator">
    <q-card flat bordered class="status-card">
      <q-card-section class="q-pa-sm">
        <div class="row items-center">
          <q-icon 
            :name="statusIcon" 
            :color="statusColor" 
            size="1.5rem"
            class="q-mr-sm"
          />
          <div class="status-text">
            <div class="text-body2">
              {{ agentName }}
              <!-- Sign-in/Sign-out buttons -->
              <q-btn
                v-if="!currentUser"
                flat
                dense
                size="sm"
                color="primary"
                label="Sign-in"
                @click="$emit('sign-in')"
                class="q-ml-sm"
              />
              <q-btn
                v-else
                flat
                dense
                size="sm"
                color="grey"
                label="Sign-out"
                @click="$emit('sign-out')"
                class="q-ml-sm"
              />
            </div>
            <div class="text-caption text-grey">{{ statusText }}</div>
            <!-- Show warning prominently if present -->
            <div v-if="warning" class="text-caption text-warning q-mt-xs warning-text">
              <q-icon name="warning" size="1rem" class="q-mr-xs" />
              {{ warning }}
            </div>
          </div>
          <q-btn
            v-if="showManageButton"
            flat
            round
            dense
            icon="manage_accounts"
            color="primary"
            @click="$emit('manage')"
            size="sm"
            class="q-ml-sm"
            title="Manage Agent & Knowledge Bases"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, watch } from 'vue'
import { QIcon, QBtn, QCard, QCardSection, QSpace } from 'quasar'

export interface DigitalOceanAgent {
  id: string
  name: string
  description: string
  model: string
  status: string
  instructions: string
  knowledgeBase?: {
    uuid: string
    name: string
    created_at: string
    updated_at: string
    region: string
  }
  knowledgeBases?: {
    uuid: string
    name: string
    created_at: string
    updated_at: string
    region: string
  }[]
}

export default defineComponent({
  name: 'AgentStatusIndicator',
  components: {
    QIcon,
    QBtn,
    QCard,
    QCardSection,
    QSpace
  },
  props: {
    agent: {
      type: Object as () => DigitalOceanAgent | null,
      default: null
    },
    showManageButton: {
      type: Boolean,
      default: true
    },
    warning: {
      type: String,
      default: ''
    },
    currentUser: {
      type: Object as () => any,
      default: null
    }
  },
  emits: ['manage', 'sign-in', 'sign-out'],
  setup(props) {
    const agentName = computed(() => {
      if (!props.agent) {
        return 'No Agent Configured'
      }
      
      // Get current user from props or use default
      const userName = props.currentUser?.username || props.currentUser?.displayName || 'Unknown User'
      
      console.log('🔍 AgentStatusIndicator - currentUser prop:', props.currentUser)
      console.log('🔍 AgentStatusIndicator - userName:', userName)
      console.log('🔍 AgentStatusIndicator - !props.currentUser:', !props.currentUser)
      
      return `Personal AI ${props.agent.name} for User: ${userName}`
    })

    const statusText = computed(() => {
      if (!props.agent) {
        return 'Create an agent to get started'
      }
      
      let text = `Status: ${props.agent.status} • Model: ${props.agent.model}`
      
      // Add knowledge base information if available
      if (props.agent.knowledgeBases && props.agent.knowledgeBases.length > 0) {
        const kbCount = props.agent.knowledgeBases.length
        const primaryKB = props.agent.knowledgeBases[0]
        const updatedDate = new Date(primaryKB.updated_at).toLocaleDateString()
        
        if (kbCount === 1) {
          text += ` • Knowledge Base: ${primaryKB.name} (Updated: ${updatedDate})`
        } else {
          text += ` • Knowledge Bases: ${kbCount} attached (Primary: ${primaryKB.name})`
        }
      } else if (props.agent.knowledgeBase) {
        const updatedDate = new Date(props.agent.knowledgeBase.updated_at).toLocaleDateString()
        text += ` • Knowledge Base: ${props.agent.knowledgeBase.name} (Updated: ${updatedDate})`
      }
      
      return text
    })

    const statusIcon = computed(() => {
      if (!props.agent) {
        return 'smart_toy'
      }
      switch (props.agent.status) {
        case 'active':
          return 'check_circle'
        case 'creating':
          return 'hourglass_empty'
        case 'error':
          return 'error'
        default:
          return 'smart_toy'
      }
    })

    const statusColor = computed(() => {
      if (!props.agent) {
        return 'grey'
      }
      switch (props.agent.status) {
        case 'active':
          return 'positive'
        case 'creating':
          return 'warning'
        case 'error':
          return 'negative'
        default:
          return 'grey'
      }
    })

    // Debug currentUser prop changes
    watch(() => props.currentUser, (newUser) => {
      console.log('🔍 AgentStatusIndicator - currentUser prop changed:', newUser)
    })

    return {
      agentName,
      statusText,
      statusIcon,
      statusColor
    }
  }
})
</script>

<style scoped>
.agent-status-indicator {
  margin-bottom: 1rem;
}

.status-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
}

.status-text {
  flex: 1;
  min-width: 0; /* Allow text to shrink */
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: calc(100% - 3rem); /* Reserve space for icon and button */
}

.status-text .text-caption {
  white-space: normal;
  line-height: 1.3;
  word-break: break-word;
}

.warning-text {
  background-color: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  padding: 4px 8px;
  margin-top: 4px;
  font-weight: 500;
}
</style> 