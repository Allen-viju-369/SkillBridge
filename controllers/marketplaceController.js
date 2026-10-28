const Service = require('../models/Service');
const Category = require('../models/Category');
const User = require('../models/User');
const { getFreelancerPassport, calculateSkillMatch } = require('../services/passportService');

/**
 * Marketplace Controller
 * Handles search, multi-criteria filtering, sorting, pagination, and service detail views.
 */

const getMarketplace = async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      maxDelivery,
      sort = 'newest',
      page = 1
    } = req.query;

    const limit = 9;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    // Build filter query
    const filter = { isActive: true };

    // Search query
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skills: { $in: [searchRegex] } }
      ];
    }

    // Category filter
    let activeCategory = null;
    if (category && category !== 'all') {
      const foundCategory = await Category.findOne({
        $or: [{ slug: category }, { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }]
      });
      if (foundCategory) {
        filter.category = foundCategory._id;
        activeCategory = foundCategory;
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Delivery duration filter
    if (maxDelivery) {
      filter.deliveryDays = { $lte: Number(maxDelivery) };
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // default: newest
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

    // Execute queries with pagination
    const totalServices = await Service.countDocuments(filter);
    const totalPages = Math.ceil(totalServices / limit) || 1;

    const services = await Service.find(filter)
      .populate('freelancer', 'name profileImage isVerified college')
      .populate('category', 'name icon slug')
      .sort(sortOptions)
      .skip((currentPage - 1) * limit)
      .limit(limit);

    // Get all categories for sidebar filter
    const categories = await Category.find({ isActive: true });

    res.render('pages/marketplace', {
      title: 'Browse Freelance Services — SkillBridge',
      services,
      categories,
      activeCategory,
      totalServices,
      currentPage,
      totalPages,
      query: req.query
    });

  } catch (error) {
    console.error('[getMarketplace Error]', error);
    res.status(500).render('pages/error', {
      title: 'Marketplace Error',
      statusCode: 500,
      message: 'Failed to load services. Please try again.'
    });
  }
};

const getServiceDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).render('pages/error', {
        title: 'Service Not Found',
        statusCode: 404,
        message: 'The requested service listing does not exist.'
      });
    }

    const service = await Service.findById(id)
      .populate('freelancer')
      .populate('category');

    if (!service || (!service.isActive && req.session.user?._id !== service.freelancer._id.toString() && req.session.user?.role !== 'admin')) {
      return res.status(404).render('pages/error', {
        title: 'Service Unavailable',
        statusCode: 404,
        message: 'This service listing is no longer active or could not be found.'
      });
    }

    // Fetch Freelancer passport metrics (ratings, completed orders)
    const passportData = await getFreelancerPassport(service.freelancer._id);

    // Skill matching analysis (optional query param 'reqSkills' or default comparison)
    const clientRequestedSkills = req.query.matchSkills || service.skills.join(',');
    const skillMatchReport = calculateSkillMatch(service.freelancer.skills, clientRequestedSkills);

    // Similar services in the same category
    const relatedServices = await Service.find({
      category: service.category._id,
      _id: { $ne: service._id },
      isActive: true
    }).limit(3).populate('freelancer', 'name profileImage isVerified');

    res.render('pages/service-detail', {
      title: `${service.title} — SkillBridge`,
      service,
      passportData,
      skillMatchReport,
      relatedServices
    });

  } catch (error) {
    console.error('[getServiceDetail Error]', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      statusCode: 500,
      message: 'Failed to retrieve service details.'
    });
  }
};

const getFreelancerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(404).render('pages/error', {
        title: 'Freelancer Not Found',
        statusCode: 404,
        message: 'Invalid freelancer profile link.'
      });
    }

    const passportData = await getFreelancerPassport(id);

    if (!passportData) {
      return res.status(404).render('pages/error', {
        title: 'Freelancer Not Found',
        statusCode: 404,
        message: 'The requested student freelancer could not be found.'
      });
    }

    // Skill Match calculation if query string has skills
    let customMatch = null;
    if (req.query.skills) {
      customMatch = calculateSkillMatch(passportData.freelancer.skills, req.query.skills);
    }

    res.render('pages/freelancer-profile', {
      title: `${passportData.freelancer.name}'s Skill Passport — SkillBridge`,
      passport: passportData,
      customMatch
    });

  } catch (error) {
    console.error('[getFreelancerProfile Error]', error);
    res.status(500).render('pages/error', {
      title: 'Profile Error',
      statusCode: 500,
      message: 'Failed to load freelancer profile.'
    });
  }
};

module.exports = {
  getMarketplace,
  getServiceDetail,
  getFreelancerProfile
};
