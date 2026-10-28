require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  console.log('\n======================================================');
  console.log('🔍 Testing MongoDB Connection...');
  console.log('======================================================');

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI is not defined in your .env file!');
    process.exit(1);
  }

  const sanitized = uri.includes('@') ? '***@' + uri.split('@')[1] : uri;
  console.log(`Connecting to: ${sanitized}\n`);

  try {
    const start = Date.now();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    const duration = Date.now() - start;

    console.log('✅ SUCCESS: Connected to MongoDB successfully!');
    console.log(`⏱️ Response Time: ${duration}ms`);
    console.log(`📁 Database Name: ${mongoose.connection.name}`);
    console.log(`🌐 Host:          ${mongoose.connection.host}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Collections (${collections.length}):`, collections.map(c => c.name).join(', ') || 'None yet');

    // Count categories
    if (collections.some(c => c.name === 'categories')) {
      const Category = require('../models/Category');
      const count = await Category.countDocuments();
      console.log(`🏷️  Category Count: ${count}`);
    }

    console.log('======================================================\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED: Could not connect to MongoDB.');
    console.error(`Error: ${error.message}\n`);
    console.log('Troubleshooting tips:');
    console.log('1. If using MongoDB Atlas: Check that your IP address is whitelisted (Network Access -> Allow 0.0.0.0/0).');
    console.log('2. Verify the username and password in MONGODB_URI (no special characters like @ in password without URL-encoding).');
    console.log('3. Ensure the database name is specified before the query string: ...mongodb.net/skillbridge?retryWrites=true...\n');
    console.log('======================================================\n');
    process.exit(1);
  }
}

testConnection();
