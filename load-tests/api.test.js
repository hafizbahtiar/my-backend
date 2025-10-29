import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const apiErrorRate = new Rate('api_errors');
const profileResponseTime = new Trend('profile_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 50 },    // Ramp up to 50 users
    { duration: '3m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1200'], // 95% < 800ms, 99% < 1200ms
    http_req_failed: ['rate<0.02'],                 // Less than 2% failures
    api_errors: ['rate<0.01'],                      // Less than 1% API errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:7000';
const API_URL = `${BASE_URL}/api`;

// Test data from environment or setup
let authTokens = [];

// Setup: Login to get access tokens
export function setup() {
  console.log('🚀 Starting API load test setup...');
  
  const credentials = JSON.parse(__ENV.TEST_CREDENTIALS || '[]');
  
  if (credentials.length === 0) {
    console.log('⚠️ No test credentials provided. Using dummy tokens.');
    // Fallback: Return dummy data for testing
    return { tokens: ['dummy-token'] };
  }
  
  // Login with provided credentials to get tokens
  for (const cred of credentials) {
    const payload = JSON.stringify({
      email: cred.email,
      password: cred.password,
    });
    
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (res.status === 200) {
      const data = JSON.parse(res.body);
      authTokens.push(data.data.accessToken);
    }
    
    sleep(0.1);
  }
  
  console.log(`✅ Setup complete: ${authTokens.length} tokens obtained`);
  
  return { tokens: authTokens };
}

// Main test
export default function (data) {
  const tokens = data.tokens;
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  
  const testType = Math.random();
  
  if (testType < 0.4) {
    // 40% of requests: Get User Profile
    testGetProfile(token);
  } else if (testType < 0.7) {
    // 30% of requests: Health Check
    testHealthCheck();
  } else {
    // 30% of requests: Search Users
    testSearchUsers(token);
  }
  
  sleep(1); // Think time
}

// Test: Get User Profile
function testGetProfile(token) {
  const startTime = Date.now();
  
  const res = http.get(`${API_URL}/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const duration = Date.now() - startTime;
  profileResponseTime.add(duration);
  
  const success = check(res, {
    'profile status is 200': (r) => r.status === 200,
    'profile has user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data.id !== undefined && body.data.firstName !== undefined;
      } catch {
        return false;
      }
    },
    'profile response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  apiErrorRate.add(!success);
}

// Test: Health Check
function testHealthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check has database status': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.database !== undefined;
      } catch {
        return false;
      }
    },
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
}

// Test: Search Users
function testSearchUsers(token) {
  const searchTerms = ['test', 'john', 'user', 'admin'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const res = http.get(`${API_URL}/user/search?q=${term}&limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const success = check(res, {
    'search status is 200': (r) => r.status === 200,
    'search has results array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
    'search response time < 800ms': (r) => r.timings.duration < 800,
  });
  
  apiErrorRate.add(!success);
}

// Teardown
export function teardown(data) {
  console.log('🧹 Teardown: API load test complete');
  console.log(`📊 Test completed with ${data.tokens.length} authenticated users`);
}

