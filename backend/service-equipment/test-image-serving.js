// test-image-serving.js
// Script to test if images are being served correctly from the equipment service

const http = require('http');
const fs = require('fs');
const path = require('path');

// Make sure we have the test image
const setupUploads = require('./setup-uploads');

// Test the image URLs
const testUrls = [
  // Test direct uploads path with MongoDB ObjectID format
  'http://localhost:5020/uploads/507f1f77bcf86cd799439011-1759014427709-123456789.png',
  // Test API path format
  'http://localhost:5020/api/equipment/uploads/507f1f77bcf86cd799439011-1759014427709-123456789.png',
  // Test placeholder
  'http://localhost:5020/uploads/placeholder-equipment.png'
];

console.log('Testing equipment image serving...\n');

// Function to test a URL
async function testUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`Testing URL: ${url}`);
    
    const req = http.get(url, (res) => {
      console.log(`Response status: ${res.statusCode}`);
      
      if (res.statusCode !== 200) {
        console.error(`Failed to access ${url} - Status: ${res.statusCode}`);
        return resolve({
          url,
          success: false,
          status: res.statusCode
        });
      }
      
      const contentType = res.headers['content-type'];
      console.log(`Content-Type: ${contentType}`);
      
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const dataLength = Buffer.concat(data).length;
        console.log(`Received ${dataLength} bytes\n`);
        resolve({
          url,
          success: true,
          status: res.statusCode,
          contentType,
          size: dataLength
        });
      });
    });
    
    req.on('error', (err) => {
      console.error(`Error accessing ${url}:`, err.message);
      resolve({
        url,
        success: false,
        error: err.message
      });
    });
    
    req.end();
  });
}

// Run the tests sequentially
async function runTests() {
  console.log('Starting tests...');
  
  const results = [];
  
  for (const url of testUrls) {
    const result = await testUrl(url);
    results.push(result);
  }
  
  // Report summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  
  let passCount = 0;
  let failCount = 0;
  
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ PASS: ${result.url}`);
      passCount++;
    } else {
      console.log(`❌ FAIL: ${result.url} - ${result.status || result.error}`);
      failCount++;
    }
  });
  
  console.log(`\nTests completed: ${passCount} passed, ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the configuration and try again.');
  } else {
    console.log('\n🎉 All tests passed! The equipment service is serving images correctly.');
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
});