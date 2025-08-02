# Knowledge Base Protection Testing Guide

## 🎯 **Overview**

This guide demonstrates how to test the progressive security model where:
- **Public KBs** work immediately without authentication
- **Protected KBs** require passkey authentication
- Users can protect their own KBs with passkeys
- Authentication is only prompted when accessing protected KBs

## 🚀 **Quick Start**

### 1. **Start the Server**
```bash
npm start
```

### 2. **Access MAIA**
- Open `http://localhost:3001`
- You should see the knowledge base list with protection controls

## 🧪 **Testing Scenarios**

### **Scenario 1: Public KB Access (No Authentication)**
1. **Load the page** - All public KBs should be visible
2. **Select a public KB** - Should work immediately
3. **Start chatting** - Agent should connect to the public KB

### **Scenario 2: Register a User with Passkey**
1. **Click "Register"** in the passkey authentication component
2. **Enter username and display name**
3. **Create passkey** using your device's biometric/security key
4. **Verify registration** - User should be logged in

### **Scenario 3: Protect a Knowledge Base**
1. **Login with your passkey**
2. **Find a KB you want to protect**
3. **Click the lock icon (🔒)** next to the KB name
4. **Confirm protection** - KB should show as protected (🔒)

### **Scenario 4: Access Protected KB (Owner)**
1. **Select your protected KB**
2. **Should work immediately** (you're the owner)
3. **Start chatting** - Agent should connect to your protected KB

### **Scenario 5: Access Protected KB (Non-Owner)**
1. **Logout** or use a different user
2. **Try to select a protected KB**
3. **Authentication modal should appear**
4. **Enter the owner's username**
5. **Authenticate with passkey**
6. **Access should be granted**

### **Scenario 6: Remove KB Protection**
1. **Login as the KB owner**
2. **Click the unlock icon (🔓)** next to your protected KB
3. **Confirm removal** - KB should become public again

## 🔧 **Technical Implementation**

### **Database Structure**
```
maia_knowledge_bases/
├── kb_id_1/
│   ├── isProtected: true
│   ├── owner: "username"
│   ├── description: "Protected by username"
│   └── created: "2024-01-01T00:00:00Z"
└── kb_id_2/
    ├── isProtected: false
    └── (no protection data)

maia_user_knowledge_bases/
├── username_kb_id_1/
│   ├── username: "username"
│   ├── kbId: "kb_id_1"
│   ├── hasAccess: true
│   └── grantedAt: "2024-01-01T00:00:00Z"
```

### **API Endpoints**
- `GET /api/kb-protection/knowledge-bases` - Get all KBs with protection status
- `POST /api/kb-protection/protect-kb` - Protect a KB
- `POST /api/kb-protection/unprotect-kb` - Remove KB protection
- `POST /api/kb-protection/check-kb-access` - Check if user can access KB
- `POST /api/kb-protection/authenticate-kb` - Authenticate for protected KB
- `POST /api/kb-protection/kb-auth-options` - Get auth options for KB

### **Security Features**
- ✅ **Progressive security** - Public KBs work without auth
- ✅ **Owner-only protection** - Only KB owners can protect/unprotect
- ✅ **Passkey authentication** - Secure biometric/security key auth
- ✅ **Session management** - Persistent authentication
- ✅ **Access logging** - Track who accesses what
- ✅ **Cloudant storage** - Secure credential storage

## 🎯 **Demo Flow**

### **For Demonstrations:**
1. **Show public KBs** - "These work immediately"
2. **Register a user** - "Let's create a secure account"
3. **Protect a KB** - "Now this KB requires authentication"
4. **Try accessing as non-owner** - "See the authentication prompt"
5. **Authenticate successfully** - "Access granted with passkey"
6. **Show owner access** - "Owners can access immediately"

### **Security Benefits:**
- **No barriers to entry** - Public KBs work immediately
- **Progressive security** - Only protected KBs require auth
- **User control** - Users decide what to protect
- **Secure authentication** - Passkeys are more secure than passwords
- **Audit trail** - Track all access attempts

## 🔒 **Security Considerations**

### **DO Dashboard Bypass Risk:**
- **Mitigation**: User credentials stored in Cloudant, not DO
- **Mitigation**: Encrypted sensitive data
- **Mitigation**: Access logging for audit trail

### **Saved Chat Security:**
- **Future enhancement**: Encrypt chat data with user-specific keys
- **Future enhancement**: Associate chats with authenticated users

### **Additional Security Measures:**
- **Rate limiting** on authentication attempts
- **Session timeout** for inactive users
- **HTTPS requirement** for production
- **Domain validation** for passkey registration

## 🚀 **Production Deployment**

### **Environment Variables:**
```bash
# For production
RP_ID=your-domain.com
ORIGIN=https://your-domain.com
SESSION_SECRET=your-secure-session-secret

# For local testing
RP_ID=localhost
ORIGIN=http://localhost:3001
SESSION_SECRET=your-local-session-secret
```

### **HTTPS Requirement:**
- Passkeys require secure context (HTTPS)
- Local development works with HTTP
- Production must use HTTPS

## 📝 **Testing Checklist**

- [ ] Public KBs load without authentication
- [ ] User registration with passkey works
- [ ] User login with passkey works
- [ ] KB protection can be added by owner
- [ ] KB protection can be removed by owner
- [ ] Protected KBs require authentication for non-owners
- [ ] Authentication modal appears for protected KBs
- [ ] Passkey authentication works for protected KBs
- [ ] Access is granted after successful authentication
- [ ] Session persists across page reloads
- [ ] Logout clears session
- [ ] Error handling works for failed authentication
- [ ] UI shows protection status correctly
- [ ] Protection icons display correctly

## 🎉 **Success Criteria**

✅ **Progressive security model works**
✅ **Public KBs accessible without barriers**
✅ **Protected KBs require authentication**
✅ **Passkey authentication is secure and user-friendly**
✅ **Users can control their own KB protection**
✅ **UI clearly shows protection status**
✅ **Authentication flow is smooth and intuitive**

---

**Ready to test? Start the server and begin with Scenario 1!** 🚀 