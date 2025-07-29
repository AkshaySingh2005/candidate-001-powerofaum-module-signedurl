const http = require('http');
const app = require('./server');

// Simple test suite
function runTests() {
  console.log('🧪 Running PowerOfAum API Tests...\n');
  
  const testPort = 3001;
  const baseUrl = `http://localhost:${testPort}`;
  let testsPassed = 0;
  let totalTests = 0;

  function test(name, testFn) {
    totalTests++;
    console.log(`⏳ Running: ${name}`);
    
    testFn()
      .then(() => {
        testsPassed++;
        console.log(`✅ PASS: ${name}\n`);
      })
      .catch((error) => {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}\n`);
      });
  }

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${baseUrl}${path}`;
      http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      }).on('error', reject);
    });
  }

  // Start server for testing
  const server = app.listen(testPort, () => {
    console.log(`🚀 Test server started on port ${testPort}\n`);

    // Test 1: Health check
    test('Health check endpoint', async () => {
      const response = await makeRequest('/health');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.status !== 'healthy') throw new Error('Health check failed');
    });

    // Test 2: Valid signed URL generation
    test('Generate signed URL with valid parameters', async () => {
      const response = await makeRequest('/api/generate-signed-url?filePath=/videos/intro.mp4&userId=USER_001');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.success) throw new Error('Expected success: true');
      if (!response.data.signedUrl) throw new Error('Missing signedUrl in response');
      if (!response.data.signedUrl.includes('token=')) throw new Error('Signed URL missing token');
      if (!response.data.signedUrl.includes('expires=')) throw new Error('Signed URL missing expires');
    });

    // Test 3: Missing filePath parameter
    test('Handle missing filePath parameter', async () => {
      const response = await makeRequest('/api/generate-signed-url?userId=USER_001');
      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
      if (response.data.success !== false) throw new Error('Expected success: false');
      if (!response.data.error.includes('filePath')) throw new Error('Error message should mention filePath');
    });

    // Test 4: Missing userId parameter
    test('Handle missing userId parameter', async () => {
      const response = await makeRequest('/api/generate-signed-url?filePath=/videos/intro.mp4');
      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
      if (response.data.success !== false) throw new Error('Expected success: false');
      if (!response.data.error.includes('userId')) throw new Error('Error message should mention userId');
    });

    // Test 5: Invalid filePath format
    test('Handle invalid filePath format', async () => {
      const response = await makeRequest('/api/generate-signed-url?filePath=invalid-path&userId=USER_001');
      if (response.status !== 400) throw new Error(`Expected 400, got ${response.status}`);
      if (response.data.success !== false) throw new Error('Expected success: false');
      if (!response.data.error.toLowerCase().includes('invalid')) throw new Error('Error message should mention invalid format');
    });

    // Test 6: API stats endpoint
    test('API stats endpoint', async () => {
      const response = await makeRequest('/api/stats');
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (typeof response.data.totalTokensGenerated !== 'number') throw new Error('Missing totalTokensGenerated');
      if (typeof response.data.activeTokens !== 'number') throw new Error('Missing activeTokens');
    });

    // Test 7: 404 for invalid endpoint
    test('404 for invalid endpoint', async () => {
      const response = await makeRequest('/api/invalid-endpoint');
      if (response.status !== 404) throw new Error(`Expected 404, got ${response.status}`);
      if (response.data.success !== false) throw new Error('Expected success: false');
    });

    // Wait for all tests to complete
    setTimeout(() => {
      console.log('📊 Test Results:');
      console.log(`   Tests Passed: ${testsPassed}/${totalTests}`);
      console.log(`   Success Rate: ${Math.round((testsPassed/totalTests) * 100)}%`);
      
      if (testsPassed === totalTests) {
        console.log('\n🎉 All tests passed! The API is working correctly.');
      } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
      }
      
      server.close();
      process.exit(testsPassed === totalTests ? 0 : 1);
    }, 2000);
  });
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = runTests;
