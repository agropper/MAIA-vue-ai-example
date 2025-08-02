import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

// Local development configuration
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || `http://${rpID}:3001`;

class PasskeyAuth {
  constructor() {
    this.users = new Map(); // In-memory user store for local testing
    this.expectedChallenge = new Map(); // Store expected challenges
  }

  // Generate registration options for new user
  async generateRegistrationOptions(username, displayName) {
    const user = {
      id: this.generateUserId(),
      username,
      displayName,
      credentials: []
    };

    const options = await generateRegistrationOptions({
      rpName: 'MAIA Local',
      rpID,
      userID: user.id,
      userName: username,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      }
    });

    // Store user and expected challenge
    this.users.set(username, user);
    this.expectedChallenge.set(username, options.challenge);

    return options;
  }

  // Generate authentication options for existing user
  async generateAuthenticationOptions(username) {
    const user = this.users.get(username);
    if (!user) {
      throw new Error('User not found');
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.credentials.map(cred => ({
        id: cred.id,
        type: 'public-key',
        transports: cred.transports
      })),
      userVerification: 'preferred'
    });

    // Store expected challenge
    this.expectedChallenge.set(username, options.challenge);

    return options;
  }

  // Verify registration response
  async verifyRegistrationResponse(username, response) {
    const user = this.users.get(username);
    const expectedChallenge = this.expectedChallenge.get(username);

    if (!user || !expectedChallenge) {
      throw new Error('Invalid registration attempt');
    }

    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID
      });

      if (verification.verified) {
        // Store the new credential
        user.credentials.push({
          id: verification.registrationInfo.credentialID,
          publicKey: verification.registrationInfo.credentialPublicKey,
          counter: verification.registrationInfo.counter,
          transports: response.response.transports || []
        });

        // Clear expected challenge
        this.expectedChallenge.delete(username);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Registration verification failed:', error);
      throw new Error('Registration verification failed');
    }
  }

  // Verify authentication response
  async verifyAuthenticationResponse(username, response) {
    const user = this.users.get(username);
    const expectedChallenge = this.expectedChallenge.get(username);

    if (!user || !expectedChallenge) {
      throw new Error('Invalid authentication attempt');
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: user.credentials.find(cred => 
          cred.id.toString('base64url') === response.id
        )
      });

      if (verification.verified) {
        // Update credential counter
        const credential = user.credentials.find(cred => 
          cred.id.toString('base64url') === response.id
        );
        if (credential) {
          credential.counter = verification.authenticationInfo.newCounter;
        }

        // Clear expected challenge
        this.expectedChallenge.delete(username);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Authentication verification failed:', error);
      throw new Error('Authentication verification failed');
    }
  }

  // Helper method to generate user ID
  generateUserId() {
    return Buffer.from(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).toString('base64url');
  }

  // Get user by username
  getUser(username) {
    return this.users.get(username);
  }

  // List all users (for testing)
  getAllUsers() {
    return Array.from(this.users.values());
  }
}

export default PasskeyAuth; 