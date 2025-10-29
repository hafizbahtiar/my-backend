/**
 * Quick test to verify JWT token implementation
 * Run with: bun run src/utils/jwt.test.ts
 */

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  extractTokenFromHeader,
  JWT_CONFIG,
} from './jwt';

async function testJWTImplementation() {
  console.log('🧪 Testing JWT Token Implementation\n');

  // Test data
  const userId = '507f1f77bcf86cd799439011';
  const email = 'test@example.com';
  const sessionId = '507f191e810c19729de860ea';

  // Test 1: Generate Access Token
  console.log('Test 1: Generate Access Token');
  try {
    const accessToken = signAccessToken(userId, email, sessionId);
    console.log('✅ Access token generated');
    console.log(`   Token length: ${accessToken.length} characters`);
    console.log(`   Token preview: ${accessToken.substring(0, 30)}...\n`);

    // Test 2: Verify Access Token
    console.log('Test 2: Verify Access Token');
    const decoded = verifyAccessToken(accessToken);
    console.log('✅ Token verified successfully');
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Email: ${decoded.email}`);
    console.log(`   Session ID: ${decoded.sessionId}\n`);

    // Test 3: Try to verify invalid token
    console.log('Test 3: Verify Invalid Token');
    try {
      verifyAccessToken('invalid.token.here');
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log('✅ Invalid token correctly rejected');
      console.log(`   Error: ${error instanceof Error ? error.message : error}\n`);
    }

  } catch (error) {
    console.error('❌ Test 1-3 failed:', error);
  }

  // Test 4: Generate Refresh Token
  console.log('Test 4: Generate Refresh Token');
  try {
    const refreshToken = signRefreshToken(userId, sessionId);
    console.log('✅ Refresh token generated');
    console.log(`   Token length: ${refreshToken.length} characters\n`);

    // Test 5: Verify Refresh Token
    const refreshDecoded = verifyRefreshToken(refreshToken);
    console.log('Test 5: Verify Refresh Token');
    console.log('✅ Refresh token verified');
    console.log(`   User ID: ${refreshDecoded.userId}`);
    console.log(`   Session ID: ${refreshDecoded.sessionId}\n`);
  } catch (error) {
    console.error('❌ Test 4-5 failed:', error);
  }

  // Test 6: Decode token without verification
  console.log('Test 6: Decode Token Without Verification');
  try {
    const accessToken = signAccessToken(userId, email, sessionId);
    const decoded = decodeToken(accessToken);
    console.log('✅ Token decoded');
    console.log(`   Contains userId: ${decoded?.userId === userId}\n`);
  } catch (error) {
    console.error('❌ Test 6 failed:', error);
  }

  // Test 7: Check expiration
  console.log('Test 7: Check Token Expiration');
  try {
    const accessToken = signAccessToken(userId, email, sessionId);
    const expired = isTokenExpired(accessToken);
    const expiration = getTokenExpiration(accessToken);
    console.log(`✅ Token expiration check: ${expired ? 'EXPIRED' : 'VALID'}`);
    if (expiration) {
      console.log(`   Expires at: ${expiration.toISOString()}`);
      console.log(`   Time until expiry: ${Math.round((expiration.getTime() - Date.now()) / 1000)} seconds\n`);
    }
  } catch (error) {
    console.error('❌ Test 7 failed:', error);
  }

  // Test 8: Extract token from header
  console.log('Test 8: Extract Token From Header');
  try {
    const bearer = `Bearer ${signAccessToken(userId, email, sessionId)}`;
    const token = extractTokenFromHeader(bearer);
    console.log(`✅ Token extracted: ${token ? 'SUCCESS' : 'FAILED'}`);
    
    const invalid = extractTokenFromHeader('Invalid format');
    console.log(`✅ Invalid format rejected: ${invalid === null ? 'SUCCESS' : 'FAILED'}`);
    
    const missing = extractTokenFromHeader(undefined);
    console.log(`✅ Missing header handled: ${missing === null ? 'SUCCESS' : 'FAILED'}\n`);
  } catch (error) {
    console.error('❌ Test 8 failed:', error);
  }

  // Test 9: Configuration
  console.log('Test 9: JWT Configuration');
  console.log('✅ Configuration loaded:');
  console.log(`   Access token expiry: ${JWT_CONFIG.accessTokenExpiry}`);
  console.log(`   Refresh token expiry: ${JWT_CONFIG.refreshTokenExpiry}`);
  console.log(`   Algorithm: ${JWT_CONFIG.algorithm}`);
  console.log(`   Secret configured: ${JWT_CONFIG.secret.length >= 32 ? 'YES' : 'NO (WARNING!)'}\n`);

  console.log('✨ All tests completed!');
}

// Run tests
testJWTImplementation().catch(console.error);

