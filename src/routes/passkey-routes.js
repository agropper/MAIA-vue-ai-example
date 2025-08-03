import express from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import crypto from 'crypto';

const router = express.Router();
let couchDBClient = null;

// Function to set the CouchDB client (will be called from server.js)
export const setCouchDBClient = (client) => {
  console.log('🔍 Setting CouchDB client for passkey routes:', !!client);
  couchDBClient = client;
};

// Helper function to convert stored credential format to WebAuthn format
const convertStoredCredential = (storedCredential) => {
  if (!storedCredential) return null;
  
  console.log('🔍 Converting stored credential:', typeof storedCredential, storedCredential);
  
  // If it's already a string (base64), return as is
  if (typeof storedCredential === 'string') {
    console.log('🔍 Returning as string (base64)');
    return storedCredential;
  }
  
  // If it's an object with numeric keys, convert to ArrayBuffer
  if (typeof storedCredential === 'object' && storedCredential !== null) {
    const keys = Object.keys(storedCredential).filter(key => !isNaN(parseInt(key))).sort((a, b) => parseInt(a) - parseInt(b));
    const buffer = new Uint8Array(keys.length);
    
    for (let i = 0; i < keys.length; i++) {
      buffer[i] = storedCredential[keys[i]];
    }
    
    console.log('🔍 Converting object to ArrayBuffer, length:', buffer.length);
    return buffer.buffer;
  }
  
  console.log('🔍 Returning as is');
  return storedCredential;
};

// Relying party configuration
const rpName = 'HIEofOne.org';
const rpID = 'localhost'; // For local development
const origin = `http://localhost:3001`; // Use the actual server origin

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
      console.log('🔍 Attempting to save user document for:', userId);
      await couchDBClient.saveDocument('maia_users', userDoc);
      console.log('✅ User document saved for registration:', userId);
    } catch (error) {
      console.error('❌ Failed to save user document:', error.message);
      // If database doesn't exist, create it first
      if (error.message.includes('error happened in your connection')) {
        try {
          console.log('🔍 Creating maia_users database...');
          await couchDBClient.createDatabase('maia_users');
          console.log('✅ Database created, now saving user document...');
          await couchDBClient.saveDocument('maia_users', userDoc);
          console.log('✅ Database created and user document saved:', userId);
        } catch (createError) {
          console.error('❌ Failed to create database:', createError);
          // For now, continue without database storage
          console.log('🔍 Continuing without database storage for:', userId);
        }
      } else {
        console.error('❌ Database error:', error);
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
      console.log('🔍 Getting user document for verification:', userId);
      console.log('🔍 CouchDB client available:', !!couchDBClient);
      userDoc = await couchDBClient.getDocument('maia_users', userId);
      console.log('🔍 User document retrieved:', !!userDoc);
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
    const credentialID = convertStoredCredential(userDoc.credentialID);
    
    console.log('🔍 Original credentialID:', userDoc.credentialID);
    console.log('🔍 Converted credentialID:', credentialID);
    console.log('🔍 credentialID type:', typeof credentialID);
    console.log('🔍 credentialID instanceof ArrayBuffer:', credentialID instanceof ArrayBuffer);
    
    // Convert ArrayBuffer to base64 string for transmission
    let credentialIDBase64;
    if (credentialID instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(credentialID);
      credentialIDBase64 = btoa(String.fromCharCode(...uint8Array));
      console.log('🔍 Converted ArrayBuffer to base64:', credentialIDBase64);
    } else if (typeof credentialID === 'string') {
      credentialIDBase64 = credentialID;
      console.log('🔍 Using string as base64:', credentialIDBase64);
    } else {
      console.log('🔍 Invalid credential ID format:', credentialID);
      throw new Error('Invalid credential ID format');
    }
    
    console.log('🔍 Final credentialIDBase64:', credentialIDBase64);
    
    // Generate authentication options manually instead of using the library
    // since it's not properly handling our credential ID
    const challenge = crypto.randomBytes(32);
    const challengeBase64 = isoBase64URL.fromBuffer(challenge);
    
    const options = {
      challenge: challengeBase64,
      allowCredentials: [{
        id: credentialIDBase64,
        type: 'public-key'
      }],
      timeout: 60000,
      userVerification: 'preferred',
      rpId: rpID,
      authenticatorAttachment: 'platform'
    };
    
    console.log('🔍 Generated options:', JSON.stringify(options, null, 2));

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
        credentialPublicKey: convertStoredCredential(userDoc.credentialPublicKey),
        credentialID: convertStoredCredential(userDoc.credentialID),
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