const Category = require('../models/Category');
const Service = require('../models/Service');
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');

/**
 * Home Controller
 * Aggregates dynamic platform statistics, popular categories, and featured services for the landing page.
 */
const getHome = async (req, res) => {
  try {
    // 1. Fetch categories
    const categories = await Category.find({ isActive: true }).limit(8);

    // 2. Fetch featured active services
    const featuredServices = await Service.find({ isActive: true })
      .populate('freelancer', 'name profileImage isVerified college')
      .populate('category', 'name icon')
      .sort({ createdAt: -1 })
      .limit(6);

    // 3. Fetch top student freelancers
    const topFreelancers = await User.find({ role: 'student', accountStatus: 'active' })
      .select('name college degree skills profileImage isVerified bio')
      .limit(4);

    // 4. Calculate actual dynamic platform statistics
    const [totalStudents, totalServices, completedOrders, reviews] = await Promise.all([
      User.countDocuments({ role: 'student', accountStatus: 'active' }),
      Service.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'completed' }),
      Review.find({}).select('rating')
    ]);

    const totalRatingsSum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const platformAvgRating = reviews.length > 0 ? (totalRatingsSum / reviews.length).toFixed(1) : '0.0';

    res.render('pages/home', {
      title: 'SkillBridge — Freelance Student Marketplace',
      categories,
      featuredServices,
      topFreelancers,
      stats: {
        totalStudents,
        totalServices,
        completedOrders,
        platformAvgRating,
        totalReviews: reviews.length
      }
    });

  } catch (error) {
    console.error('[getHome Error]', error);
    res.status(500).render('pages/error', {
      title: 'Server Error',
      statusCode: 500,
      message: 'Failed to load home page content. Please refresh.'
    });
  }
};

module.exports = {
  getHome
};
