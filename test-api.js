/**
 * @fileoverview Simple test script for the Message Mural API
 * Tests both GET and POST endpoints locally
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3001';

/**
 * Makes an HTTP request
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} data - Request body data (for POST)
 * @returns {Promise<Object>} Response data
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(responseData);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Tests the GET /api/messages endpoint
 */
async function testGetMessages() {
  console.log('🔍 Testing GET /api/messages...');
  
  try {
    const response = await makeRequest('GET', '/api/messages');
    
    if (response.statusCode === 200) {
      console.log('✅ GET /api/messages - Success');
      console.log(`   Found ${response.body.length} messages`);
      return true;
    } else {
      console.log(`❌ GET /api/messages - Failed with status ${response.statusCode}`);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ GET /api/messages - Error:', error.message);
    return false;
  }
}

/**
 * Tests the POST /api/messages endpoint
 */
async function testPostMessage() {
  console.log('📝 Testing POST /api/messages...');
  
  const testMessage = {
    content: `Test message from API test script - ${new Date().toISOString()}`,
    author: 'API Test Script'
  };
  
  try {
    const response = await makeRequest('POST', '/api/messages', testMessage);
    
    if (response.statusCode === 201) {
      console.log('✅ POST /api/messages - Success');
      console.log('   Created message:', response.body.id);
      return true;
    } else {
      console.log(`❌ POST /api/messages - Failed with status ${response.statusCode}`);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ POST /api/messages - Error:', error.message);
    return false;
  }
}

/**
 * Tests input validation
 */
async function testValidation() {
  console.log('🛡️  Testing input validation...');
  
  const invalidMessage = {
    content: '', // Empty content should fail
    author: 'Test'
  };
  
  try {
    const response = await makeRequest('POST', '/api/messages', invalidMessage);
    
    if (response.statusCode === 400) {
      console.log('✅ Input validation - Success (correctly rejected empty content)');
      return true;
    } else {
      console.log(`❌ Input validation - Failed (should have returned 400, got ${response.statusCode})`);
      return false;
    }
  } catch (error) {
    console.log('❌ Input validation - Error:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting API tests...');
  console.log(`📡 Testing API at: ${API_BASE_URL}`);
  console.log('');
  
  // Check if API server is running
  try {
    await makeRequest('GET', '/api/messages');
  } catch (error) {
    console.log('❌ API server is not running!');
    console.log('   Please start the API server first:');
    console.log('   npm run api:local');
    process.exit(1);
  }
  
  const results = [];
  
  // Run tests
  results.push(await testGetMessages());
  console.log('');
  
  results.push(await testPostMessage());
  console.log('');
  
  results.push(await testValidation());
  console.log('');
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed!');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testGetMessages, testPostMessage, testValidation };

