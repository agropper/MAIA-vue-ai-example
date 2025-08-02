import express from 'express';
import { createCouchDBClient } from '../utils/couchdb-client.js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

const router = express.Router();
const couchDBClient = createCouchDBClient();

// Relying party configuration
const rpName = 'HIEofOne.org';
const rpID = 'localhost'; // For local development
const origin = `https://${rpID}`;

// Check if user ID is available
router.post('/check-user', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user exists in Cloudant
    try {
      const existingUser = await couchDBClient.getDocument('maia_users', userId);
      res.json({ 
        available: !existingUser,
        message: existingUser ? 'User ID already exists' : 'User ID is available'
      });
    } catch (error) {
      console.log('🔍 Database error:', error.message);
      // If database doesn't exist or document not found, user ID is available
      if (error.message.includes('not found') || 
          error.message.includes('does not exist') ||
          error.message.includes('error happened in your connection')) {
        res.json({ 
          available: true,
          message: 'User ID is available (database not initialized)'
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error checking user ID:', error);
    res.status(500).json({ error: 'Failed to check user ID availability' });
  }
});

// Generate registration options
router.post('/register', async (req, res) => {
  try {
    const { userId, displayName, domain = 'HIEofOne.org' } = req.body;
    
    if (!userId || !displayName) {
      return res.status(400).json({ error: 'User ID and display name are required' });
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await couchDBClient.getDocument('maia_users', userId);
    } catch (error) {
      // If database doesn't exist, that's fine - user can register
      if (error.message.includes('error happened in your connection')) {
        existingUser = null;
      } else {
        throw error;
      }
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'User ID already exists' });
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: displayName,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    });

    // Store challenge in session or temporary storage
    // For now, we'll store it in the user document
    const userDoc = {
      _id: userId,
      userId,
      displayName,
      domain,
      challenge: options.challenge,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store user document with challenge for verification
    try {
      await couchDBClient.saveDocument('maia_users', userDoc);
      console.log('🔍 User document saved for registration:', userId);
    } catch (error) {
      console.log('🔍 Failed to save user document:', error.message);
      // If database doesn't exist, create it first
      if (error.message.includes('error happened in your connection')) {
        try {
          await couchDBClient.createDatabase('maia_users');
          await couchDBClient.saveDocument('maia_users', userDoc);
          console.log('🔍 Database created and user document saved:', userId);
        } catch (createError) {
          console.error('❌ Failed to create database:', createError);
          // For now, continue without database storage
          console.log('🔍 Continuing without database storage for:', userId);
        }
      } else {
        throw error;
      }
    }
    
    res.json(options);
  } catch (error) {
    console.error('❌ Error generating registration options:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// Verify registration response
router.post('/register-verify', async (req, res) => {
  try {
    const { userId, response } = req.body;
    
    if (!userId || !response) {
      return res.status(400).json({ error: 'User ID and response are required' });
    }

    // Get the user document with the stored challenge
    let userDoc;
    try {
      userDoc = await couchDBClient.getDocument('maia_users', userId);
    } catch (error) {
      console.error('❌ Error getting user document:', error);
      return res.status(404).json({ error: 'User registration not found. Please try registering again.' });
    }

    if (!userDoc || !userDoc.challenge) {
      return res.status(400).json({ error: 'No registration challenge found. Please try registering again.' });
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: userDoc.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (verification.verified) {
      // Update user document with credential information
      const updatedUser = {
        ...userDoc,
        credentialID: verification.registrationInfo.credentialID,
        credentialPublicKey: verification.registrationInfo.credentialPublicKey,
        counter: verification.registrationInfo.counter,
        transports: response.response.transports || [],
        challenge: undefined, // Remove the challenge
        updatedAt: new Date().toISOString()
      };

      // Save the updated user document to Cloudant
      await couchDBClient.saveDocument('maia_users', updatedUser);
      
      console.log('✅ Passkey registration successful for user:', userId);
      
      res.json({ 
        success: true, 
        message: 'Passkey registration successful',
        user: {
          userId: updatedUser.userId,
          displayName: updatedUser.displayName
        }
      });
    } else {
      console.error('❌ Registration verification failed for user:', userId);
      res.status(400).json({ error: 'Registration verification failed' });
    }
  } catch (error) {
    console.error('❌ Error verifying registration:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// Generate authentication options
router.post('/authenticate', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user document
    let userDoc;
    try {
      userDoc = await couchDBClient.getDocument('maia_users', userId);
    } catch (error) {
      if (error.message.includes('error happened in your connection')) {
        return res.status(404).json({ error: 'User not found (database not initialized)' });
      }
      throw error;
    }
    
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!userDoc.credentialID) {
      return res.status(400).json({ error: 'User has no registered passkey' });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: [{
        id: userDoc.credentialID,
        type: 'public-key'
      }],
      userVerification: 'preferred'
    });

    // Store challenge in user document
    const updatedUser = {
      ...userDoc,
      challenge: options.challenge,
      updatedAt: new Date().toISOString()
    };

    await couchDBClient.saveDocument('maia_users', updatedUser);
    
    res.json(options);
  } catch (error) {
    console.error('❌ Error generating authentication options:', error);
    res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

// Verify authentication response
router.post('/authenticate-verify', async (req, res) => {
  try {
    const { userId, response } = req.body;
    
    if (!userId || !response) {
      return res.status(400).json({ error: 'User ID and response are required' });
    }

    // Get user document with challenge
    const userDoc = await couchDBClient.getDocument('maia_users', userId);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: userDoc.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: userDoc.credentialPublicKey,
        credentialID: userDoc.credentialID,
        counter: userDoc.counter || 0
      }
    });

    if (verification.verified) {
      // Update counter
      const updatedUser = {
        ...userDoc,
        counter: verification.authenticationInfo.newCounter,
        challenge: undefined, // Remove challenge
        updatedAt: new Date().toISOString()
      };

      await couchDBClient.saveDocument('maia_users', updatedUser);
      
      res.json({ 
        success: true, 
        message: 'Authentication successful',
        user: {
          userId: updatedUser.userId,
          displayName: updatedUser.displayName
        }
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('❌ Error verifying authentication:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Get user info
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await couchDBClient.getDocument('maia_users', userId);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't return sensitive credential data
    res.json({
      userId: userDoc.userId,
      displayName: userDoc.displayName,
      domain: userDoc.domain,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    });
  } catch (error) {
    console.error('❌ Error getting user info:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router; 