require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

/**
 * Admin Setup Script
 * Creates the initial administrator account from environment variables.
 * Ensures there is no public admin registration route.
 */
const createAdmin = async () => {
  const adminName = process.env.ADMIN_NAME || 'Platform Administrator';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Admin Setup Error] Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment configuration (.env).');
    console.error('Please configure ADMIN_EMAIL and ADMIN_PASSWORD before running this script.');
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('[Admin Setup Error] ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }

  await connectDB();

  const normalizedEmail = adminEmail.toLowerCase().trim();

  // Check if an admin already exists with this email or with role admin
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.role === 'admin') {
      console.log(`[Admin Setup] Administrator account with email "${normalizedEmail}" already exists. No action needed.`);
    } else {
      console.warn(`[Admin Setup] User "${normalizedEmail}" exists with role "${existingUser.role}". Promoting to administrator...`);
      existingUser.role = 'admin';
      existingUser.isVerified = true;
      existingUser.accountStatus = 'active';
      await existingUser.save();
      console.log(`[Admin Setup] Successfully promoted "${normalizedEmail}" to administrator.`);
    }
    await disconnectDB();
    return;
  }

  // Create new administrator account
  const passwordHash = await User.hashPassword(adminPassword);

  const newAdmin = await User.create({
    name: adminName.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
    isVerified: true,
    accountStatus: 'active',
    bio: 'Platform Administrator overseeing platform security, service moderation, and student verification.'
  });

  console.log(`[Admin Setup] Successfully created administrator account:`);
  console.log(`   Name:  ${newAdmin.name}`);
  console.log(`   Email: ${newAdmin.email}`);
  console.log(`   Role:  ${newAdmin.role}`);

  await disconnectDB();
};

if (require.main === module) {
  createAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Admin Setup Fatal]', err);
      process.exit(1);
    });
}

module.exports = { createAdmin };
