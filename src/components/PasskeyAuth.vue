<template>
  <div class="passkey-auth">
    <div v-if="!isAuthenticated" class="auth-container">
      <h2>{{ isRegistering ? 'Register with Passkey' : 'Login with Passkey' }}</h2>
      
      <!-- Registration Form -->
      <div v-if="isRegistering" class="auth-form">
        <div class="form-group">
          <label for="username">Username:</label>
          <input 
            id="username" 
            v-model="username" 
            type="text" 
            placeholder="Enter username"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="displayName">Display Name:</label>
          <input 
            id="displayName" 
            v-model="displayName" 
            type="text" 
            placeholder="Enter display name"
            required
          />
        </div>
        
        <button @click="register" :disabled="isLoading" class="auth-button">
          {{ isLoading ? 'Registering...' : 'Register with Passkey' }}
        </button>
      </div>
      
      <!-- Login Form -->
      <div v-else class="auth-form">
        <div class="form-group">
          <label for="loginUsername">Username:</label>
          <input 
            id="loginUsername" 
            v-model="username" 
            type="text" 
            placeholder="Enter username"
            required
          />
        </div>
        
        <button @click="login" :disabled="isLoading" class="auth-button">
          {{ isLoading ? 'Logging in...' : 'Login with Passkey' }}
        </button>
      </div>
      
      <!-- Toggle between login/register -->
      <div class="auth-toggle">
        <button @click="toggleMode" class="toggle-button">
          {{ isRegistering ? 'Already have an account? Login' : 'Need an account? Register' }}
        </button>
      </div>
    </div>
    
    <!-- Authenticated User Info -->
    <div v-else class="user-info">
      <h3>Welcome, {{ currentUser.displayName }}!</h3>
      <p>Username: {{ currentUser.username }}</p>
      <button @click="logout" class="logout-button">Logout</button>
    </div>
    
    <!-- Error Messages -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export default {
  name: 'PasskeyAuth',
  data() {
    return {
      isAuthenticated: false,
      isRegistering: false,
      isLoading: false,
      username: '',
      displayName: '',
      currentUser: null,
      error: ''
    };
  },
  
  async mounted() {
    await this.checkAuthStatus();
  },
  
  methods: {
    async checkAuthStatus() {
      try {
        const response = await fetch('/api/passkey/auth-status');
        const data = await response.json();
        
        if (data.authenticated) {
          this.isAuthenticated = true;
          this.currentUser = data.user;
          this.$emit('authenticated', data.user);
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
      }
    },
    
    async register() {
      if (!this.username || !this.displayName) {
        this.error = 'Please fill in all fields';
        return;
      }
      
      this.isLoading = true;
      this.error = '';
      
      try {
        // Step 1: Get registration options
        const optionsResponse = await fetch('/api/passkey/generate-registration-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            displayName: this.displayName
          })
        });
        
        const options = await optionsResponse.json();
        
        if (!optionsResponse.ok) {
          throw new Error(options.error || 'Failed to get registration options');
        }
        
        // Step 2: Start registration on client
        const registrationResponse = await startRegistration(options);
        
        // Step 3: Verify registration on server
        const verifyResponse = await fetch('/api/passkey/verify-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            response: registrationResponse
          })
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          this.isAuthenticated = true;
          this.currentUser = result.user;
          this.$emit('authenticated', result.user);
          this.error = '';
        } else {
          throw new Error(result.error || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        this.error = error.message || 'Registration failed';
      } finally {
        this.isLoading = false;
      }
    },
    
    async login() {
      if (!this.username) {
        this.error = 'Please enter username';
        return;
      }
      
      this.isLoading = true;
      this.error = '';
      
      try {
        // Step 1: Get authentication options
        const optionsResponse = await fetch('/api/passkey/generate-authentication-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username })
        });
        
        const options = await optionsResponse.json();
        
        if (!optionsResponse.ok) {
          throw new Error(options.error || 'Failed to get authentication options');
        }
        
        // Step 2: Start authentication on client
        const authenticationResponse = await startAuthentication(options);
        
        // Step 3: Verify authentication on server
        const verifyResponse = await fetch('/api/passkey/verify-authentication', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.username,
            response: authenticationResponse
          })
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          this.isAuthenticated = true;
          this.currentUser = result.user;
          this.$emit('authenticated', result.user);
          this.error = '';
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        this.error = error.message || 'Authentication failed';
      } finally {
        this.isLoading = false;
      }
    },
    
    async logout() {
      try {
        await fetch('/api/passkey/logout', { method: 'POST' });
        this.isAuthenticated = false;
        this.currentUser = null;
        this.$emit('logout');
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
    
    toggleMode() {
      this.isRegistering = !this.isRegistering;
      this.error = '';
    }
  }
};
</script>

<style scoped>
.passkey-auth {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.auth-container {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.auth-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 10px;
}

.auth-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-button:hover:not(:disabled) {
  background: #0056b3;
}

.toggle-button {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 14px;
}

.user-info {
  background: #e8f5e8;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.logout-button {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background: #c82333;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  border: 1px solid #f5c6cb;
}
</style> 