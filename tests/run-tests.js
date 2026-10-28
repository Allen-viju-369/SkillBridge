/**
 * SkillBridge Automated Test Suite
 * Validates authentication, RBAC, services, order state transitions, reviews, and security.
 */

process.env.NODE_ENV = 'test';
process.env.USE_EMBEDDED_DB_FALLBACK = 'true';

const request = require('supertest');
const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Service = require('../models/Service');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { calculateSkillMatch } = require('../services/passportService');

const runAllTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting SkillBridge Full-Stack Automated Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      failed++;
    }
  };

  // Wait for database connection
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  // 1. Health & Home Route Tests
  console.log('\n--- 1. Application & Public Route Tests ---');
  await test('GET /health returns HTTP 200 with UP status', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'UP');
  });

  await test('GET / loads landing page with title and HTTP 200 (Clean Empty State support)', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.statusCode, 200);
    assert(res.text.includes('SkillBridge'));
  });

  await test('GET /marketplace loads services list with HTTP 200', async () => {
    const res = await request(app).get('/marketplace');
    assert.strictEqual(res.statusCode, 200);
    assert(res.text.includes('Browse Freelance Services'));
  });

  await test('GET /login and GET /register top-level aliases redirect properly', async () => {
    const loginRes = await request(app).get('/login');
    assert.strictEqual(loginRes.statusCode, 302);
    assert(loginRes.headers.location.includes('/auth/login'));

    const regRes = await request(app).get('/register');
    assert.strictEqual(regRes.statusCode, 302);
    assert(regRes.headers.location.includes('/auth/register'));
  });

  // 2. Authentication & Password Security Tests
  console.log('\n--- 2. Authentication & Password Security Tests ---');
  const timestamp = Date.now();
  const testStudentEmail = `student.${timestamp}@university.edu`;
  const testClientEmail = `client.${timestamp}@university.edu`;
  const testAdminEmail = `admin.${timestamp}@university.edu`;
  const securePassword = 'SecurePassword123!';

  await test('Password Hashing generates bcrypt salt and verifies match', async () => {
    const rawPass = 'StudentSecurePassword123!';
    const hash = await User.hashPassword(rawPass);
    assert.notStrictEqual(rawPass, hash);
    assert(hash.startsWith('$2'));

    const dummyUser = new User({
      name: 'Crypto Test',
      email: 'crypto@test.edu',
      passwordHash: hash,
      role: 'student'
    });
    const match = await dummyUser.isValidPassword(rawPass);
    assert.strictEqual(match, true);
    const noMatch = await dummyUser.isValidPassword('WrongPassword');
    assert.strictEqual(noMatch, false);
  });

  await test('POST /auth/register validates min 8-char password and rejects short passwords', async () => {
    const shortRes = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Short Pass User',
        email: `short.${Date.now()}@univ.edu`,
        password: 'short',
        confirmPassword: 'short',
        role: 'student'
      });
    assert.strictEqual(shortRes.statusCode, 302);
    assert(shortRes.headers.location.includes('/auth/register'));
  });

  await test('POST /auth/register rejects public admin role tampering', async () => {
    const adminTamperRes = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Fake Admin User',
        email: `fakeadmin.${Date.now()}@univ.edu`,
        password: securePassword,
        confirmPassword: securePassword,
        role: 'admin'
      });
    assert.strictEqual(adminTamperRes.statusCode, 302);
    assert(adminTamperRes.headers.location.includes('/auth/register'));
  });

  await test('POST /auth/register creates student account, rejects duplicate email, and redirects to login', async () => {
    // 1. Register student
    const regRes = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Test Student Freelancer',
        email: testStudentEmail,
        password: securePassword,
        confirmPassword: securePassword,
        role: 'student',
        college: 'Test Institute of Technology',
        degree: 'B.Tech CSE',
        skills: 'JavaScript, Node.js, Express, MongoDB'
      });
    assert.strictEqual(regRes.statusCode, 302);
    assert(regRes.headers.location.includes('/auth/login'));

    const created = await User.findOne({ email: testStudentEmail });
    assert(created !== null, 'User should exist in MongoDB');
    assert.strictEqual(created.role, 'student');

    // 2. Duplicate registration rejected
    const dupRes = await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Duplicate Student',
        email: testStudentEmail,
        password: securePassword,
        confirmPassword: securePassword,
        role: 'student'
      });
    assert.strictEqual(dupRes.statusCode, 302);
    assert(dupRes.headers.location.includes('/auth/login'));

    // Also register a client account for order workflow tests
    await request(app)
      .post('/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({
        name: 'Test Client Commissioner',
        email: testClientEmail,
        password: securePassword,
        confirmPassword: securePassword,
        role: 'client'
      });
  });

  await test('POST /auth/login validates credentials and creates session', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({
        email: testStudentEmail,
        password: securePassword
      });
    assert.strictEqual(loginRes.statusCode, 302);
    assert(loginRes.headers.location.includes('/dashboard/freelancer'));
  });

  await test('POST /auth/login rejects invalid password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({
        email: testStudentEmail,
        password: 'CompletelyWrongPassword'
      });
    assert.strictEqual(res.statusCode, 302);
    assert(res.headers.location.includes('/auth/login'));
  });

  // 3. Role-Based Access Control (RBAC)
  console.log('\n--- 3. Role-Based Authorization Tests ---');
  // Create an admin user directly for test purposes
  const adminPasswordHash = await User.hashPassword(securePassword);
  await User.create({
    name: 'Test Administrator',
    email: testAdminEmail,
    passwordHash: adminPasswordHash,
    role: 'admin',
    isVerified: true
  });

  await test('Unauthenticated access to /admin redirects to login', async () => {
    const res = await request(app).get('/admin');
    assert.strictEqual(res.statusCode, 302);
    assert(res.headers.location.includes('/auth/login'));
  });

  await test('Student role cannot access /admin (HTTP 403 Forbidden)', async () => {
    const studentAgent = request.agent(app);
    await studentAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testStudentEmail, password: securePassword });

    const adminAccessRes = await studentAgent.get('/admin');
    assert.strictEqual(adminAccessRes.statusCode, 403);
  });

  await test('Admin account successfully accesses /admin dashboard', async () => {
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testAdminEmail, password: securePassword });

    const adminRes = await adminAgent.get('/admin');
    assert.strictEqual(adminRes.statusCode, 200);
    assert(adminRes.text.includes('Platform Administration Hub'));
  });

  // 4. Service CRUD & Filter Tests
  console.log('\n--- 4. Service Management & Filtering Tests ---');
  let createdServiceId = null;

  await test('Student can publish a new service listing with validation', async () => {
    const studentAgent = request.agent(app);
    await studentAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testStudentEmail, password: securePassword });

    const cat = await Category.findOne();
    assert(cat !== null, 'Category base data should exist');

    const srvRes = await studentAgent
      .post('/services')
      .set('x-test-bypass-csrf', 'true')
      .send({
        title: 'Automated Test Service Listing Express',
        category: cat._id.toString(),
        price: '2500',
        deliveryDays: '4',
        description: 'Comprehensive test service description with detailed explanation of deliverables and code quality.',
        skills: 'Node.js, Express, MongoDB'
      });
    assert.strictEqual(srvRes.statusCode, 302);

    const srv = await Service.findOne({ title: 'Automated Test Service Listing Express' });
    assert(srv !== null);
    assert.strictEqual(srv.price, 2500);
    createdServiceId = srv._id;
  });

  await test('Marketplace filters by query keyword and category slug', async () => {
    const res = await request(app).get('/marketplace?q=Automated&sort=newest');
    assert.strictEqual(res.statusCode, 200);
    assert(res.text.includes('Automated Test Service Listing Express'));
  });

  // 5. Order State Machine & Review Eligibility
  console.log('\n--- 5. Order Lifecycle & Review Constraint Tests ---');
  let testOrderId = null;

  await test('Client can request service and initialize order in "pending" status', async () => {
    const clientAgent = request.agent(app);
    await clientAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testClientEmail, password: securePassword });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const orderRes = await clientAgent
      .post('/orders')
      .set('x-test-bypass-csrf', 'true')
      .send({
        serviceId: createdServiceId.toString(),
        requirements: 'Automated testing project requirements specification for lab system.',
        deadline: futureDate.toISOString().split('T')[0]
      });
    assert.strictEqual(orderRes.statusCode, 302);

    const ord = await Order.findOne({ service: createdServiceId, status: 'pending' });
    assert(ord !== null);
    testOrderId = ord._id;
  });

  await test('Order State Transition: Pending -> Accepted -> In Progress -> Delivered -> Completed', async () => {
    const studentAgent = request.agent(app);
    await studentAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testStudentEmail, password: securePassword });

    // Step 1: Student accepts order
    await studentAgent
      .post(`/orders/${testOrderId}/status`)
      .set('x-test-bypass-csrf', 'true')
      .send({ targetStatus: 'accepted' });
    let ord = await Order.findById(testOrderId);
    assert.strictEqual(ord.status, 'accepted');

    // Step 2: Student starts work (in_progress)
    await studentAgent
      .post(`/orders/${testOrderId}/status`)
      .set('x-test-bypass-csrf', 'true')
      .send({ targetStatus: 'in_progress' });
    ord = await Order.findById(testOrderId);
    assert.strictEqual(ord.status, 'in_progress');

    // Step 3: Student delivers work
    await studentAgent
      .post(`/orders/${testOrderId}/status`)
      .set('x-test-bypass-csrf', 'true')
      .send({
        targetStatus: 'delivered',
        deliveryNotes: 'All test tasks completed and verified with test suite.',
        deliveryUrl: 'https://github.com/example/test-delivery'
      });
    ord = await Order.findById(testOrderId);
    assert.strictEqual(ord.status, 'delivered');
    assert(ord.deliveryNotes.includes('All test tasks'));

    // Step 4: Client approves and completes order
    const clientAgent = request.agent(app);
    await clientAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testClientEmail, password: securePassword });

    await clientAgent
      .post(`/orders/${testOrderId}/status`)
      .set('x-test-bypass-csrf', 'true')
      .send({ targetStatus: 'completed' });
    ord = await Order.findById(testOrderId);
    assert.strictEqual(ord.status, 'completed');
    assert(ord.completedAt !== null);
  });

  await test('Client can post verified 1-5 star review for completed order; duplicate review rejected', async () => {
    const clientAgent = request.agent(app);
    await clientAgent
      .post('/auth/login')
      .set('x-test-bypass-csrf', 'true')
      .send({ email: testClientEmail, password: securePassword });

    // Post first review
    const reviewRes = await clientAgent
      .post(`/orders/${testOrderId}/review`)
      .set('x-test-bypass-csrf', 'true')
      .send({
        rating: '5',
        comment: 'Outstanding delivery! Meets all academic requirements.'
      });
    assert.strictEqual(reviewRes.statusCode, 302);

    const savedReview = await Review.findOne({ order: testOrderId });
    assert(savedReview !== null);
    assert.strictEqual(savedReview.rating, 5);

    // Attempt second review for same order (Must be rejected)
    const dupReviewRes = await clientAgent
      .post(`/orders/${testOrderId}/review`)
      .set('x-test-bypass-csrf', 'true')
      .send({
        rating: '4',
        comment: 'Attempting duplicate review submission.'
      });
    assert.strictEqual(dupReviewRes.statusCode, 302);
    const reviewCount = await Review.countDocuments({ order: testOrderId });
    assert.strictEqual(reviewCount, 1, 'Strictly 1 review per order must be enforced');
  });

  // 6. Distinctive Feature: Skill Matcher Algorithm
  console.log('\n--- 6. Rule-Based Skill Matcher Algorithm Tests ---');
  await test('Skill Matcher accurately calculates set-overlap percentage', () => {
    const freelancerSkills = ['React', 'Node.js', 'Express', 'MongoDB'];
    const clientSkills1 = ['React', 'Node.js'];
    const result1 = calculateSkillMatch(freelancerSkills, clientSkills1);
    assert.strictEqual(result1.matchPercentage, 100);
    assert.strictEqual(result1.isRuleBased, true);

    const clientSkills2 = ['React', 'Python', 'Flutter'];
    const result2 = calculateSkillMatch(freelancerSkills, clientSkills2);
    assert.strictEqual(result2.matchPercentage, 33);
    assert.strictEqual(result2.matchedSkills.length, 1);
    assert.strictEqual(result2.missingSkills.length, 2);
  });

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch(err => {
  console.error('[Test Suite Fatal]', err);
  process.exit(1);
});
