<template>
  <div class="kb-list">
    <h3>Knowledge Bases</h3>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading knowledge bases...</p>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- KB List -->
    <div v-if="!loading && knowledgeBases.length > 0" class="kb-grid">
      <div 
        v-for="kb in knowledgeBases" 
        :key="kb.id" 
        class="kb-card"
        :class="{ 'protected': kb.isProtected, 'current': kb.id === currentKBId }"
      >
        <div class="kb-header">
          <h4>{{ kb.name }}</h4>
          <div class="kb-actions">
            <!-- Protection Status Icon -->
            <span 
              v-if="kb.isProtected" 
              class="protection-icon"
              :title="`Protected by ${kb.owner}`"
            >
              🔒
            </span>
            <span v-else class="public-icon" title="Public KB">
              🌐
            </span>
            
            <!-- Protection Toggle -->
            <button 
              v-if="currentUser && kb.owner === currentUser.username"
              @click="toggleProtection(kb)"
              class="protection-toggle"
              :title="kb.isProtected ? 'Remove protection' : 'Add protection'"
            >
              {{ kb.isProtected ? '🔓' : '🔒' }}
            </button>
          </div>
        </div>
        
        <div class="kb-info">
          <p class="kb-description">{{ kb.description || 'No description' }}</p>
          <p class="kb-owner" v-if="kb.owner">
            Owner: {{ kb.owner }}
          </p>
        </div>
        
        <div class="kb-actions">
          <!-- Select KB Button -->
          <button 
            @click="selectKB(kb)"
            class="select-btn"
            :disabled="!canAccessKB(kb)"
          >
            {{ kb.id === currentKBId ? 'Current' : 'Select' }}
          </button>
          
          <!-- Authentication Required -->
          <div v-if="kb.isProtected && !canAccessKB(kb)" class="auth-required">
            <p>🔒 Authentication required</p>
            <button @click="authenticateForKB(kb)" class="auth-btn">
              Authenticate
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && knowledgeBases.length === 0" class="empty-state">
      <p>No knowledge bases available</p>
    </div>
    
    <!-- Authentication Modal -->
    <div v-if="showAuthModal" class="auth-modal">
      <div class="modal-content">
        <h3>Authenticate for {{ selectedKB?.name }}</h3>
        <p>This knowledge base is protected. Please authenticate with your passkey.</p>
        
        <div class="auth-form">
          <div class="form-group">
            <label for="auth-username">Username:</label>
            <input 
              id="auth-username" 
              v-model="authUsername" 
              type="text" 
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div class="auth-buttons">
            <button 
              @click="startKBAuthentication"
              :disabled="!authUsername || authLoading"
              class="auth-button"
            >
              {{ authLoading ? 'Authenticating...' : 'Authenticate with Passkey' }}
            </button>
            
            <button @click="closeAuthModal" class="cancel-button">
              Cancel
            </button>
          </div>
        </div>
        
        <div v-if="authError" class="auth-error">
          {{ authError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startAuthentication } from '@simplewebauthn/browser';

export default {
  name: 'KnowledgeBaseList',
  props: {
    currentUser: {
      type: Object,
      default: null
    },
    currentKBId: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      knowledgeBases: [],
      loading: false,
      error: null,
      showAuthModal: false,
      selectedKB: null,
      authUsername: '',
      authLoading: false,
      authError: null
    };
  },
  
  async mounted() {
    await this.loadKnowledgeBases();
  },
  
  methods: {
    async loadKnowledgeBases() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('/api/kb-protection/knowledge-bases');
        const data = await response.json();
        
        if (response.ok) {
          this.knowledgeBases = data.knowledge_bases || [];
        } else {
          throw new Error(data.error || 'Failed to load knowledge bases');
        }
      } catch (error) {
        console.error('Error loading knowledge bases:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    canAccessKB(kb) {
      if (!kb.isProtected) {
        return true; // Public KB
      }
      
      if (!this.currentUser) {
        return false; // No user logged in
      }
      
      return kb.owner === this.currentUser.username;
    },
    
    async selectKB(kb) {
      if (!this.canAccessKB(kb)) {
        this.selectedKB = kb;
        this.showAuthModal = true;
        return;
      }
      
      this.$emit('kb-selected', kb);
    },
    
    async authenticateForKB(kb) {
      this.selectedKB = kb;
      this.showAuthModal = true;
    },
    
    async startKBAuthentication() {
      if (!this.authUsername || !this.selectedKB) {
        return;
      }
      
      this.authLoading = true;
      this.authError = null;
      
      try {
        // Step 1: Get authentication options
        const optionsResponse = await fetch('/api/kb-protection/kb-auth-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kbId: this.selectedKB.id,
            username: this.authUsername
          })
        });
        
        const options = await optionsResponse.json();
        
        if (!optionsResponse.ok) {
          throw new Error(options.error || 'Failed to get authentication options');
        }
        
        // Step 2: Start authentication on client
        const authenticationResponse = await startAuthentication(options);
        
        // Step 3: Verify authentication on server
        const verifyResponse = await fetch('/api/kb-protection/authenticate-kb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kbId: this.selectedKB.id,
            username: this.authUsername,
            response: authenticationResponse
          })
        });
        
        const result = await verifyResponse.json();
        
        if (result.success) {
          this.$emit('kb-authenticated', this.selectedKB);
          this.closeAuthModal();
          await this.loadKnowledgeBases(); // Refresh the list
        } else {
          throw new Error(result.error || 'Authentication failed');
        }
      } catch (error) {
        console.error('KB authentication error:', error);
        this.authError = error.message || 'Authentication failed';
      } finally {
        this.authLoading = false;
      }
    },
    
    async toggleProtection(kb) {
      try {
        if (kb.isProtected) {
          // Remove protection
          const response = await fetch('/api/kb-protection/unprotect-kb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kbId: kb.id,
              owner: this.currentUser.username
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            await this.loadKnowledgeBases(); // Refresh the list
          } else {
            throw new Error(result.error);
          }
        } else {
          // Add protection
          const response = await fetch('/api/kb-protection/protect-kb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kbId: kb.id,
              kbName: kb.name,
              owner: this.currentUser.username,
              description: `Protected by ${this.currentUser.displayName}`
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            await this.loadKnowledgeBases(); // Refresh the list
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error) {
        console.error('Error toggling KB protection:', error);
        this.error = error.message;
      }
    },
    
    closeAuthModal() {
      this.showAuthModal = false;
      this.selectedKB = null;
      this.authUsername = '';
      this.authError = null;
    }
  }
};
</script>

