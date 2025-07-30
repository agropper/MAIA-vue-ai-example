import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

// PostgreSQL client
let pgClient;

const initDatabase = async () => {
  if (!pgClient) {
    pgClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await pgClient.connect();
  }
};

// Initialize database tables
export const initAuthTables = async () => {
  await initDatabase();
  
  // Create users table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create passkey credentials table
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS passkey_credentials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      credential_id VARCHAR(255) UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      sign_count BIGINT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('✅ Authentication tables initialized');
};

// Generate registration options for new user
export const generateRegistrationOptions = async (username, displayName) => {
  await initDatabase();

  // Check if user already exists
  const existingUser = await pgClient.query(
    'SELECT id FROM users WHERE username = $1',
    [username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Username already exists');
  }

  // Create user
  const userResult = await pgClient.query(
    'INSERT INTO users (username, display_name) VALUES ($1, $2) RETURNING id',
    [username, displayName]
  );

  const userId = userResult.rows[0].id;

  // Generate registration options
  const options = await generateRegistrationOptions({
    rpName: 'MAIA Healthcare',
    rpID: process.env.RP_ID || 'localhost',
    userID: userId,
    userName: username,
    userDisplayName: displayName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge in session or temporary storage
  // For simplicity, we'll use a simple in-memory store
  // In production, use Redis or database
  global.registrationChallenges = global.registrationChallenges || new Map();
  global.registrationChallenges.set(userId, options.challenge);

  return {
    options,
    userId
  };
};

// Verify registration response
export const verifyRegistration = async (userId, response) => {
  await initDatabase();

  const challenge = global.registrationChallenges?.get(userId);
  if (!challenge) {
    throw new Error('Registration challenge not found');
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: process.env.ORIGIN || 'http://localhost:3001',
    expectedRPID: process.env.RP_ID || 'localhost',
  });

  if (verification.verified) {
    // Store the credential
    await pgClient.query(
      'INSERT INTO passkey_credentials (user_id, credential_id, public_key, sign_count) VALUES ($1, $2, $3, $4)',
      [
        userId,
        verification.registrationInfo.credentialID,
        verification.registrationInfo.credentialPublicKey,
        verification.registrationInfo.signCount
      ]
    );

    // Clean up challenge
    global.registrationChallenges.delete(userId);

    return { verified: true };
  }

  return { verified: false };
};

// Generate authentication options
export const generateAuthenticationOptions = async (username) => {
  await initDatabase();

  // Get user
  const userResult = await pgClient.query(
    'SELECT id, username, display_name FROM users WHERE username = $1',
    [username]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get user's credentials
  const credentialsResult = await pgClient.query(
    'SELECT credential_id, public_key, sign_count FROM passkey_credentials WHERE user_id = $1',
    [user.id]
  );

  const credentials = credentialsResult.rows.map(row => ({
    id: row.credential_id,
    publicKey: row.public_key,
    signCount: parseInt(row.sign_count)
  }));

  // Generate authentication options
  const options = await generateAuthenticationOptions({
    rpID: process.env.RP_ID || 'localhost',
    allowCredentials: credentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
    })),
    userVerification: 'preferred',
  });

  // Store challenge and expected credentials
  global.authenticationChallenges = global.authenticationChallenges || new Map();
  global.authenticationChallenges.set(options.challenge, {
    userId: user.id,
    expectedCredentials: credentials
  });

  return {
    options,
    user
  };
};

// Verify authentication response
export const verifyAuthentication = async (response) => {
  await initDatabase();

  const challengeData = global.authenticationChallenges?.get(response.challenge);
  if (!challengeData) {
    throw new Error('Authentication challenge not found');
  }

  const { userId, expectedCredentials } = challengeData;

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: response.challenge,
    expectedOrigin: process.env.ORIGIN || 'http://localhost:3001',
    expectedRPID: process.env.RP_ID || 'localhost',
    authenticator: expectedCredentials.find(cred => 
      cred.id === response.id
    ),
  });

  if (verification.verified) {
    // Update sign count
    await pgClient.query(
      'UPDATE passkey_credentials SET sign_count = $1 WHERE credential_id = $2',
      [verification.authenticationInfo.newSignCount, response.id]
    );

    // Clean up challenge
    global.authenticationChallenges.delete(response.challenge);

    return {
      verified: true,
      userId
    };
  }

  return { verified: false };
};

// Get user by ID
export const getUserById = async (userId) => {
  await initDatabase();

  const result = await pgClient.query(
    'SELECT id, username, display_name, created_at FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

// Get user by username
export const getUserByUsername = async (username) => {
  await initDatabase();

  const result = await pgClient.query(
    'SELECT id, username, display_name, created_at FROM users WHERE username = $1',
    [username]
  );

  return result.rows[0] || null;
};

// Delete user and all associated data
export const deleteUser = async (userId) => {
  await initDatabase();

  await pgClient.query('DELETE FROM users WHERE id = $1', [userId]);
};

// Close database connection
export const closeDatabase = async () => {
  if (pgClient) {
    await pgClient.end();
  }
}; 