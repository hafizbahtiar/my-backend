# Load Testing with k6

**Tech Stack:** Bun + Hono + MongoDB  
**Load Testing Tool:** k6 (Grafana k6)  
**Purpose:** Performance testing and benchmarking

---

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

**Verify Installation:**
```bash
k6 version
```

---

## Test Scripts

### 1. Authentication Load Test (`auth.test.js`)

Tests the authentication endpoints under load:
- User registration
- User login
- Token refresh

**Run:**
```bash
k6 run load-tests/auth.test.js --vus 50 --duration 10m
```

**With custom base URL:**
```bash
k6 run load-tests/auth.test.js -e BASE_URL=http://localhost:7000
```

**Results:**
- Registration success rate
- Login success rate
- Token refresh latency
- Response times
- Error rates

---

### 2. API Load Test (`api.test.js`)

Tests general API endpoints:
- Get user profile
- Health check
- Search users

**Run:**
```bash
k6 run load-tests/api.test.js
```

**With authenticated users:**
```bash
k6 run load-tests/api.test.js -e TEST_CREDENTIALS='[{"email":"user1@test.com","password":"password123"},{"email":"user2@test.com","password":"password123"}]'
```

**Results:**
- API response times
- Error rates
- Throughput
- Authentication performance

---

## Performance Targets

### Authentication Endpoints

| Metric | Target | Critical |
|--------|--------|----------|
| Login response time (p95) | < 500ms | < 1000ms |
| Registration response time (p95) | < 600ms | < 1200ms |
| Token refresh response time (p95) | < 300ms | < 600ms |
| Error rate | < 1% | < 5% |
| Success rate | > 99% | > 95% |

### General API Endpoints

| Metric | Target | Critical |
|--------|--------|----------|
| Profile response time (p95) | < 500ms | < 1000ms |
| Search response time (p95) | < 800ms | < 1500ms |
| Health check response time (p95) | < 100ms | < 200ms |
| Error rate | < 2% | < 5% |

---

## Running Tests

### Quick Start

1. **Start your server:**
   ```bash
   bun run dev
   ```

2. **Run authentication test:**
   ```bash
   k6 run load-tests/auth.test.js
   ```

3. **Run API test:**
   ```bash
   k6 run load-tests/api.test.js
   ```

### Custom Load Patterns

**Spike Test:**
```bash
k6 run --vus 10 --duration 1m load-tests/auth.test.js
```

**Stress Test:**
```bash
k6 run --vus 200 --duration 5m load-tests/auth.test.js
```

**Endurance Test:**
```bash
k6 run --vus 50 --duration 30m load-tests/auth.test.js
```

---

## Test Scenarios

### Scenario 1: Normal Load (50 Users)

Simulates normal traffic:
- 50 concurrent users
- 30% registration requests
- 40% login requests
- 30% token refresh requests

```bash
k6 run load-tests/auth.test.js -e VUS=50 -e DURATION=10m
```

### Scenario 2: Peak Load (200 Users)

Simulates peak traffic:
- 200 concurrent users
- Tests system capacity
- Identifies bottlenecks

```bash
k6 run load-tests/auth.test.js --vus 200 --duration 10m
```

### Scenario 3: Sustained Load (100 Users for 1 Hour)

Long-term stability test:
- 100 concurrent users
- 1 hour duration
- Tests memory leaks and resource cleanup

```bash
k6 run load-tests/auth.test.js --vus 100 --duration 1h
```

---

## Results Analysis

### Key Metrics

1. **Response Times**
   - Average, median, p95, p99
   - Look for outliers

2. **Throughput**
   - Requests per second
   - Data transfer rate

3. **Error Rates**
   - HTTP error rates
   - Business logic errors

4. **Resource Usage**
   - Server CPU
   - Server memory
   - Database connections

### Sample Output

```
✓ login status is 200
✓ login has access token
✓ login has refresh token
✓ login has user
✗ login response time < 500ms

checks.........................: 95.00% ✓ 380        ✗ 20
data_received..................: 1.2 MB 3.3 kB/s
data_sent......................: 450 kB 1.3 kB/s
http_req_duration..............: avg=450ms    min=120ms   med=380ms   max=2500ms  p(95)=950ms  p(99)=1800ms
http_req_failed................: 5.00%  ✓ 20         ✗ 380
iteration_duration.............: avg=1.45s    min=1.2s    med=1.3s    max=4.5s
vus............................: 50     min=50       max=50
```

---

## Benchmarking

### Baseline Performance

Run tests before optimizations to establish baseline:

```bash
# Run baseline test
k6 run load-tests/auth.test.js --out json=results/baseline.json

# Later: Compare with optimized version
k6 run load-tests/auth.test.js --out json=results/optimized.json
```

### Optimization Impact

Compare before and after:
- Response time improvements
- Throughput increases
- Error rate reductions

---

## Best Practices

### ✅ DO

1. **Start with low load**
   - Gradually increase concurrent users
   - Identify breaking points

2. **Test realistic scenarios**
   - Use actual user patterns
   - Include think time between requests

3. **Monitor server resources**
   - Watch CPU, memory, database
   - Use monitoring tools during tests

4. **Run tests in isolation**
   - Stop other services
   - Use dedicated test database

5. **Document results**
   - Save test results
   - Track performance trends

### ❌ DON'T

1. **Don't overload production**
   - Use staging/development environment
   - Be careful with database load

2. **Don't ignore errors**
   - Investigate error rates
   - Fix issues before scaling

3. **Don't test with dummy data only**
   - Use realistic data volumes
   - Test with production-like datasets

4. **Don't skip monitoring**
   - Monitor backend during tests
   - Track resource usage

---

## Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/load-test.yml`:

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load tests
        run: |
          k6 run load-tests/auth.test.js --summary-export=results.json
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

---

## Troubleshooting

### Common Issues

**"Connection refused"**
- Check if server is running
- Verify BASE_URL is correct

**"Rate limit exceeded"**
- Reduce VU count
- Increase sleep time between requests

**"Authentication failed"**
- Check test credentials
- Verify JWT_SECRET is correct

**"Slow response times"**
- Check database performance
- Monitor server resources
- Look for N+1 queries

---

## Advanced Options

### Custom Thresholds

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    iteration_duration: ['max<5000'],
  },
};
```

### Custom Scenarios

```javascript
export const options = {
  scenarios: {
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
    },
  },
};
```

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6/tree/master/examples)
- [k6 Best Practices](https://k6.io/docs/using-k6/metrics/)
- [Performance Testing Guide](https://k6.io/docs/test-types/)

---

*Created: 2025*