<style scoped>
.kb-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.kb-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.kb-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.kb-card.protected {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.kb-card.current {
  border-color: #4ecdc4;
  background: #f0fffe;
}

.kb-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.kb-header h4 {
  margin: 0;
  color: #333;
}

.kb-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.protection-icon, .public-icon {
  font-size: 18px;
  cursor: help;
}

.protection-toggle {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.protection-toggle:hover {
  background-color: #f0f0f0;
}

.kb-info {
  margin-bottom: 15px;
}

.kb-description {
  color: #666;
  margin: 0 0 10px 0;
  font-size: 14px;
}

.kb-owner {
  color: #999;
  margin: 0;
  font-size: 12px;
}

.select-btn {
  background: #4ecdc4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.select-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.select-btn:hover:not(:disabled) {
  background: #45b7af;
}

.auth-required {
  margin-top: 10px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  text-align: center;
}

.auth-required p {
  margin: 0 0 10px 0;
  color: #856404;
  font-size: 14px;
}

.auth-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.auth-btn:hover {
  background: #ff5252;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4ecdc4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin: 20px 0;
  border: 1px solid #f5c6cb;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Modal Styles */
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #666;
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

.auth-buttons {
  display: flex;
  gap: 10px;
}

.auth-button, .cancel-button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.auth-button {
  background: #4ecdc4;
  color: white;
}

.auth-button:hover:not(:disabled) {
  background: #45b7af;
}

.auth-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cancel-button {
  background: #6c757d;
  color: white;
}

.cancel-button:hover {
  background: #545b62;
}

.auth-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  border: 1px solid #f5c6cb;
}
</style> 