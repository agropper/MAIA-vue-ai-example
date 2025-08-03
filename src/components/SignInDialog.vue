<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">🔐 Sign In</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      
      <q-card-section>
        <!-- Step 1: User ID Input -->
        <div v-if="currentStep === 'userId'" class="q-gutter-md">
          <div class="text-center q-pa-md">
            <q-icon name="login" size="3rem" color="primary" class="q-mb-md" />
            <div class="text-h6">Sign In with Passkey</div>
            <div class="text-body2 q-mt-sm">
              Enter your User ID to sign in with your passkey.
            </div>
          </div>
          
          <q-input
            v-model="userId"
            label="User ID"
            outlined
            :rules="[val => !!val || 'User ID is required', val => val.length >= 3 || 'User ID must be at least 3 characters']"
            hint="Enter your existing User ID"
            :error="userIdError"
            :error-message="userIdErrorMessage"
          />
          
          <div class="row q-gutter-sm q-mt-md">
            <q-btn
              label="Sign In"
              color="primary"
              :loading="isAuthenticating"
              :disable="userIdError || !userId || userId.length < 3"
              @click="authenticateUser"
            />
            <q-btn
              label="Cancel"
              flat
              @click="closeDialog"
            />
          </div>
        </div>

        <!-- Step 2: Authentication in Progress -->
        <div v-if="currentStep === 'authenticating'" class="q-gutter-md">
          <div class="text-center q-pa-md">
            <q-icon name="fingerprint" size="3rem" color="primary" class="q-mb-md" />
            <div class="text-h6">Authenticating...</div>
            <div class="text-body2 q-mt-sm">
              Please use your passkey to complete authentication.
            </div>
          </div>
        </div>

        <!-- Step 3: Error State -->
        <div v-if="currentStep === 'error'" class="q-gutter-md">
          <div class="text-center q-pa-md">
            <q-icon name="error" size="3rem" color="negative" class="q-mb-md" />
            <div class="text-h6">Authentication Failed</div>
            <div class="text-body2 q-mt-sm">{{ errorMessage }}</div>
          </div>
          
          <div class="row q-gutter-sm q-mt-md">
            <q-btn
              label="Try Again"
              color="primary"
              @click="currentStep = 'userId'"
            />
            <q-btn
              label="Cancel"
              flat
              @click="closeDialog"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import { QDialog, QCard, QCardSection, QBtn, QInput, QIcon, QSpace } from 'quasar'

export default defineComponent({
  name: 'SignInDialog',
  components: {
    QDialog,
    QCard,
    QCardSection,
    QBtn,
    QInput,
    QIcon,
    QSpace
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'user-authenticated'],
  setup(props, { emit }) {
    const showDialog = computed({
      get: () => {
        console.log('🔍 SignInDialog showDialog get:', props.modelValue)
        return props.modelValue
      },
      set: (value) => {
        console.log('🔍 SignInDialog showDialog set:', value)
        emit('update:modelValue', value)
      }
    })

    const currentStep = ref<'userId' | 'authenticating' | 'error'>('userId')
    const userId = ref('')
    const userIdError = ref(false)
    const userIdErrorMessage = ref('')
    const isAuthenticating = ref(false)
    const errorMessage = ref('')

    // Debug currentStep changes
    watch(currentStep, (newStep) => {
      console.log('🔍 SignInDialog currentStep changed to:', newStep)
    })

    // Watch for dialog close to reset state
    watch(showDialog, (isOpen) => {
      console.log('🔍 SignInDialog dialog state changed:', isOpen)
      if (!isOpen) {
        // Reset state when dialog closes
        console.log('🔍 Resetting SignInDialog state')
        currentStep.value = 'userId'
        userId.value = ''
        userIdError.value = false
        userIdErrorMessage.value = ''
        errorMessage.value = ''
        isAuthenticating.value = false
      }
    })

    const authenticateUser = async () => {
      if (!userId.value || userId.value.length < 3) {
        userIdError.value = true
        userIdErrorMessage.value = 'User ID must be at least 3 characters'
        return
      }

      isAuthenticating.value = true
      currentStep.value = 'authenticating'

      try {
        // Step 1: Generate authentication options
        const optionsResponse = await fetch('/api/passkey/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: userId.value })
        })

        if (!optionsResponse.ok) {
          const errorData = await optionsResponse.json()
          throw new Error(errorData.error || 'User not found or authentication failed')
        }

        const options = await optionsResponse.json()

        // Convert base64 strings to ArrayBuffer for WebAuthn
        if (options.allowCredentials && options.allowCredentials.length > 0) {
          const credential = options.allowCredentials[0]
          if (typeof credential.id === 'string') {
            // Convert base64 credential ID to ArrayBuffer for WebAuthn
            try {
              const binaryString = atob(credential.id)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              credential.id = bytes.buffer
              console.log('🔍 Converted credential ID to ArrayBuffer:', credential.id)
            } catch (error) {
              console.error('Invalid base64 credential ID:', error)
              throw new Error('Invalid credential format received from server')
            }
          } else if (typeof credential.id === 'object' && credential.id !== null) {
            // Handle object format from database (convert to ArrayBuffer)
            const keys = Object.keys(credential.id).filter(key => !isNaN(parseInt(key))).sort((a, b) => parseInt(a) - parseInt(b))
            const buffer = new Uint8Array(keys.length)
            
            for (let i = 0; i < keys.length; i++) {
              buffer[i] = credential.id[keys[i]]
            }
            
            credential.id = buffer.buffer
          }
        }

        // Convert base64 challenge to ArrayBuffer
        if (typeof options.challenge === 'string') {
          // Convert URL-safe base64 to standard base64 for atob()
          const standardBase64 = options.challenge.replace(/-/g, '+').replace(/_/g, '/')
          const binaryString = atob(standardBase64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          options.challenge = bytes.buffer
        }

        // Step 2: Get credentials using WebAuthn API
        const credential = await navigator.credentials.get({
          publicKey: options
        })

        // Step 3: Verify authentication
        const verifyResponse = await fetch('/api/passkey/authenticate-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId.value,
            response: credential
          })
        })

        const result = await verifyResponse.json()

        if (result.success) {
          const userInfo = {
            username: userId.value,
            displayName: userId.value
          }
          
          // Emit the authenticated user
          emit('user-authenticated', userInfo)
          
          // Close dialog
          showDialog.value = false
          
          console.log('🔍 User signed in via SignInDialog:', userInfo)
        } else {
          throw new Error(result.error || 'Authentication failed')
        }
      } catch (error: any) {
        console.error('Authentication error:', error)
        currentStep.value = 'error'
        errorMessage.value = error.message || 'Authentication failed. Please try again.'
      } finally {
        isAuthenticating.value = false
      }
    }

    const closeDialog = () => {
      showDialog.value = false
      // Reset state
      currentStep.value = 'userId'
      userId.value = ''
      userIdError.value = false
      userIdErrorMessage.value = ''
      errorMessage.value = ''
    }

    return {
      showDialog,
      currentStep,
      userId,
      userIdError,
      userIdErrorMessage,
      isAuthenticating,
      errorMessage,
      authenticateUser,
      closeDialog
    }
  }
})
</script> 