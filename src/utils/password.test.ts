/**
 * Quick test to verify password hashing implementation
 * Run with: bun run src/utils/password.test.ts
 */

import { hashPassword, verifyPassword, validatePasswordStrength, generateSecureToken } from './password';

async function testPasswordHashing() {
  console.log('🧪 Testing Password Hashing Implementation\n');

  // Test 1: Hash and verify password
  console.log('Test 1: Hash and verify password');
  const testPassword = 'MySecureP@ssw0rd123';
  try {
    const hash = await hashPassword(testPassword);
    console.log('✅ Password hashed successfully');
    console.log(`   Hash length: ${hash.length} characters`);
    console.log(`   Hash preview: ${hash.substring(0, 30)}...`);

    const isValid = await verifyPassword(hash, testPassword);
    console.log(`✅ Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    const isInvalid = await verifyPassword(hash, 'wrongpassword');
    console.log(`✅ Wrong password rejected: ${isInvalid ? 'FAILED' : 'SUCCESS'}\n`);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Password strength validation
  console.log('Test 2: Password strength validation');
  const weakPasswords = [
    'weak',
    'weak123',
    'Weak123',
    'MySecurePassword123', // Missing special char
  ];

  weakPasswords.forEach(password => {
    const validation = validatePasswordStrength(password);
    console.log(`   "${password}": ${validation.isValid ? '✅' : '⚠️'} ${validation.isValid ? 'Strong' : validation.issues.join(', ')}`);
  });

  const strongPassword = 'MySecureP@ssw0rd123!';
  const validation = validatePasswordStrength(strongPassword);
  console.log(`   "${strongPassword}": ${validation.isValid ? '✅' : '⚠️'} ${validation.isValid ? 'Strong' : validation.issues.join(', ')}\n`);

  // Test 3: Secure token generation
  console.log('Test 3: Secure token generation');
  try {
    const token = await generateSecureToken(32);
    console.log('✅ Token generated successfully');
    console.log(`   Token length: ${token.length} characters`);
    console.log(`   Token preview: ${token.substring(0, 20)}...\n`);
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('✨ All tests completed!');
}

// Run tests
testPasswordHashing().catch(console.error);

