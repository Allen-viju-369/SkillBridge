const Order = require('../models/Order');
const Review = require('../models/Review');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * Student Skill Passport Service
 * Core innovation engine computing dynamic academic credentials, 
 * verified project metrics, and rule-based skill alignment.
 */

/**
 * Computes verifiable metrics for a student freelancer from real database records
 * @param {string|ObjectId} freelancerId 
 */
const getFreelancerPassport = async (freelancerId) => {
  const freelancer = await User.findById(freelancerId).select('-passwordHash');
  if (!freelancer || freelancer.role !== 'student') {
    return null;
  }

  // 1. Calculate actual completed projects from verified database orders
  const completedProjectsCount = await Order.countDocuments({
    freelancer: freelancerId,
    status: 'completed'
  });

  // 2. Fetch all real client reviews and calculate aggregate rating
  const reviews = await Review.find({ freelancer: freelancerId })
    .populate('client', 'name profileImage')
    .populate('service', 'title')
    .sort({ createdAt: -1 });

  let totalRating = 0;
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  reviews.forEach(r => {
    totalRating += r.rating;
    const rounded = Math.round(r.rating);
    if (ratingDistribution[rounded] !== undefined) {
      ratingDistribution[rounded]++;
    }
  });

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

  // 3. Active service listings
  const services = await Service.find({
    freelancer: freelancerId,
    isActive: true
  }).populate('category', 'name icon');

  return {
    freelancer,
    metrics: {
      completedProjectsCount,
      averageRating,
      reviewCount,
      ratingDistribution
    },
    reviews,
    services
  };
};

/**
 * Transparent Rule-Based Skill Matcher
 * Compares client's requested skills with freelancer's declared skills
 * @param {Array<string>} freelancerSkills 
 * @param {Array<string>|string} requestedSkills 
 * @returns {Object} Transparent match report
 */
const calculateSkillMatch = (freelancerSkills = [], requestedSkills = []) => {
  // Normalize skills
  const normalize = (str) => String(str).toLowerCase().trim().replace(/[^a-z0-9+#]/g, '');

  let reqList = [];
  if (Array.isArray(requestedSkills)) {
    reqList = requestedSkills.map(normalize).filter(Boolean);
  } else if (typeof requestedSkills === 'string') {
    reqList = requestedSkills.split(/[,;\s]+/).map(normalize).filter(Boolean);
  }

  const freeList = freelancerSkills.map(normalize).filter(Boolean);

  if (reqList.length === 0) {
    return {
      matchPercentage: 100,
      matchedSkills: freeList,
      missingSkills: [],
      methodology: 'Rule-Based Exact & Token Overlap (No specific requirements filtered)',
      isRuleBased: true
    };
  }

  const matched = [];
  const missing = [];

  reqList.forEach(req => {
    // Check direct equality or substring inclusion
    const hasMatch = freeList.some(free => free === req || free.includes(req) || req.includes(free));
    if (hasMatch) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  });

  // Calculate percentage
  const matchPercentage = Math.round((matched.length / reqList.length) * 100);

  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
    totalRequired: reqList.length,
    methodology: 'Rule-Based Set-Overlap Index: (Matched Skills / Required Skills) * 100',
    isRuleBased: true
  };
};

module.exports = {
  getFreelancerPassport,
  calculateSkillMatch
};
