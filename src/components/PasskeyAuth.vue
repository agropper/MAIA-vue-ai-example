<template>
  <div class="passkey-auth">
    <!-- Login Form -->
    <div v-if="!isRegistering && !isAuthenticating" class="auth-form">
      <h2>Sign in to MAIA</h2>
      
      <div class="form-group">
        <label for="username">Username</label>
        <input 
          id="username"
          v-model="username" 
          type="text" 
          placeholder="Enter your username"
          :disabled="isLoading"
        />
      </div>

      <div class="auth-buttons">
        <button 
          @click="startLogin" 
          :disabled="!username || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading">Signing in...</span>
          <span v-else>Sign in with Passkey</span>
        </button>
        
        <button 
          @click="switchToRegister" 
          :disabled="isLoading"
          class="btn btn-secondary"
        >
          Create Account
        </button>
      </div>
    </div>

    <!-- Registration Form -->
    <div v-if="isRegistering && !isAuthenticating" class="auth-form">
      <h2>Create MAIA Account</h2>
      
      <div class="form-group">
        <label for="reg-username">Username</label>
        <input 
          id="reg-username"
          v-model="username" 
          type="text" 
          placeholder="Choose a username"
          :disabled="isLoading"
          @blur="checkUsername"
        />
        <div v-if="usernameCheck" class="username-feedback">
          <span v-if="usernameCheck.available" class="available">✓ Username available</span>
          <span v-else class="unavailable">✗ Username taken</span>
        </div>
      </div>

      <div class="form-group">
        <label for="display-name">Display Name</label>
        <input 
          id="display-name"
          v-model="displayName" 
          type="text" 
          placeholder="Enter your display name"
          :disabled="isLoading"
        />
      </div>

      <div class="auth-buttons">
        <button 
          @click="startRegistration" 
          :disabled="!canRegister || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading">Creating account...</span>
          <span v-else>Create Account with Passkey</span>
        </button>
        
        <button 
          @click="switchToLogin" 
          :disabled="isLoading"
          class="btn btn-secondary"
        >
          Back to Sign In
        </button>
      </div>
    </div>

    <!-- Authentication in Progress -->
    <div v-if="isAuthenticating" class="auth-progress">
      <div class="spinner"></div>
      <p>{{ authMessage }}</p>
      <button @click="cancelAuth" class="btn btn-secondary">Cancel</button>
    </div>

    <!-- Error Messages -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export default {
  name: 'PasskeyAuth',
  emits: ['authenticated', 'registered'],
  setup(props, { emit }) {
    const username = ref('')
    const displayName = ref('')
    const isLoading = ref(false)
    const isRegistering = ref(false)
    const isAuthenticating = ref(false)
    const authMessage = ref('')
    const error = ref('')
    const usernameCheck = ref(null)

    // Computed properties
    const canRegister = computed(() => {
      return username.value && 
             displayName.value && 
             usernameCheck.value?.available &&
             !isLoading.value
    })

    // Watch for username changes to check availability
    watch(username, (newUsername) => {
      if (newUsername && newUsername.length >= 3) {
        checkUsername()
      } else {
        usernameCheck.value = null
      }
    })

    // Check username availability
    const checkUsername = async () => {
      if (!username.value || username.value.length < 3) return
      
      try {
        const response = await fetch(`/api/auth/check-username/${username.value}`)
        const data = await response.json()
        usernameCheck.value = data
      } catch (err) {
        console.error('Error checking username:', err)
      }
    }

    // Switch to registration mode
    const switchToRegister = () => {
      isRegistering.value = true
      error.value = ''
      usernameCheck.value = null
    }

    // Switch to login mode
    const switchToLogin = () => {
      isRegistering.value = false
      error.value = ''
      usernameCheck.value = null
    }

    // Start registration process
    const startRegistration = async () => {
      if (!canRegister.value) return

      isLoading.value = true
      error.value = ''
      isAuthenticating.value = true
      authMessage.value = 'Creating your account...'

      try {
        // Step 1: Get registration options from server
        const response = await fetch('/api/auth/register/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username.value,
            displayName: displayName.value
          })
        })

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to start registration')
        }

        authMessage.value = 'Creating your passkey...'

        // Step 2: Create passkey in browser
        const registrationResponse = await startRegistration(data.options)

        authMessage.value = 'Verifying your passkey...'

        // Step 3: Verify with server
        const verifyResponse = await fetch('/api/auth/register/finish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: data.userId,
            response: registrationResponse
          })
        })

        const verifyData = await verifyResponse.json()
        
        if (verifyData.success) {
          emit('registered', verifyData.user)
        } else {
          throw new Error(verifyData.error || 'Registration failed')
        }

      } catch (err) {
        console.error('Registration error:', err)
        error.value = err.message || 'Registration failed'
      } finally {
        isLoading.value = false
        isAuthenticating.value = false
        authMessage.value = ''
      }
    }

    // Start login process
    const startLogin = async () => {
      if (!username.value) return

      isLoading.value = true
      error.value = ''
      isAuthenticating.value = true
      authMessage.value = 'Starting authentication...'

      try {
        // Step 1: Get authentication options from server
        const response = await fetch('/api/auth/login/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username.value
          })
        })

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to start authentication')
        }

        authMessage.value = 'Authenticating with your passkey...'

        // Step 2: Authenticate with passkey
        const authenticationResponse = await startAuthentication(data.options)

        authMessage.value = 'Verifying authentication...'

        // Step 3: Verify with server
        const verifyResponse = await fetch('/api/auth/login/finish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            response: authenticationResponse
          })
        })

        const verifyData = await verifyResponse.json()
        
        if (verifyData.success) {
          emit('authenticated', verifyData.user)
        } else {
          throw new Error(verifyData.error || 'Authentication failed')
        }

      } catch (err) {
        console.error('Login error:', err)
        error.value = err.message || 'Authentication failed'
      } finally {
        isLoading.value = false
        isAuthenticating.value = false
        authMessage.value = ''
      }
    }

    // Cancel authentication
    const cancelAuth = () => {
      isAuthenticating.value = false
      isLoading.value = false
      authMessage.value = ''
      error.value = ''
    }

    return {
      username,
      displayName,
      isLoading,
      isRegistering,
      isAuthenticating,
      authMessage,
      error,
      usernameCheck,
      canRegister,
      checkUsername,
      switchToRegister,
      switchToLogin,
      startRegistration,
      startLogin,
      cancelAuth
    }
  }
}
</script>

<style scoped>
.passkey-auth {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.auth-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.auth-form h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.username-feedback {
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.username-feedback .available {
  color: #28a745;
}

.username-feedback .unavailable {
  color: #dc3545;
}

.auth-buttons {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.auth-progress {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

@media (max-width: 480px) {
  .passkey-auth {
    padding: 1rem;
  }
  
  .auth-form {
    padding: 1.5rem;
  }
}
</style> 