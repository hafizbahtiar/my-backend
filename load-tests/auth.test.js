import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const authFailureRate = new Rate('auth_failures');
const registrationSuccessRate = new Rate('registration_success');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users over 1 minute
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% requests < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% failures
    auth_failures: ['rate<0.05'],                    // Less than 5% auth failures
    registration_success: ['rate>0.95'],             // 95% success rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:7000';
const API_URL = `${BASE_URL}/api/auth`;

// Helper function to generate random email
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testuser_${timestamp}_${random}@example.com`;
}

// Test data
const testUsers = [];

// Setup: Register users for testing
export function setup() {
  console.log('🚀 Starting authentication load test setup...');
  
  // Register 10 users for login tests
  for (let i = 0; i < 10; i++) {
    const email = generateRandomEmail();
    const username = `@testuser_${i}_${Date.now()}`;
    const password = 'TestPassword123!';
    
    const payload = JSON.stringify({
      email: email,
      password: password,
      firstName: `Test${i}`,
      lastName: 'User',
      username: username,
    });
    
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };
    
    const res = http.post(`${API_URL}/register`, payload, params);
    
    if (res.status === 201) {
      testUsers.push({ email, password });
    }
    
    sleep(0.1); // Small delay to avoid rate limiting
  }
  
  console.log(`✅ Setup complete: ${testUsers.length} users registered`);
  
  return { testUsers };
}

// Main test
export default function (data) {
  const testType = Math.random();
  const user = data.testUsers[Math.floor(Math.random() * data.testUsers.length)];
  
  if (testType < 0.3) {
    // 30% of requests: User Registration
    testRegistration();
  } else if (testType < 0.7) {
    // 40% of requests: User Login
    testLogin(user);
  } else {
    // 30% of requests: Token Refresh
    testTokenRefresh(user);
  }
  
  sleep(1); // Think time between requests
}

// Test: User Registration
function testRegistration() {
  const email = generateRandomEmail();
  const username = `@user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  
  const payload = JSON.stringify({
    email: email,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    username: username,
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const res = http.post(`${API_URL}/register`, payload, params);
  
  const success = check(res, {
    'registration status is 201': (r) => r.status === 201,
    'registration has user': (r) => JSON.parse(r.body).data.user !== undefined,
    'registration has account': (r) => JSON.parse(r.body).data.account !== undefined,
  });
  
  registrationSuccessRate.add(success);
}

// Test: User Login
function testLogin(user) {
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const res = http.post(`${API_URL}/login`, payload, params);
  
  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => JSON.parse(r.body).data.accessToken !== undefined,
    'login has refresh token': (r) => JSON.parse(r.body).data.refreshToken !== undefined,
    'login has user': (r) => JSON.parse(r.body).data.user !== undefined,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  authFailureRate.add(!success);
  
  return res;
}

// Test: Token Refresh
function testTokenRefresh(user) {
  // First, login to get tokens
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginRes = http.post(`${API_URL}/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (loginRes.status !== 200) {
    return;
  }
  
  const loginData = JSON.parse(loginRes.body);
  const refreshToken = loginData.data.refreshToken;
  
  // Now test refresh
  const refreshPayload = JSON.stringify({
    refreshToken: refreshToken,
  });
  
  const res = http.post(`${API_URL}/refresh`, refreshPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(res, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh has new access token': (r) => JSON.parse(r.body).data.accessToken !== undefined,
    'refresh response time < 300ms': (r) => r.timings.duration < 300,
  });
}

// Teardown: Clean up test data
export function teardown(data) {
  console.log('🧹 Teardown: Cleaning up test users...');
  // In a real scenario, you might want to delete test users
  // For load testing, we'll leave them for analysis
  console.log('✅ Teardown complete');
}

