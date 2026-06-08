const http = require('http');
const mongoose = require('mongoose');
const User = require('./models/User');

const PORT = 5001;
process.env.PORT = PORT;
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbharat';
process.env.JWT_SECRET = 'test_secret';

// Start the server
const server = require('./server');

const makeRequest = (method, path, body) => {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body || {});
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: responseBody
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(dataString);
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- Starting Auth and Email Tests ---');
  
  // Connect to DB directly for cleanup
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clean up any old test user
  const testEmail = 'testuser@example.com';
  await User.deleteOne({ email: testEmail });
  console.log('Cleaned up previous test user.');

  try {
    // 1. Test registration
    console.log('\nTesting POST /api/auth/register...');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Test Traveler',
      email: testEmail,
      password: 'password123',
      mobile: '9876543210'
    });
    console.log('Register Response Status:', regRes.statusCode);
    console.log('Register Response Body:', regRes.body);
    if (regRes.statusCode !== 201) {
      throw new Error('Registration failed');
    }

    // 2. Test login
    console.log('\nTesting POST /api/auth/login...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: 'password123'
    });
    console.log('Login Response Status:', loginRes.statusCode);
    console.log('Login Response Body:', loginRes.body);
    if (loginRes.statusCode !== 200) {
      throw new Error('Login failed');
    }

    // 3. Test forgot-password (OTP generation & expiry check)
    console.log('\nTesting POST /api/auth/forgot-password...');
    const forgotRes = await makeRequest('POST', '/api/auth/forgot-password', {
      email: testEmail
    });
    console.log('Forgot Password Response Status:', forgotRes.statusCode);
    console.log('Forgot Password Response Body:', forgotRes.body);
    if (forgotRes.statusCode !== 200) {
      throw new Error('Forgot password request failed');
    }

    // Verify OTP expiry is 15 minutes
    const user = await User.findOne({ email: testEmail });
    if (!user.otpExpires) {
      throw new Error('OTP expiry time not set in DB');
    }
    
    const minutesLeft = Math.round((user.otpExpires - Date.now()) / (60 * 1000));
    console.log(`\nOTP Expiry verified in DB: expires in ${minutesLeft} minutes (expected: ~15 minutes).`);
    if (minutesLeft < 14 || minutesLeft > 16) {
      throw new Error(`OTP expiration time is not 15 minutes. It is set to ${minutesLeft} minutes.`);
    }

    console.log('\n--- All Email Notification & Auth Integration Tests Passed! ---');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up
    await User.deleteOne({ email: testEmail });
    mongoose.connection.close();
    process.exit(0);
  }
}

// Wait for server to boot, then run tests
setTimeout(runTests, 1000);
