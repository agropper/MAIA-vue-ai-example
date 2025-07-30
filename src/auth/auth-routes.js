import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { 
  initAuthTables,
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  getUserById,
  getUserByUsername
} from './passkey-auth.js';

const router = express.Router();

// Initialize authentication tables
initAuthTables().catch(console.error);

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
router.use(authLimiter);

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
};

// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Optional authentication middleware
export const optionalAuth = (req, res, next) => {
  if (req.session.userId) {
    req.user = req.session.user;
  }
  next();
};

// Get current user
router.get('/me', optionalAuth, async (req, res) => {
  try {
    if (req.session.userId) {
      const user = await getUserById(req.session.userId);
      if (user) {
        res.json({ 
          authenticated: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name
          }
        });
      } else {
        // User not found, clear session
        req.session.destroy();
        res.json({ authenticated: false });
      }
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start registration process
router.post('/register/start', async (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username || !displayName) {
      return res.status(400).json({ 
        error: 'Username and display name are required' 
      });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens' 
      });
    }

    const result = await generateRegistrationOptions(username, displayName);
    
    res.json({
      success: true,
      options: result.options,
      userId: result.userId
    });
  } catch (error) {
    console.error('Registration start error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to start registration' 
    });
  }
});

// Complete registration
router.post('/register/finish', async (req, res) => {
  try {
    const { userId, response } = req.body;

    if (!userId || !response) {
      return res.status(400).json({ 
        error: 'User ID and response are required' 
      });
    }

    const result = await verifyRegistration(userId, response);
    
    if (result.verified) {
      // Get user info for session
      const user = await getUserById(userId);
      
      // Create session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      };

      res.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Registration verification failed' 
      });
    }
  } catch (error) {
    console.error('Registration finish error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to complete registration' 
    });
  }
});

// Start authentication process
router.post('/login/start', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        error: 'Username is required' 
      });
    }

    const result = await generateAuthenticationOptions(username);
    
    res.json({
      success: true,
      options: result.options,
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.display_name
      }
    });
  } catch (error) {
    console.error('Login start error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to start authentication' 
    });
  }
});

// Complete authentication
router.post('/login/finish', async (req, res) => {
  try {
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ 
        error: 'Response is required' 
      });
    }

    const result = await verifyAuthentication(response);
    
    if (result.verified) {
      // Get user info for session
      const user = await getUserById(result.userId);
      
      // Create session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      };

      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          username: user.username,
          displayName: user.display_name
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Authentication verification failed' 
      });
    }
  } catch (error) {
    console.error('Login finish error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to complete authentication' 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });
});

// Check if username is available
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const user = await getUserByUsername(username);
    
    res.json({
      available: !user,
      username: username
    });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile (requires authentication)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      req.session.destroy();
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (requires authentication)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    // Update user display name
    const result = await pgClient.query(
      'UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [displayName, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Update session
    req.session.user.displayName = user.display_name;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 